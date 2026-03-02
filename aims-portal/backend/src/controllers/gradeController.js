const TermGrade = require("../models/TermGrade");
const ClassSchedule = require("../models/ClassSchedule");
const Enrollment = require("../models/Enrollment");
const { computeGradeForTerm } = require("../utils/grading");

const TERMS = ["prelim", "midterm", "finals"];

// Get all students enrolled in a schedule
const getEnrolledStudents = async (scheduleId) => {
  const enrollments = await Enrollment.find({
    status: "approved",
    subjects: scheduleId,
  }).populate("studentId", "name email");
  return enrollments.map((e) => e.studentId).filter(Boolean);
};

// Get previous term grades for cumulative computation
const getPreviousGrades = async (studentId, scheduleId) => {
  const grades = await TermGrade.find({ studentId, scheduleId });
  const map = {};
  grades.forEach((g) => {
    map[g.term] = g.cumulativeGrade;
  });
  return map;
};

const getGradesBySchedule = async (req, res) => {
  try {
    const { scheduleId, term } = req.query;
    if (!scheduleId) {
      return res
        .status(400)
        .json({ status: "error", message: "scheduleId is required" });
    }

    const filter = { scheduleId };
    if (term) filter.term = term;

    const grades = await TermGrade.find(filter)
      .populate("studentId", "name email")
      .populate("scheduleId")
      .sort({ term: 1 });

    res.json({ status: "success", message: "Grades fetched", data: grades });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const getMyGrades = async (req, res) => {
  try {
    const { semesterId } = req.query;
    const filter = { studentId: req.user._id };
    if (semesterId) filter.semesterId = semesterId;

    const grades = await TermGrade.find(filter)
      .populate({
        path: "scheduleId",
        populate: { path: "subjectId", select: "name code units" },
      })
      .sort({ term: 1 });

    // Group by scheduleId
    const grouped = {};
    for (const g of grades) {
      const key = g.scheduleId?._id?.toString();
      if (!key) continue;
      if (!grouped[key]) {
        grouped[key] = {
          schedule: g.scheduleId,
          subject: g.scheduleId?.subjectId,
          terms: {},
        };
      }
      if (g.isPublished) {
        grouped[key].terms[g.term] = {
          classStanding: g.classStanding,
          cumulativeGrade: g.cumulativeGrade,
          term: g.term,
        };
      }
    }

    res.json({
      status: "success",
      message: "Grades fetched",
      data: Object.values(grouped),
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const getGradesheet = async (req, res) => {
  try {
    const { scheduleId, term } = req.query;
    if (!scheduleId || !term) {
      return res
        .status(400)
        .json({ status: "error", message: "scheduleId and term are required" });
    }

    const students = await getEnrolledStudents(scheduleId);

    const sheet = await Promise.all(
      students.map(async (student) => {
        let grade = await TermGrade.findOne({
          studentId: student._id,
          scheduleId,
          term,
        });
        if (!grade) {
          grade = {
            studentId: student,
            scheduleId,
            term,
            quizScores: [],
            activityScores: [],
            examScore: 0,
            examMaxScore: 0,
            classStanding: 0,
            cumulativeGrade: 0,
            isPublished: false,
            _id: null,
          };
        }
        return { student, grade };
      }),
    );

    res.json({ status: "success", message: "Gradesheet fetched", data: sheet });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const getGrades = async (req, res) => {
  try {
    const filter = {};
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.semesterId) filter.semesterId = req.query.semesterId;
    if (req.query.scheduleId) filter.scheduleId = req.query.scheduleId;
    if (req.query.term) filter.term = req.query.term;

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

const upsertGrade = async (req, res) => {
  try {
    const {
      studentId,
      scheduleId,
      semesterId,
      term,
      quizScores,
      activityScores,
      examScore,
      examMaxScore,
    } = req.body;

    if (!studentId || !scheduleId || !semesterId || !term) {
      return res.status(400).json({
        status: "error",
        message: "studentId, scheduleId, semesterId, and term are required",
      });
    }

    if (!TERMS.includes(term)) {
      return res.status(400).json({ status: "error", message: "Invalid term" });
    }

    // Verify teacher owns this schedule
    const schedule = await ClassSchedule.findById(scheduleId);
    if (!schedule) {
      return res
        .status(404)
        .json({ status: "error", message: "Schedule not found" });
    }

    if (
      req.user.role === "teacher" &&
      schedule.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: "error",
        message: "You are not assigned to this class",
      });
    }

    const previousGrades = await getPreviousGrades(studentId, scheduleId);

    const gradeData = {
      quizScores: quizScores || [],
      activityScores: activityScores || [],
      examScore: examScore || 0,
      examMaxScore: examMaxScore || 0,
    };

    const computed = computeGradeForTerm(gradeData, term, previousGrades);

    const grade = await TermGrade.findOneAndUpdate(
      { studentId, scheduleId, term },
      {
        studentId,
        scheduleId,
        semesterId,
        term,
        ...gradeData,
        classStanding: computed.classStanding,
        termGrade: computed.classStanding,
        cumulativeGrade: computed.cumulativeGrade,
      },
      { new: true, upsert: true, runValidators: true },
    );

    // Recompute downstream terms if they exist
    if (term === "prelim") {
      const midterm = await TermGrade.findOne({
        studentId,
        scheduleId,
        term: "midterm",
      });
      if (midterm) {
        const updatedPrevious = { prelim: computed.cumulativeGrade };
        const midtermComputed = computeGradeForTerm(
          midterm,
          "midterm",
          updatedPrevious,
        );
        midterm.classStanding = midtermComputed.classStanding;
        midterm.cumulativeGrade = midtermComputed.cumulativeGrade;
        await midterm.save();

        const finals = await TermGrade.findOne({
          studentId,
          scheduleId,
          term: "finals",
        });
        if (finals) {
          const finalsComputed = computeGradeForTerm(finals, "finals", {
            midterm: midtermComputed.cumulativeGrade,
          });
          finals.classStanding = finalsComputed.classStanding;
          finals.cumulativeGrade = finalsComputed.cumulativeGrade;
          await finals.save();
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
        const finalsComputed = computeGradeForTerm(finals, "finals", {
          midterm: computed.cumulativeGrade,
        });
        finals.classStanding = finalsComputed.classStanding;
        finals.cumulativeGrade = finalsComputed.cumulativeGrade;
        await finals.save();
      }
    }

    res.json({ status: "success", message: "Grade saved", data: grade });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const publishGrades = async (req, res) => {
  try {
    const { scheduleId, term } = req.body;
    if (!scheduleId || !term) {
      return res
        .status(400)
        .json({ status: "error", message: "scheduleId and term are required" });
    }

    const schedule = await ClassSchedule.findById(scheduleId);
    if (!schedule) {
      return res
        .status(404)
        .json({ status: "error", message: "Schedule not found" });
    }

    if (
      req.user.role === "teacher" &&
      schedule.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: "error",
        message: "You are not assigned to this class",
      });
    }

    await TermGrade.updateMany({ scheduleId, term }, { isPublished: true });

    res.json({
      status: "success",
      message: `${term} grades published`,
      data: null,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const unpublishGrades = async (req, res) => {
  try {
    const { scheduleId, term } = req.body;
    if (!scheduleId || !term) {
      return res
        .status(400)
        .json({ status: "error", message: "scheduleId and term are required" });
    }

    await TermGrade.updateMany({ scheduleId, term }, { isPublished: false });
    res.json({
      status: "success",
      message: `${term} grades unpublished`,
      data: null,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getGradesBySchedule,
  getMyGrades,
  getGradesheet,
  getGrades,
  upsertGrade,
  publishGrades,
  unpublishGrades,
};
