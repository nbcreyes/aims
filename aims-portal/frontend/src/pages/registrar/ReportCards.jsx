import { useState, useEffect } from "react";
import api from "../../utils/api";
import DashboardLayout from "../../components/shared/DashboardLayout";
import useAuth from "../../hooks/useAuth";

const TERMS = ["prelim", "midterm", "finals"];

export default function ReportCards() {
  const { user } = useAuth();
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const [semRes, stuRes] = await Promise.all([
          api.get("/semesters"),
          api.get("/students"),
        ]);
        setSemesters(semRes.data.data);
        setStudents(stuRes.data.data);
        const active = semRes.data.data.find((s) => s.isActive);
        if (active) setSelectedSemester(active._id);
      } catch (err) {
        setError("Failed to load data");
      }
    };
    init();
  }, []);

  const handleSelectStudent = async (student) => {
    if (!selectedSemester) {
      setError("Please select a semester first");
      return;
    }
    setSelectedStudent(student);
    setGrades([]);
    setLoadingGrades(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.get(
        `/grades?studentId=${student.user._id}&semesterId=${selectedSemester}`,
      );
      const raw = res.data.data;

      // Group grades by scheduleId
      const grouped = {};
      for (const g of raw) {
        const key = g.scheduleId?._id?.toString();
        if (!key) continue;
        if (!grouped[key]) {
          grouped[key] = {
            scheduleId: key,
            schedule: g.scheduleId,
            subject: g.scheduleId?.subjectId,
            terms: {},
          };
        }
        grouped[key].terms[g.term] = g;
      }
      setGrades(Object.values(grouped));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load grades");
    } finally {
      setLoadingGrades(false);
    }
  };

  const handleOverrideLock = async (scheduleId, term, lock) => {
    const action = lock ? "lock" : "unlock";
    if (
      !confirm(
        `${action.charAt(0).toUpperCase() + action.slice(1)} ${term} grades for this schedule?`,
      )
    )
      return;
    try {
      await api.post("/grades/override-lock", { scheduleId, term, lock });
      setSuccess(`${term} grades ${action}ed successfully`);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} grades`);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.record?.studentNo?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalUnits = grades.reduce(
    (sum, g) => sum + (g.subject?.units || 0),
    0,
  );
  const earnedUnits = grades
    .filter((g) => (g.terms["finals"]?.cumulativeGrade || 0) >= 75)
    .reduce((sum, g) => sum + (g.subject?.units || 0), 0);
  const failedUnits = totalUnits - earnedUnits;

  const overallGWA =
    grades.length > 0
      ? grades.reduce((sum, g) => {
          const finalGrade =
            g.terms["finals"]?.cumulativeGrade ||
            g.terms["midterm"]?.cumulativeGrade ||
            g.terms["prelim"]?.cumulativeGrade ||
            0;
          return sum + finalGrade;
        }, 0) / grades.length
      : 0;

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Report Cards</h1>

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
          {/* Left — Student List */}
          <div className="w-72 flex-shrink-0">
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setSelectedStudent(null);
                setGrades([]);
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select semester</option>
              {semesters.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.schoolYear} — {s.term}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search by name or student no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-6 text-center">
                  No students found
                </p>
              ) : (
                filtered.map((s) => (
                  <button
                    key={s.user._id}
                    onClick={() => handleSelectStudent(s)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedStudent?.user._id === s.user._id ? "bg-blue-50 border-l-2 border-l-blue-600" : ""}`}
                  >
                    <p className="text-sm font-medium text-gray-800">
                      {s.user.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.record?.studentNo}
                    </p>
                    <p className="text-xs text-gray-400">
                      {s.record?.programId?.code} — Year {s.record?.yearLevel}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right — Report Card */}
          <div className="flex-1">
            {!selectedStudent && (
              <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-sm text-gray-400">
                    Select a student to view their report card
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    Choose a semester and student from the left panel
                  </p>
                </div>
              </div>
            )}

            {selectedStudent && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Student Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-base font-bold text-gray-800">
                        {selectedStudent.user.name}
                      </p>
                      <div className="flex gap-4 mt-1">
                        <p className="text-xs text-gray-500">
                          Student No:{" "}
                          <span className="font-medium text-gray-700">
                            {selectedStudent.record?.studentNo}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Program:{" "}
                          <span className="font-medium text-gray-700">
                            {selectedStudent.record?.programId?.name}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Year:{" "}
                          <span className="font-medium text-gray-700">
                            {selectedStudent.record?.yearLevel}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {selectedSemester && grades.length > 0 && (
                        <a
                          href={`${import.meta.env.VITE_API_URL}/pdf/report-card/${selectedStudent.user._id}/${selectedSemester}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-blue-700"
                        >
                          Download PDF
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grades Table */}
                {loadingGrades ? (
                  <div className="px-6 py-8 text-center">
                    <p className="text-sm text-gray-400">Loading grades...</p>
                  </div>
                ) : grades.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <p className="text-sm text-gray-400">
                      No grades found for this semester.
                    </p>
                    <p className="text-xs text-gray-300 mt-1">
                      Grades may not be published yet or the student has no
                      enrollment this semester.
                    </p>
                  </div>
                ) : (
                  <div className="p-6">
                    <table className="w-full text-sm mb-6">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                            Code
                          </th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                            Subject
                          </th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                            Units
                          </th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                            Prelim
                          </th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                            Midterm
                          </th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                            Finals
                          </th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                            Remarks
                          </th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                            Lock Override
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {grades.map((item, i) => {
                          const finals = item.terms["finals"];
                          const midterm = item.terms["midterm"];
                          const prelim = item.terms["prelim"];
                          const finalGrade =
                            finals?.cumulativeGrade ??
                            midterm?.cumulativeGrade ??
                            prelim?.cumulativeGrade ??
                            null;
                          const passed =
                            finalGrade !== null && finalGrade >= 75;

                          return (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-3 py-3 font-mono text-xs font-medium text-gray-700">
                                {item.subject?.code || "—"}
                              </td>
                              <td className="px-3 py-3 text-gray-800">
                                {item.subject?.name || "—"}
                              </td>
                              <td className="px-3 py-3 text-gray-600 text-center">
                                {item.subject?.units || "—"}
                              </td>

                              {TERMS.map((term) => {
                                const g = item.terms[term];
                                return (
                                  <td
                                    key={term}
                                    className="px-3 py-3 text-center"
                                  >
                                    {g ? (
                                      <div>
                                        <span
                                          className={`font-medium text-sm ${g.cumulativeGrade >= 75 ? "text-green-600" : "text-red-600"}`}
                                        >
                                          {g.cumulativeGrade?.toFixed(2)}
                                        </span>
                                        <div className="flex items-center justify-center gap-1 mt-0.5">
                                          {g.isLocked && (
                                            <span className="text-xs text-red-400">
                                              🔒
                                            </span>
                                          )}
                                          {g.isPublished && (
                                            <span className="text-xs text-green-400">
                                              ✓
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-gray-300 text-xs">
                                        —
                                      </span>
                                    )}
                                  </td>
                                );
                              })}

                              <td className="px-3 py-3 text-center">
                                {finalGrade !== null ? (
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full font-medium ${passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                                  >
                                    {passed ? "Passed" : "Failed"}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-300">
                                    Pending
                                  </span>
                                )}
                              </td>

                              {/* Lock Override — registrar/superadmin only */}
                              <td className="px-3 py-3">
                                <div className="flex gap-1 flex-wrap">
                                  {TERMS.map((term) => {
                                    const g = item.terms[term];
                                    if (!g) return null;
                                    return (
                                      <button
                                        key={term}
                                        onClick={() =>
                                          handleOverrideLock(
                                            item.scheduleId,
                                            term,
                                            !g.isLocked,
                                          )
                                        }
                                        className={`text-xs px-1.5 py-0.5 rounded border capitalize ${g.isLocked ? "border-orange-300 text-orange-600 hover:bg-orange-50" : "border-gray-300 text-gray-500 hover:bg-gray-50"}`}
                                      >
                                        {g.isLocked
                                          ? `🔓 ${term}`
                                          : `🔒 ${term}`}
                                      </button>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Summary */}
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        {
                          label: "Total Units Enrolled",
                          value: totalUnits,
                          color: "text-gray-800",
                        },
                        {
                          label: "Units Earned",
                          value: earnedUnits,
                          color: "text-green-600",
                        },
                        {
                          label: "Units Failed",
                          value: failedUnits,
                          color: "text-red-600",
                        },
                        {
                          label: "GWA",
                          value: overallGWA.toFixed(2),
                          color:
                            overallGWA >= 75
                              ? "text-green-600"
                              : "text-red-600",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="bg-gray-50 rounded-md p-3 text-center"
                        >
                          <p className="text-xs text-gray-500 mb-1">
                            {item.label}
                          </p>
                          <p className={`text-2xl font-bold ${item.color}`}>
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
