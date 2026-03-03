const bcrypt = require("bcryptjs");
const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const StudentRecord = require("../models/StudentRecord");
const { upload } = require("../utils/upload");

/* =========================
   CREATE USER (ADMIN ONLY)
========================= */
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        status: "error",
        message: "Email already in use",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
    });

    await UserProfile.create({ userId: user._id });

    const { password: _, ...userData } = user.toObject();

    res.status(201).json({
      status: "success",
      message: "User created",
      data: userData,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

/* =========================
   GET USERS
========================= */
const getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) filter.status = req.query.status;

    const users = await User.find(filter).select("-password").sort({ name: 1 });

    res.json({
      status: "success",
      message: "Users fetched",
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

/* =========================
   GET SINGLE USER
========================= */
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const profile = await UserProfile.findOne({ userId: user._id });

    const studentRecord =
      user.role === "student"
        ? await StudentRecord.findOne({ studentId: user._id }).populate(
            "programId",
            "name code",
          )
        : null;

    res.json({
      status: "success",
      message: "User fetched",
      data: { user, profile, studentRecord },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

/* =========================
   UPDATE USER
========================= */
const updateUser = async (req, res) => {
  try {
    const { name, email, status, role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, status, role },
      { new: true, runValidators: true },
    ).select("-password");

    res.json({
      status: "success",
      message: "User updated",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

/* =========================
   UPDATE PROFILE
========================= */
const updateProfile = async (req, res) => {
  try {
    const { phone, address, birthdate, photo } = req.body;

    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.params.id },
      { phone, address, birthdate, photo },
      { new: true, upsert: true },
    );

    res.json({
      status: "success",
      message: "Profile updated",
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

/* =========================
   DELETE USER
========================= */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    await User.findByIdAndDelete(req.params.id);
    await UserProfile.findOneAndDelete({ userId: req.params.id });

    res.json({
      status: "success",
      message: "User deleted",
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    const profile = await UserProfile.findOne({ userId: req.user._id });
    const studentRecord =
      req.user.role === "student"
        ? await StudentRecord.findOne({ studentId: req.user._id }).populate(
            "programId",
            "name code",
          )
        : null;

    res.json({
      status: "success",
      message: "Profile fetched",
      data: { user, profile, studentRecord },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const { name, phone, address, birthdate, bio } = req.body;

    // Update name on user record
    if (name) {
      await User.findByIdAndUpdate(req.user._id, { name });
    }

    // Update or create profile
    const profileData = {};
    if (phone !== undefined) profileData.phone = phone;
    if (address !== undefined) profileData.address = address;
    if (birthdate !== undefined) profileData.birthdate = birthdate;
    if (bio !== undefined) profileData.bio = bio;

    // Handle avatar upload
    if (req.file) {
      profileData.avatar = `/uploads/${req.file.filename}`;
    }

    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user._id },
      profileData,
      { new: true, upsert: true },
    );

    const user = await User.findById(req.user._id).select("-password");

    res.json({
      status: "success",
      message: "Profile updated successfully",
      data: { user, profile },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  updateProfile,
  deleteUser,
  getMyProfile,
  updateMyProfile,
};
