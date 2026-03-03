import { useState, useEffect } from "react";
import api from "../../utils/api";
import DashboardLayout from "../../components/shared/DashboardLayout";

const TERMS = ["prelim", "midterm", "finals"];

export default function Grades() {
  const [classes, setClasses] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [sheet, setSheet] = useState([]);
  const [lockStatus, setLockStatus] = useState({});
  const [selectedTerm, setSelectedTerm] = useState("prelim");
  const [editingStudent, setEditingStudent] = useState(null);
  const [gradeForm, setGradeForm] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Get active semester first
        const semRes = await api.get("/semesters/active");
        const activeSemester = semRes.data.data;

        // Fetch teacher's classes for the active semester
        const schedRes = await api.get(
          `/schedules/my?semesterId=${activeSemester._id}`,
        );
        setClasses(schedRes.data.data);
      } catch (err) {
        // If no active semester, fetch all classes
        try {
          const schedRes = await api.get("/schedules/my");
          setClasses(schedRes.data.data);
        } catch {
          setError("Failed to load classes");
        }
      }
    };
    init();
  }, []);

  const fetchGradesheet = async (scheduleId) => {
    try {
      const res = await api.get(`/grades/sheet?scheduleId=${scheduleId}`);
      setSheet(res.data.data.sheet);
      setLockStatus(res.data.data.lockStatus);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load gradesheet");
    }
  };

  const handleSelectSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setEditingStudent(null);
    setError("");
    setSuccess("");
    fetchGradesheet(schedule._id);
  };

  const handleEdit = (studentRow) => {
    const existing = studentRow.grades[selectedTerm];
    setEditingStudent(studentRow.student._id);
    setGradeForm({
      quizzes: existing?.quizzes || [{ score: "", total: "" }],
      activities: existing?.activities || [{ score: "", total: "" }],
      assignments: existing?.assignments || [{ score: "", total: "" }],
      examScore: existing?.examScore || "",
      examTotal: existing?.examTotal || 100,
    });
  };

  const addRow = (field) => {
    setGradeForm({
      ...gradeForm,
      [field]: [...gradeForm[field], { score: "", total: "" }],
    });
  };

  const removeRow = (field, index) => {
    setGradeForm({
      ...gradeForm,
      [field]: gradeForm[field].filter((_, i) => i !== index),
    });
  };

  const updateRow = (field, index, key, value) => {
    const updated = [...gradeForm[field]];
    updated[index] = { ...updated[index], [key]: value };
    setGradeForm({ ...gradeForm, [field]: updated });
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.put("/grades", {
        studentId: editingStudent,
        scheduleId: selectedSchedule._id,
        term: selectedTerm,
        quizzes: gradeForm.quizzes.filter(
          (q) => q.score !== "" && q.total !== "",
        ),
        activities: gradeForm.activities.filter(
          (a) => a.score !== "" && a.total !== "",
        ),
        assignments: gradeForm.assignments.filter(
          (a) => a.score !== "" && a.total !== "",
        ),
        examScore: parseFloat(gradeForm.examScore) || 0,
        examTotal: parseFloat(gradeForm.examTotal) || 100,
      });
      setSuccess("Grade saved");
      setEditingStudent(null);
      fetchGradesheet(selectedSchedule._id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save grade");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (
      !confirm(
        `Publish ${selectedTerm} grades? Students will be able to see them.`,
      )
    )
      return;
    try {
      await api.post("/grades/publish", {
        scheduleId: selectedSchedule._id,
        term: selectedTerm,
      });
      setSuccess(`${selectedTerm} grades published`);
      fetchGradesheet(selectedSchedule._id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish");
    }
  };

  const handleUnpublish = async () => {
    try {
      await api.post("/grades/unpublish", {
        scheduleId: selectedSchedule._id,
        term: selectedTerm,
      });
      setSuccess(`${selectedTerm} grades unpublished`);
      fetchGradesheet(selectedSchedule._id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unpublish");
    }
  };

  const isLocked = lockStatus[selectedTerm]?.isLocked;
  const daysUntilLock = lockStatus[selectedTerm]?.daysUntilLock;
  const lockDate = lockStatus[selectedTerm]?.lockDate;

  const ScoreInput = ({ field, label }) => (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        <button
          type="button"
          onClick={() => addRow(field)}
          className="text-xs text-blue-600 hover:underline"
        >
          + Add
        </button>
      </div>
      {gradeForm[field]?.map((item, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <input
            type="number"
            value={item.score}
            onChange={(e) => updateRow(field, i, "score", e.target.value)}
            placeholder="Score"
            className="w-20 border border-gray-300 rounded px-2 py-1 text-xs"
          />
          <span className="text-gray-400 text-xs">/</span>
          <input
            type="number"
            value={item.total}
            onChange={(e) => updateRow(field, i, "total", e.target.value)}
            placeholder="Total"
            className="w-20 border border-gray-300 rounded px-2 py-1 text-xs"
          />
          <button
            type="button"
            onClick={() => removeRow(field, i)}
            className="text-red-400 hover:text-red-600 text-xs"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Grades</h1>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4 border border-green-200">
            {success}
          </div>
        )}

        <div className="flex gap-6">
          {/* Left — Class List */}
          <div className="w-64 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
              My Classes
            </p>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {classes.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-6 text-center">
                  No classes assigned
                </p>
              ) : (
                classes.map((cls) => (
                  <button
                    key={cls._id}
                    onClick={() => handleSelectSchedule(cls)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${selectedSchedule?._id === cls._id ? "bg-blue-50" : ""}`}
                  >
                    <p className="text-sm font-medium text-gray-800">
                      {cls.subjectId?.code}
                    </p>
                    <p className="text-xs text-gray-400">
                      {cls.subjectId?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {cls.sectionId?.name}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right — Gradesheet */}
          {selectedSchedule && (
            <div className="flex-1">
              {/* Term Tabs */}
              <div className="flex gap-2 mb-4">
                {TERMS.map((term) => {
                  const ls = lockStatus[term];
                  return (
                    <button
                      key={term}
                      onClick={() => {
                        setSelectedTerm(term);
                        setEditingStudent(null);
                      }}
                      className={`px-4 py-2 text-sm rounded-md font-medium border capitalize flex items-center gap-2 ${selectedTerm === term ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
                    >
                      {term}
                      {ls?.isLocked && (
                        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                          Locked
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Lock Warning */}
              {isLocked ? (
                <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 mb-4 text-sm text-red-700">
                  🔒{" "}
                  {selectedTerm.charAt(0).toUpperCase() + selectedTerm.slice(1)}{" "}
                  grades are locked. The grading period ended on{" "}
                  {lockDate ? new Date(lockDate).toLocaleDateString() : "—"}.
                  Contact the registrar to request an override.
                </div>
              ) : daysUntilLock > 0 && daysUntilLock <= 7 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md px-4 py-3 mb-4 text-sm text-yellow-700">
                  ⚠️ Grades lock in{" "}
                  <strong>
                    {daysUntilLock} day{daysUntilLock !== 1 ? "s" : ""}
                  </strong>{" "}
                  on {lockDate ? new Date(lockDate).toLocaleDateString() : "—"}.
                </div>
              ) : null}

              {/* Action Buttons */}
              {!isLocked && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={handlePublish}
                    className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-green-700"
                  >
                    Publish {selectedTerm}
                  </button>
                  <button
                    onClick={handleUnpublish}
                    className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs hover:bg-gray-300"
                  >
                    Unpublish {selectedTerm}
                  </button>
                </div>
              )}

              {/* Gradesheet Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                        Student
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                        Class Standing
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                        Term Grade
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                        Cumulative
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                        Published
                      </th>
                      {!isLocked && (
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sheet.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-6 text-center text-gray-400 text-sm"
                        >
                          No students enrolled
                        </td>
                      </tr>
                    ) : (
                      sheet.map((row) => {
                        const grade = row.grades[selectedTerm];
                        const isEditing = editingStudent === row.student._id;

                        return (
                          <tr
                            key={row.student._id}
                            className={`${isEditing ? "bg-blue-50" : "hover:bg-gray-50"}`}
                          >
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-gray-800">
                                {row.student.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {row.student.email}
                              </p>
                            </td>

                            {isEditing ? (
                              <td
                                colSpan={isLocked ? 4 : 5}
                                className="px-4 py-3"
                              >
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                  <ScoreInput field="quizzes" label="Quizzes" />
                                  <ScoreInput
                                    field="activities"
                                    label="Activities"
                                  />
                                  <ScoreInput
                                    field="assignments"
                                    label="Assignments"
                                  />
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1">
                                      Exam
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        value={gradeForm.examScore}
                                        onChange={(e) =>
                                          setGradeForm({
                                            ...gradeForm,
                                            examScore: e.target.value,
                                          })
                                        }
                                        placeholder="Score"
                                        className="w-20 border border-gray-300 rounded px-2 py-1 text-xs"
                                      />
                                      <span className="text-gray-400 text-xs">
                                        /
                                      </span>
                                      <input
                                        type="number"
                                        value={gradeForm.examTotal}
                                        onChange={(e) =>
                                          setGradeForm({
                                            ...gradeForm,
                                            examTotal: e.target.value,
                                          })
                                        }
                                        placeholder="Total"
                                        className="w-20 border border-gray-300 rounded px-2 py-1 text-xs"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    {loading ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    onClick={() => setEditingStudent(null)}
                                    className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-xs hover:bg-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            ) : (
                              <>
                                <td className="px-4 py-3 text-gray-600">
                                  {grade
                                    ? `${grade.classStanding?.toFixed(2)}%`
                                    : "—"}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {grade
                                    ? `${grade.termGrade?.toFixed(2)}%`
                                    : "—"}
                                </td>
                                <td className="px-4 py-3">
                                  {grade ? (
                                    <span
                                      className={`font-medium ${grade.cumulativeGrade >= 75 ? "text-green-600" : "text-red-600"}`}
                                    >
                                      {grade.cumulativeGrade?.toFixed(2)}%
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {grade ? (
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full ${grade.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                                    >
                                      {grade.isPublished
                                        ? "Published"
                                        : "Draft"}
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                {!isLocked && (
                                  <td className="px-4 py-3">
                                    <button
                                      onClick={() => handleEdit(row)}
                                      className="text-blue-600 hover:underline text-xs"
                                    >
                                      {grade ? "Edit" : "Enter"}
                                    </button>
                                  </td>
                                )}
                              </>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
