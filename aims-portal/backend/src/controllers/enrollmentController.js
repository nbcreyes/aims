const Enrollment = require("../models/Enrollment");
const ClassSchedule = require("../models/ClassSchedule");
const StudentRecord = require("../models/StudentRecord");
const Curriculum = require("../models/Curriculum");
const TermGrade = require("../models/TermGrade");
const Semester = require("../models/Semester");
const { notify } = require("../utils/notify");

// ─── Validation Helper ────────────────────────────────────────────────────────

const validateEnrollment = async (studentId, scheduleId, semesterId) => {
  const errors = [];

  // Get schedule with subject
  const schedule = await ClassSchedule.findById(scheduleId)
    .populate("subjectId")
    .populate("semesterId");

  if (!schedule) return { valid: false, errors: ["Schedule not found"] };

  const subjectId = schedule.subjectId._id;

  // Get student record to find their program
  const record = await StudentRecord.findOne({ studentId }).populate(
    "programId",
  );

  if (!record) return { valid: false, errors: ["Student record not found"] };

  // Find curriculum entry for this subject in the student's program
  const curriculumEntry = await Curriculum.findOne({
    programId: record.programId._id,
    subjectId,
  })
    .populate("prerequisites")
    .populate("corequisites");

  // If subject is not in curriculum, still allow enrollment
  // (handles cross-program/minor subjects)
  if (!curriculumEntry) {
    return { valid: true, errors: [] };
  }

  // ── Check: Already passed this subject ──────────────────────────────────────
  const passedGrade = await TermGrade.findOne({
    studentId,
    term: "finals",
    cumulativeGrade: { $gte: 75 },
    isPublished: true,
  }).populate({
    path: "scheduleId",
    match: { subjectId },
  });

  if (passedGrade?.scheduleId) {
    errors.push(
      `You have already passed ${schedule.subjectId.code}. You cannot re-enroll in a subject you passed.`,
    );
  }

  // ── Check: Prerequisites ─────────────────────────────────────────────────────
  if (curriculumEntry.prerequisites?.length > 0) {
    for (const prereq of curriculumEntry.prerequisites) {
      // Find if student passed this prerequisite
      const prereqSchedules = await ClassSchedule.find({
        subjectId: prereq._id,
      });
      const prereqIds = prereqSchedules.map((s) => s._id);

      const prereqPassed = await TermGrade.findOne({
        studentId,
        scheduleId: { $in: prereqIds },
        term: "finals",
        cumulativeGrade: { $gte: 75 },
        isPublished: true,
      });

      if (!prereqPassed) {
        errors.push(
          `Prerequisite not met: You must pass ${prereq.code} — ${prereq.name} before enrolling in ${schedule.subjectId.code}.`,
        );
      }
    }
  }

  // ── Check: Co-requisites ─────────────────────────────────────────────────────
  if (curriculumEntry.corequisites?.length > 0) {
    for (const coreq of curriculumEntry.corequisites) {
      // Check if student is enrolling in the corequisite this same semester
      const coreqSchedules = await ClassSchedule.find({
        subjectId: coreq._id,
        semesterId,
      });
      const coreqIds = coreqSchedules.map((s) => s._id);

      const enrolledInCoreq = await Enrollment.findOne({
        studentId,
        scheduleId: { $in: coreqIds },
        status: { $in: ["pending", "approved"] },
      });

      // Also check if already passed the corequisite
      const coreqPassed = await TermGrade.findOne({
        studentId,
        scheduleId: {
          $in: await ClassSchedule.find({ subjectId: coreq._id }).then((s) =>
            s.map((x) => x._id),
          ),
        },
        term: "finals",
        cumulativeGrade: { $gte: 75 },
        isPublished: true,
      });

      if (!enrolledInCoreq && !coreqPassed) {
        errors.push(
          `Co-requisite required: ${coreq.code} — ${coreq.name} must be taken in the same semester as ${schedule.subjectId.code}.`,
        );
      }
    }
  }

  // ── Check: Failed prerequisite — can retake if section is available ──────────
  // This is handled by not blocking retakes — if the student failed a subject
  // and a section is open, they can re-enroll

  return {
    valid: errors.length === 0,
    errors,
    curriculumEntry,
  };
};

// ─── Controllers ──────────────────────────────────────────────────────────────

