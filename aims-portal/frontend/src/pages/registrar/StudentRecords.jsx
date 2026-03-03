import { useState, useEffect } from "react";
import api from "../../utils/api";
import DashboardLayout from "../../components/shared/DashboardLayout";
import GWAWidget from "../../components/shared/GWAWidget";

const TABS = ["Record", "Profile", "Enrollments", "GWA"];

export default function StudentRecords() {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("Record");
  const [programs, setPrograms] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [search, setSearch] = useState("");
  const [filterProgram, setFilterProgram] = useState("");
  const [recordForm, setRecordForm] = useState({
    yearLevel: "",
    programId: "",
    status: "",
  });
  const [profileForm, setProfileForm] = useState({
    phone: "",
    address: "",
    birthdate: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState("");

  useEffect(() => {
    fetchStudents();
    fetchDropdowns();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get("/students");
      setStudents(res.data.data);
    } catch (err) {
      setError("Failed to load students");
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        api.get("/programs"),
        api.get("/semesters"),
      ]);
      setPrograms(pRes.data.data);
      setSemesters(sRes.data.data);
      const active = sRes.data.data.find((s) => s.isActive);
      if (active) setSelectedSemester(active._id);
    } catch {}
  };

  const selectStudent = async (student) => {
    try {
      const res = await api.get(`/students/${student.user._id}`);
      const { user, record, profile, enrollments } = res.data.data;
      setSelected({ user, record, profile, enrollments });
      setRecordForm({
        yearLevel: record?.yearLevel || "",
        programId: record?.programId?._id || record?.programId || "",
        status: user?.status || "active",
      });
      setProfileForm({
        phone: profile?.phone || "",
        address: profile?.address || "",
        birthdate: profile?.birthdate ? profile.birthdate.slice(0, 10) : "",
      });
      setActiveTab("Record");
      setError("");
      setSuccess("");
    } catch {
      setError("Failed to load student details");
    }
  };

  const handleRecordSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.put(`/students/${selected.user._id}/record`, recordForm);
      setSuccess("Record updated");
      fetchStudents();
      // refresh selected
      const res = await api.get(`/students/${selected.user._id}`);
      setSelected((prev) => ({ ...prev, ...res.data.data }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update record");
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.put(`/students/${selected.user._id}/profile`, profileForm);
      setSuccess("Profile updated");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculateGWA = async () => {
    try {
      await api.post(`/students/${selected.user._id}/gwa/recalculate`);
      setSuccess("GWA recalculated");
    } catch {
      setError("Failed to recalculate GWA");
    }
  };

  const handleLinkParent = async (parentId) => {
    try {
      await api.put(`/users/${selected.user._id}/link-parent`, { parentId });
      setSuccess("Parent linked successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to link parent");
    }
  };

  const filtered = students.filter((s) => {
    const matchSearch =
      s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.record?.studentNo?.toLowerCase().includes(search.toLowerCase());
    const matchProgram = filterProgram
      ? s.record?.programId?._id === filterProgram ||
        s.record?.programId === filterProgram
      : true;
    return matchSearch && matchProgram;
  });

  const STATUS_COLORS = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-500",
    graduated: "bg-blue-100 text-blue-700",
    dropped: "bg-red-100 text-red-700",
    on_leave: "bg-yellow-100 text-yellow-700",
  };

  const ENROLLMENT_STATUS_COLORS = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    dropped: "bg-gray-100 text-gray-500",
  };

  return (
    <DashboardLayout>
      <div className="p-6 flex gap-6 h-full">
        {/* Left — Student List */}
        <div className="w-72 flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-800 mb-4">
            Student Records
          </h1>

          {/* Search */}
          <input
            type="text"
            placeholder="Search name, email, student no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Program filter */}
          <select
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Programs</option>
            {programs.map((p) => (
              <option key={p._id} value={p._id}>
                {p.code}
              </option>
            ))}
          </select>

          <p className="text-xs text-gray-400 mb-2">
            {filtered.length} student(s)
          </p>

          {/* Student list */}
          <div className="space-y-1 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No students found
              </p>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.user._id}
                  onClick={() => selectStudent(s)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                    selected?.user._id === s.user._id
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {s.user.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {s.record?.studentNo || s.user.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-gray-500">
                      {s.record?.programId?.code || "—"}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-500">
                      Yr {s.record?.yearLevel || "—"}
                    </span>
                    {s.record?.gwa && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-blue-600 font-medium">
                          GWA {s.record.gwa}%
                        </span>
                      </>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right — Detail Panel */}
        <div className="flex-1 min-w-0">
          {!selected ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-gray-400">
                Select a student to view their record
              </p>
            </div>
          ) : (
            <div>
              {/* Student Header */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-lg">
                    {selected.user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-gray-800">
                    {selected.user.name}
                  </p>
                  <p className="text-sm text-gray-400">{selected.user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {selected.record?.studentNo && (
                      <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        #{selected.record.studentNo}
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selected.user.status] || "bg-gray-100 text-gray-500"}`}
                    >
                      {selected.user.status}
                    </span>
                    {selected.record?.programId?.code && (
                      <span className="text-xs text-gray-500">
                        {selected.record.programId.code} — Year{" "}
                        {selected.record.yearLevel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Download Buttons */}
                {selectedSemester && (
                  <div className="flex gap-2 flex-shrink-0">
                    <a
                      href={`${import.meta.env.VITE_API_URL}/pdf/cor/${selected.user._id}/${selectedSemester}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-green-700 border border-green-200 bg-green-50 px-3 py-1.5 rounded hover:bg-green-100 font-medium"
                    >
                      Download COR
                    </a>
                    <a
                      href={`${import.meta.env.VITE_API_URL}/pdf/report-card/${selected.user._id}/${selectedSemester}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-700 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 font-medium"
                    >
                      Download Report Card
                    </a>
                  </div>
                )}
              </div>

              {/* Alerts */}
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

              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-4">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setError("");
                      setSuccess("");
                    }}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab: Record */}
              {activeTab === "Record" && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">
                    Academic Record
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Program
                      </label>
                      <select
                        value={recordForm.programId}
                        onChange={(e) =>
                          setRecordForm({
                            ...recordForm,
                            programId: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select program</option>
                        {programs.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({p.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Year Level
                      </label>
                      <select
                        value={recordForm.yearLevel}
                        onChange={(e) =>
                          setRecordForm({
                            ...recordForm,
                            yearLevel: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select year</option>
                        {[1, 2, 3, 4, 5].map((y) => (
                          <option key={y} value={y}>
                            Year {y}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Status
                      </label>
                      <select
                        value={recordForm.status}
                        onChange={(e) =>
                          setRecordForm({
                            ...recordForm,
                            status: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {[
                          "active",
                          "inactive",
                          "graduated",
                          "dropped",
                          "on_leave",
                        ].map((s) => (
                          <option key={s} value={s}>
                            {s.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Student No
                      </label>
                      <input
                        type="text"
                        value={selected.record?.studentNo || "—"}
                        disabled
                        className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleRecordSave}
                    disabled={saving}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Record"}
                  </button>

                  {/* Link Parent */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Link Parent
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="parentIdInput"
                        placeholder="Parent User ID"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          const val = document
                            .getElementById("parentIdInput")
                            .value.trim();
                          if (val) handleLinkParent(val);
                        }}
                        className="bg-gray-700 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800"
                      >
                        Link
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Enter the parent's User ID from the users list
                    </p>
                  </div>
                </div>
              )}

              {/* Tab: Profile */}
              {activeTab === "Profile" && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">
                    Personal Profile
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            phone: e.target.value,
                          })
                        }
                        placeholder="e.g. 09171234567"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Birthdate
                      </label>
                      <input
                        type="date"
                        value={profileForm.birthdate}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            birthdate: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        value={profileForm.address}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            address: e.target.value,
                          })
                        }
                        placeholder="e.g. 123 Main St, Manila"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleProfileSave}
                    disabled={saving}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              )}

              {/* Tab: Enrollments */}
              {activeTab === "Enrollments" && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-700">
                      Enrollment History
                    </p>
                  </div>
                  {!selected.enrollments?.length ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                      No enrollment records found
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="border-b border-gray-100">
                        <tr>
                          {["Semester", "Status", "Enrolled At"].map((h) => (
                            <th
                              key={h}
                              className="text-left px-4 py-2 text-xs font-medium text-gray-500"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selected.enrollments.map((e) => (
                          <tr key={e._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-700">
                              {e.semesterId?.schoolYear} — {e.semesterId?.term}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${ENROLLMENT_STATUS_COLORS[e.status]}`}
                              >
                                {e.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">
                              {new Date(e.enrolledAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Tab: GWA */}
              {activeTab === "GWA" && (
                <div className="space-y-4">
                  {/* Semester selector for semester GWA */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600">
                      Semester GWA:
                    </label>
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select semester</option>
                      {semesters.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.schoolYear} — {s.term}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleRecalculateGWA}
                      className="text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-50"
                    >
                      Recalculate GWA
                    </button>
                  </div>

                  {/* Semester GWA */}
                  {selectedSemester && (
                    <GWAWidget
                      studentId={selected.user._id}
                      semesterId={selectedSemester}
                    />
                  )}

                  {/* Overall GWA */}
                  <GWAWidget studentId={selected.user._id} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
