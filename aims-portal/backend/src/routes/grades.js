const express = require("express");
const router = express.Router();
const {
  getGradesheet,
  getGrades,
  getMyGrades,
  upsertGrade,
  publishGrades,
  unpublishGrades,
  overrideLock,
} = require("../controllers/gradeController");
const { protect } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");

router.get("/my", protect, allowRoles("student"), getMyGrades);
router.get(
  "/sheet",
  protect,
  allowRoles("teacher", "superadmin", "registrar"),
  getGradesheet,
);
router.get(
  "/",
  protect,
  allowRoles("superadmin", "registrar", "teacher"),
  getGrades,
);
router.put(
  "/",
  protect,
  allowRoles("teacher", "superadmin", "registrar"),
  upsertGrade,
);
router.post(
  "/publish",
  protect,
  allowRoles("teacher", "superadmin", "registrar"),
  publishGrades,
);
router.post(
  "/unpublish",
  protect,
  allowRoles("teacher", "superadmin", "registrar"),
  unpublishGrades,
);
router.post(
  "/override-lock",
  protect,
  allowRoles("superadmin", "registrar"),
  overrideLock,
);

module.exports = router;