const getEnrollments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.semesterId) filter.semesterId = req.query.semesterId;
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.scheduleId) filter.scheduleId = req.query.scheduleId;

    const enrollments = await Enrollment.find(filter)
      .populate("studentId", "name email")
      .populate({
        path: "scheduleId",
        populate: [
          { path: "subjectId", select: "name code units" },
          { path: "sectionId", select: "name" },
          { path: "teacherId", select: "name" },
        ],
      })
      .populate("semesterId", "schoolYear term")
      .sort({ enrolledAt: -1 });

    res.json({
      status: "success",
      message: "Enrollments fetched",
      data: enrollments,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const getMyEnrollments = async (req, res) => {
  try {
    const filter = { studentId: req.user._id };
    if (req.query.semesterId) filter.semesterId = req.query.semesterId;
    if (req.query.status) filter.status = req.query.status;

    const enrollments = await Enrollment.find(filter)
      .populate({
        path: "scheduleId",
        populate: [
          { path: "subjectId", select: "name code units hasLab labFee" },
          { path: "sectionId", select: "name" },
          { path: "teacherId", select: "name" },
        ],
      })
      .populate("semesterId", "schoolYear term")
      .sort({ enrolledAt: -1 });

    res.json({
      status: "success",
      message: "Enrollments fetched",
      data: enrollments,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const submitEnrollment = async (req, res) => {
  try {
    const { scheduleIds, semesterId } = req.body;
    const studentId = req.user._id;

    if (!scheduleIds || !scheduleIds.length || !semesterId) {
      return res.status(400).json({
        status: "error",
        message: "scheduleIds and semesterId are required",
      });
    }

    // Validate all subjects before enrolling any
    const allErrors = [];
    for (const scheduleId of scheduleIds) {
      const { valid, errors } = await validateEnrollment(
        studentId,
        scheduleId,
        semesterId,
      );
      if (!valid) {
        allErrors.push(...errors);
      }
    }

    if (allErrors.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Enrollment validation failed",
        errors: allErrors,
      });
    }

    // Check for duplicate enrollments
    const duplicates = [];
    for (const scheduleId of scheduleIds) {
      const existing = await Enrollment.findOne({
        studentId,
        scheduleId,
        status: { $in: ["pending", "approved"] },
      });
      if (existing) {
        const schedule = await ClassSchedule.findById(scheduleId).populate(
          "subjectId",
          "code",
        );
        duplicates.push(schedule?.subjectId?.code);
      }
    }

    if (duplicates.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `Already enrolled in: ${duplicates.join(", ")}`,
      });
    }

    // Create all enrollments
    const enrollments = [];
    for (const scheduleId of scheduleIds) {
      const enrollment = await Enrollment.create({
        studentId,
        scheduleId,
        semesterId,
        status: "pending",
      });
      enrollments.push(enrollment);
    }

    // Notify registrar
    await notify(
      null,
      "New Enrollment Submitted",
      `A student has submitted enrollment for ${scheduleIds.length} subject(s).`,
      "registrar",
    );

    res.status(201).json({
      status: "success",
      message: `Successfully enrolled in ${enrollments.length} subject(s). Awaiting registrar approval.`,
      data: enrollments,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const updateEnrollmentStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const validStatuses = ["approved", "rejected", "dropped"];

    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid status" });
    }

    const enrollment = await Enrollment.findById(req.params.id)
      .populate("studentId", "name email")
      .populate({
        path: "scheduleId",
        populate: { path: "subjectId", select: "name code" },
      });

    if (!enrollment) {
      return res
        .status(404)
        .json({ status: "error", message: "Enrollment not found" });
    }

    enrollment.status = status;
    if (remarks) enrollment.remarks = remarks;
    if (status === "approved") enrollment.approvedAt = new Date();
    if (status === "dropped") enrollment.droppedAt = new Date();

    await enrollment.save();

    // Notify student
    const subjectCode = enrollment.scheduleId?.subjectId?.code;
    await notify(
      enrollment.studentId._id,
      `Enrollment ${status}`,
      `Your enrollment in ${subjectCode} has been ${status}.${remarks ? " Remarks: " + remarks : ""}`,
    );

    res.json({
      status: "success",
      message: `Enrollment ${status}`,
      data: enrollment,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const bulkUpdateEnrollment = async (req, res) => {
  try {
    const { enrollmentIds, status } = req.body;

    if (!enrollmentIds?.length || !status) {
      return res.status(400).json({
        status: "error",
        message: "enrollmentIds and status are required",
      });
    }

    await Enrollment.updateMany(
      { _id: { $in: enrollmentIds } },
      { status, approvedAt: status === "approved" ? new Date() : undefined },
    );

    // Notify each student
    const enrollments = await Enrollment.find({ _id: { $in: enrollmentIds } })
      .populate("studentId", "name")
      .populate({
        path: "scheduleId",
        populate: { path: "subjectId", select: "code" },
      });

    for (const e of enrollments) {
      await notify(
        e.studentId._id,
        `Enrollment ${status}`,
        `Your enrollment in ${e.scheduleId?.subjectId?.code} has been ${status}.`,
      );
    }

    res.json({
      status: "success",
      message: `${enrollmentIds.length} enrollment(s) ${status}`,
      data: null,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Get available subjects for enrollment based on curriculum
const getAvailableSubjects = async (req, res) => {
  try {
    const { semesterId } = req.query;
    const studentId = req.user._id;

    if (!semesterId) {
      return res
        .status(400)
        .json({ status: "error", message: "semesterId is required" });
    }

    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res
        .status(404)
        .json({ status: "error", message: "Semester not found" });
    }

    // Get student record
    const record = await StudentRecord.findOne({ studentId }).populate(
      "programId",
    );
    if (!record) {
      return res
        .status(404)
        .json({ status: "error", message: "Student record not found" });
    }

    // Get all curriculum entries for the student's program
    const curriculum = await Curriculum.find({
      programId: record.programId._id,
    })
      .populate("subjectId")
      .populate("prerequisites", "code name")
      .populate("corequisites", "code name");

    // Get all schedules for this semester
    const schedules = await ClassSchedule.find({ semesterId })
      .populate("subjectId", "name code units hasLab labFee")
      .populate("sectionId", "name yearLevel")
      .populate("teacherId", "name");

    // Get student's existing enrollments this semester
    const existingEnrollments = await Enrollment.find({
      studentId,
      semesterId,
      status: { $in: ["pending", "approved"] },
    });
    const enrolledScheduleIds = existingEnrollments.map((e) =>
      e.scheduleId.toString(),
    );

    // Get student's grade history
    const allGrades = await TermGrade.find({
      studentId,
      term: "finals",
      isPublished: true,
    }).populate({
      path: "scheduleId",
      populate: { path: "subjectId", select: "code name _id" },
    });

    const passedSubjectIds = allGrades
      .filter((g) => g.cumulativeGrade >= 75)
      .map((g) => g.scheduleId?.subjectId?._id?.toString())
      .filter(Boolean);

    const failedSubjectIds = allGrades
      .filter((g) => g.cumulativeGrade < 75)
      .map((g) => g.scheduleId?.subjectId?._id?.toString())
      .filter(Boolean);

    // Build available subjects list with eligibility status
    const result = [];

    for (const schedule of schedules) {
      const subjectId = schedule.subjectId?._id?.toString();
      const currEntry = curriculum.find(
        (c) => c.subjectId?._id?.toString() === subjectId,
      );

      const alreadyEnrolled = enrolledScheduleIds.includes(
        schedule._id.toString(),
      );
      const alreadyPassed = passedSubjectIds.includes(subjectId);

      // Check prerequisites
      const prereqErrors = [];
      if (currEntry?.prerequisites?.length > 0) {
        for (const prereq of currEntry.prerequisites) {
          const prereqPassed = passedSubjectIds.includes(prereq._id.toString());
          if (!prereqPassed) {
            prereqErrors.push(`Requires ${prereq.code}`);
          }
        }
      }

      // Determine status
      let eligibility = "eligible";
      let reason = "";

      if (alreadyPassed) {
        eligibility = "passed";
        reason = "Already passed";
      } else if (alreadyEnrolled) {
        eligibility = "enrolled";
        reason = "Already enrolled";
      } else if (prereqErrors.length > 0) {
        eligibility = "blocked";
        reason = prereqErrors.join(", ");
      } else if (failedSubjectIds.includes(subjectId)) {
        eligibility = "retake";
        reason = "Retake — previously failed";
      } else if (!currEntry) {
        eligibility = "elective";
        reason = "Not in curriculum — elective or cross-program";
      }

      result.push({
        schedule,
        curriculumEntry: currEntry || null,
        eligibility,
        reason,
        alreadyEnrolled,
      });
    }

    res.json({
      status: "success",
      message: "Available subjects fetched",
      data: result,
      studentRecord: record,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getEnrollments,
  getMyEnrollments,
  submitEnrollment,
  updateEnrollmentStatus,
  bulkUpdateEnrollment,
  getAvailableSubjects,
};
