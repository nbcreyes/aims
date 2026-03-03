const TermGrade = require("../models/TermGrade");
const Schedule = require("../models/ClassSchedule");
const Enrollment = require("../models/Enrollment");
const Semester = require("../models/Semester");
const { isTermLocked, getLockStatus } = require("../utils/gradeLock");
const { computeGWAForStudent } = require("./studentController");

// Get gradesheet for a schedule (teacher view)
const getGradesheet = async (req, res) => {
  try {
    const { scheduleId } = req.query;
    if (!scheduleId) {
      return res
        .status(400)
        .json({ status: "error", message: "scheduleId is required" });
    }

    const schedule = await Schedule.findById(scheduleId)
      .populate("subjectId", "name code units")
      .populate("semesterId", "schoolYear term startDate")
      .populate("sectionId", "name");

    if (!schedule) {
      return res
        .status(404)
        .json({ status: "error", message: "Schedule not found" });
    }

    // Only the assigned teacher or admin can view
    if (
      req.user.role === "teacher" &&
      schedule.teacherId.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ status: "error", message: "Access denied" });
    }

    // Get enrolled students
    const enrollments = await Enrollment.find({
      scheduleId,
      status: "approved",
    }).populate("studentId", "name email");

    // Get all grades for this schedule
    const grades = await TermGrade.find({ scheduleId });

    // Get lock status for each term
    const lockStatus = getLockStatus(schedule.semesterId);

    // Build gradesheet
    const sheet = enrollments.map((enrollment) => {
      const studentGrades = {};
      for (const term of ["prelim", "midterm", "finals"]) {
        const g = grades.find(
          (gr) =>
            gr.studentId.toString() === enrollment.studentId._id.toString() &&
            gr.term === term,
        );
        studentGrades[term] = g || null;
      }
      return {
        student: enrollment.studentId,
        grades: studentGrades,
      };
    });

    res.json({
      status: "success",
      message: "Gradesheet fetched",
      data: {
        schedule,
        sheet,
        lockStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Get grades (filtered)
const getGrades = async (req, res) => {
  try {
    const filter = {};
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.semesterId) filter.semesterId = req.query.semesterId;
    if (req.query.scheduleId) filter.scheduleId = req.query.scheduleId;
    if (req.query.term) filter.term = req.query.term;

    // Students and parents only see published grades
    if (["student", "parent"].includes(req.user.role)) {
      filter.isPublished = true;
    }

    const grades = await TermGrade.find(filter)
      .populate({
        path: "scheduleId",
        populate: { path: "subjectId", select: "name code units" },
      })
      .populate("studentId", "name email")
      .sort({ term: 1 });

    res.json({ status: "success", message: "Grades fetched", data: grades });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Get student's own grades
const getMyGrades = async (req, res) => {
  try {
    const filter = {
      studentId: req.user._id,
      isPublished: true,
    };
    if (req.query.semesterId) filter.semesterId = req.query.semesterId;
    if (req.query.scheduleId) filter.scheduleId = req.query.scheduleId;

    const grades = await TermGrade.find(filter)
      .populate({
        path: "scheduleId",
        populate: { path: "subjectId", select: "name code units" },
      })
      .sort({ term: 1 });

    res.json({ status: "success", message: "Grades fetched", data: grades });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Compute class standing and term grade
const computeGrades = (data) => {
  const { quizzes, activities, assignments, examScore, examTotal } = data;

  const avg = (arr) => {
    if (!arr || arr.length === 0) return 0;
    const percentages = arr
      .filter((item) => item.total > 0)
      .map((item) => (item.score / item.total) * 100);
    if (percentages.length === 0) return 0;
    return percentages.reduce((a, b) => a + b, 0) / percentages.length;
  };

  const quizAvg = avg(quizzes);
  const activityAvg = avg(activities);
  const assignmentAvg = avg(assignments);
  const examPct = examTotal > 0 ? (examScore / examTotal) * 100 : 0;

  // Class standing = average of all components except exam
  const components = [];
  if (quizzes?.length > 0) components.push(quizAvg);
  if (activities?.length > 0) components.push(activityAvg);
  if (assignments?.length > 0) components.push(assignmentAvg);

  const classStanding =
    components.length > 0
      ? components.reduce((a, b) => a + b, 0) / components.length
      : 0;

  // Term grade = (classStanding * 0.5) + (exam% * 0.5)
  const termGrade = classStanding * 0.5 + examPct * 0.5;

  return { classStanding, termGrade, examPct };
};

// Compute cumulative grade based on term
const computeCumulative = async (studentId, scheduleId, term, termGrade) => {
  if (term === "prelim") return termGrade;

  if (term === "midterm") {
    const prelim = await TermGrade.findOne({
      studentId,
      scheduleId,
      term: "prelim",
    });
    const prelimGrade = prelim?.cumulativeGrade || 0;
    return termGrade * (2 / 3) + prelimGrade * (1 / 3);
  }

  if (term === "finals") {
    const midterm = await TermGrade.findOne({
      studentId,
      scheduleId,
      term: "midterm",
    });
    const midtermGrade = midterm?.cumulativeGrade || 0;
    return termGrade * (2 / 3) + midtermGrade * (1 / 3);
  }

  return termGrade;
};

// Upsert grade (create or update)
const upsertGrade = async (req, res) => {
  try {
    const {
      studentId,
      scheduleId,
      term,
      quizzes,
      activities,
      assignments,
      examScore,
      examTotal,
    } = req.body;

    if (!studentId || !scheduleId || !term) {
      return res.status(400).json({
        status: "error",
        message: "studentId, scheduleId, and term are required",
      });
    }

    // Get schedule to find semester
    const schedule = await Schedule.findById(scheduleId).populate("semesterId");

    if (!schedule) {
      return res
        .status(404)
        .json({ status: "error", message: "Schedule not found" });
    }

    // Check teacher ownership
    if (
      req.user.role === "teacher" &&
      schedule.teacherId.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ status: "error", message: "Access denied" });
    }

    // Check lock status
    const locked = isTermLocked(schedule.semesterId, term);
    if (locked) {
      // Only superadmin and registrar can override locks
      if (!["superadmin", "registrar"].includes(req.user.role)) {
        return res.status(403).json({
          status: "error",
          message: `${term.charAt(0).toUpperCase() + term.slice(1)} grades are locked. The grading period has ended.`,
        });
      }
    }

    // Check if existing grade is locked in DB
    const existing = await TermGrade.findOne({ studentId, scheduleId, term });
    if (
      existing?.isLocked &&
      !["superadmin", "registrar"].includes(req.user.role)
    ) {
      return res.status(403).json({
        status: "error",
        message: `${term} grades are locked and cannot be edited.`,
      });
    }

    // Compute grades
    const { classStanding, termGrade } = computeGrades({
      quizzes,
      activities,
      assignments,
      examScore,
      examTotal,
    });

    const cumulativeGrade = await computeCumulative(
      studentId,
      scheduleId,
      term,
      termGrade,
    );

    const gradeData = {
      studentId,
      scheduleId,
      semesterId: schedule.semesterId._id,
      term,
      quizzes: quizzes || [],
      activities: activities || [],
      assignments: assignments || [],
      examScore: examScore || 0,
      examTotal: examTotal || 100,
      classStanding: parseFloat(classStanding.toFixed(2)),
      termGrade: parseFloat(termGrade.toFixed(2)),
      cumulativeGrade: parseFloat(cumulativeGrade.toFixed(2)),
      isLocked: locked,
      updatedAt: new Date(),
    };

    const grade = await TermGrade.findOneAndUpdate(
      { studentId, scheduleId, term },
      gradeData,
      { upsert: true, new: true, runValidators: true },
    );

    // If midterm or finals updated, cascade to downstream terms
    if (term === "prelim") {
      const midterm = await TermGrade.findOne({
        studentId,
        scheduleId,
        term: "midterm",
      });
      if (midterm) {
        const newMidtermCumulative =
          midterm.termGrade * (2 / 3) + cumulativeGrade * (1 / 3);
        await TermGrade.findByIdAndUpdate(midterm._id, {
          cumulativeGrade: parseFloat(newMidtermCumulative.toFixed(2)),
        });

        const finals = await TermGrade.findOne({
          studentId,
          scheduleId,
          term: "finals",
        });
        if (finals) {
          const newFinalsCumulative =
            finals.termGrade * (2 / 3) + newMidtermCumulative * (1 / 3);
          await TermGrade.findByIdAndUpdate(finals._id, {
            cumulativeGrade: parseFloat(newFinalsCumulative.toFixed(2)),
          });
        }
      }
    }

    if (term === "midterm") {
      const finals = await TermGrade.findOne({
        studentId,
        scheduleId,
        term: "finals",
      });
      if (finals) {
        const newFinalsCumulative =
          finals.termGrade * (2 / 3) + cumulativeGrade * (1 / 3);
        await TermGrade.findByIdAndUpdate(finals._id, {
          cumulativeGrade: parseFloat(newFinalsCumulative.toFixed(2)),
        });
      }
    }

    res.json({ status: "success", message: "Grade saved", data: grade });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Publish grades for a schedule and term
const publishGrades = async (req, res) => {
  try {
    const { scheduleId, term } = req.body;

    if (!scheduleId || !term) {
      return res.status(400).json({
        status: "error",
        message: "scheduleId and term are required",
      });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res
        .status(404)
        .json({ status: "error", message: "Schedule not found" });
    }

    if (
      req.user.role === "teacher" &&
      schedule.teacherId.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ status: "error", message: "Access denied" });
    }

    await TermGrade.updateMany({ scheduleId, term }, { isPublished: true });

    const grades = await TermGrade.find({ scheduleId, term });
    const studentIds = [...new Set(grades.map((g) => g.studentId.toString()))];
    for (const studentId of studentIds) {
      await computeGWAForStudent(studentId);
    }

    res.json({ status: "success", message: `${term} grades published` });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Unpublish grades
const unpublishGrades = async (req, res) => {
  try {
    const { scheduleId, term } = req.body;

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res
        .status(404)
        .json({ status: "error", message: "Schedule not found" });
    }

    if (
      req.user.role === "teacher" &&
      schedule.teacherId.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ status: "error", message: "Access denied" });
    }

    await TermGrade.updateMany({ scheduleId, term }, { isPublished: false });

    res.json({ status: "success", message: `${term} grades unpublished` });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Manual lock override (superadmin/registrar only)
const overrideLock = async (req, res) => {
  try {
    const { scheduleId, term, lock } = req.body;

    await TermGrade.updateMany({ scheduleId, term }, { isLocked: lock });

    res.json({
      status: "success",
      message: `Grades ${lock ? "locked" : "unlocked"} for ${term}`,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getGradesheet,
  getGrades,
  getMyGrades,
  upsertGrade,
  publishGrades,
  unpublishGrades,
  overrideLock,
};
