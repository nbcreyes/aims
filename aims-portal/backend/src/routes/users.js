const express = require("express");
const router = express.Router();
const { uploadAvatar } = require("../utils/upload");
const {
  getUsers,
  getUser,
  updateUser,
  updateProfile,
  deleteUser,
  createUser,
  getMyProfile,
  updateMyProfile,
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");

// ── Me routes MUST come before /:id ──────────────────────────────────────────
router.get('/me', protect, getMyProfile)
router.put('/me', protect, uploadAvatar.single('avatar'), updateMyProfile)

// ── Admin routes ──────────────────────────────────────────────────────────────
router.post("/", protect, allowRoles("superadmin"), createUser);
router.get("/", protect, allowRoles("superadmin", "registrar"), getUsers);
router.get("/:id", protect, getUser);
router.put("/:id", protect, allowRoles("superadmin"), updateUser);
router.put("/:id/profile", protect, updateProfile);
router.delete("/:id", protect, allowRoles("superadmin"), deleteUser);

router.put(
  "/:id/link-parent",
  protect,
  allowRoles("superadmin", "registrar"),
  async (req, res) => {
    try {
      const { parentId } = req.body;
      const profile = await require("../models/UserProfile").findOneAndUpdate(
        { userId: req.params.id },
        { parentId },
        { new: true },
      );
      res.json({ status: "success", message: "Parent linked", data: profile });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
);

module.exports = router;