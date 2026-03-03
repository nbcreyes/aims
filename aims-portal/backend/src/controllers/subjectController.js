const Subject = require("../models/Subject");

const getSubjects = async (req, res) => {
  try {
    const filter = {};
    if (req.query.departmentId) filter.departmentId = req.query.departmentId;
    if (req.query.status) filter.status = req.query.status;

    const subjects = await Subject.find(filter)
      .populate("departmentId", "name code college")
      .sort({ code: 1 });

    res.json({
      status: "success",
      message: "Subjects fetched",
      data: subjects,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const getSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).populate(
      "departmentId",
      "name code college",
    );

    if (!subject) {
      return res
        .status(404)
        .json({ status: "error", message: "Subject not found" });
    }

    res.json({ status: "success", message: "Subject fetched", data: subject });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const createSubject = async (req, res) => {
  try {
    const {
      departmentId,
      code,
      name,
      units,
      type,
      hasLab,
      labFee,
      description,
    } = req.body;

    if (!departmentId || !code || !name || !units) {
      return res.status(400).json({
        status: "error",
        message: "Department, code, name, and units are required",
      });
    }

    const existing = await Subject.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res
        .status(400)
        .json({ status: "error", message: "Subject code already exists" });
    }

    const subject = await Subject.create({
      departmentId,
      code,
      name,
      units,
      type: type || "lecture",
      hasLab: hasLab || false,
      labFee: hasLab ? labFee || 0 : 0,
      description: description || "",
    });

    const populated = await Subject.findById(subject._id).populate(
      "departmentId",
      "name code college",
    );

    res
      .status(201)
      .json({ status: "success", message: "Subject created", data: populated });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res
        .status(404)
        .json({ status: "error", message: "Subject not found" });
    }

    const updated = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("departmentId", "name code college");

    res.json({ status: "success", message: "Subject updated", data: updated });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res
        .status(404)
        .json({ status: "error", message: "Subject not found" });
    }

    // Check if subject is used in any curriculum
    const Curriculum = require("../models/Curriculum");
    const curriculumCount = await Curriculum.countDocuments({
      subjectId: req.params.id,
    });
    if (curriculumCount > 0) {
      return res.status(400).json({
        status: "error",
        message: `Cannot delete — subject is used in ${curriculumCount} curriculum entry(ies)`,
      });
    }

    await Subject.findByIdAndDelete(req.params.id);
    res.json({ status: "success", message: "Subject deleted", data: null });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
};