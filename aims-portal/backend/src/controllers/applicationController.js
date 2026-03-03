const Application = require("../models/Application");
const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const StudentRecord = require("../models/StudentRecord");
const bcrypt = require("bcryptjs");
const { notify } = require("../utils/notify");

const generateStudentNo = async (acceptedYear) => {
  const yy = String(acceptedYear).slice(-2); // last 2 digits of year

  // Count existing students who started in the same year
  const prefix = yy;
  const count = await StudentRecord.countDocuments({
    studentNo: { $regex: `^${prefix}` },
  });

  const seq = String(count + 1).padStart(5, "0");
  return `${prefix}${seq}`;
};

const getApplications = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.programId) filter.programId = req.query.programId;
    if (req.query.semesterId) filter.semesterId = req.query.semesterId;

    const applications = await Application.find(filter)
      .populate("programId", "name code")
      .populate("semesterId", "schoolYear term")
      .sort({ submittedAt: -1 });

    res.json({
      status: "success",
      message: "Applications fetched",
      data: applications,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const getApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("programId", "name code")
      .populate("semesterId", "schoolYear term");

    if (!application) {
      return res
        .status(404)
        .json({ status: "error", message: "Application not found" });
    }

    res.json({
      status: "success",
      message: "Application fetched",
      data: application,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const submitApplication = async (req, res) => {
  try {
    const { name, email, phone, address, birthdate, programId, semesterId } =
      req.body;

    if (!name || !email || !programId || !semesterId) {
      return res.status(400).json({
        status: "error",
        message: "Name, email, program, and semester are required",
      });
    }

    const existing = await Application.findOne({ email, semesterId });
    if (existing) {
      return res.status(400).json({
        status: "error",
        message:
          "An application for this semester already exists for this email",
      });
    }

    const existingUser = await User.findOne({ email, role: "student" });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "This email is already registered as a student",
      });
    }

    // Build documents from uploaded files
    const documents = [];
    const docTypes = ["form138", "birthCertificate", "goodMoral", "validId"];

    for (const docType of docTypes) {
      if (req.files && req.files[docType] && req.files[docType][0]) {
        const file = req.files[docType][0];
        documents.push({
          docType,
          fileUrl: `/uploads/${file.filename}`,
          publicId: file.filename,
        });
      }
    }

    const application = await Application.create({
      name,
      email,
      phone,
      address,
      birthdate,
      programId,
      semesterId,
      documents,
    });

    res.status(201).json({
      status: "success",
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const validStatuses = ["pending", "under_review", "accepted", "rejected"];

    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid status" });
    }

    const application = await Application.findById(req.params.id).populate(
      "programId",
    );

    if (!application) {
      return res
        .status(404)
        .json({ status: "error", message: "Application not found" });
    }

    if (application.status === "accepted") {
      return res.status(400).json({
        status: "error",
        message: "Application has already been accepted",
      });
    }

    application.status = status;
    if (remarks) application.remarks = remarks;
    await application.save();

    if (status === "accepted") {
      const existingUser = await User.findOne({ email: application.email });
      if (!existingUser) {
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashed = await bcrypt.hash(tempPassword, 10);

        const newUser = await User.create({
          name: application.name,
          email: application.email,
          password: hashed,
          role: "student",
          status: "active",
        });

        await UserProfile.create({
          userId: newUser._id,
          phone: application.phone,
          address: application.address,
          birthdate: application.birthdate,
        });

        const acceptedYear = new Date().getFullYear();
        const studentNo = await generateStudentNo(acceptedYear);

        await StudentRecord.create({
          studentId: newUser._id,
          programId: application.programId._id,
          yearLevel: 1,
          studentNo,
        });

        await notify(
          newUser._id,
          "Application Accepted",
          `Congratulations! Your application has been accepted. Your student number is ${studentNo}. Your temporary password is: ${tempPassword}. Please log in and change your password immediately.`,
        );

        return res.json({
          status: "success",
          message: `Application accepted. Student account created. Temporary password: ${tempPassword}`,
          data: { application, studentNo, tempPassword },
        });
      }
    }

    const applicantUser = await User.findOne({ email: application.email });
    if (applicantUser) {
      await notify(
        applicantUser._id,
        `Application ${status.replace("_", " ")}`,
        `Your application status has been updated to: ${status.replace("_", " ")}.${remarks ? " Remarks: " + remarks : ""}`,
      );
    }

    res.json({
      status: "success",
      message: `Application status updated to ${status}`,
      data: application,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res
        .status(404)
        .json({ status: "error", message: "Application not found" });
    }

    if (application.status === "accepted") {
      return res.status(400).json({
        status: "error",
        message: "Cannot delete an accepted application",
      });
    }

    await Application.findByIdAndDelete(req.params.id);
    res.json({ status: "success", message: "Application deleted", data: null });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getApplications,
  getApplication,
  submitApplication,
  updateApplicationStatus,
  deleteApplication,
};
