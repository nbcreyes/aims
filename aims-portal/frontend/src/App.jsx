import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminDashboard from "./pages/admin/Dashboard";
import Programs from "./pages/admin/Programs";
import Semesters from "./pages/admin/Semesters";
import Apply from "./pages/auth/Apply";
import Applications from "./pages/registrar/Applications";
import Enrollments from "./pages/registrar/Enrollments";
import StudentEnrollment from "./pages/student/Enrollment";
import Scheduling from "./pages/registrar/Scheduling";
import TeacherClasses from "./pages/teacher/Classes";
import StudentSchedule from "./pages/student/Schedule";
import StudentRecords from "./pages/registrar/StudentRecords";
import TeacherAttendance from "./pages/teacher/Attendance";
import AttendanceReports from "./pages/registrar/AttendanceReports";
import StudentAttendance from "./pages/student/Attendance";
import TeacherGrades from "./pages/teacher/Grades";
import StudentGrades from "./pages/student/Grades";
import ReportCards from "./pages/registrar/ReportCards";
import Fees from "./pages/cashier/Fees";
import Payments from "./pages/cashier/Payments";
import Receipts from "./pages/cashier/Receipts";
import Overdue from "./pages/cashier/Overdue";
import StudentFees from "./pages/student/Fees";
import Announcements from "./pages/admin/Announcements";
import StudentAnnouncements from "./pages/student/Announcements";
import TeacherAnnouncements from "./pages/teacher/Announcements";
import ParentAnnouncements from "./pages/parent/Announcements";

// Placeholder dashboards
import RegistrarDashboard from "./pages/registrar/Dashboard";
import CashierDashboard from "./pages/cashier/Dashboard";
import TeacherDashboard from "./pages/teacher/Dashboard";
import StudentDashboard from "./pages/student/Dashboard";
import ParentDashboard from "./pages/parent/Dashboard";

import DashboardLayout from "./components/shared/DashboardLayout";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Superadmin */}
          <Route
            path="/superadmin/dashboard"
            element={
              <ProtectedRoute roles={["superadmin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/programs"
            element={
              <ProtectedRoute roles={["superadmin", "registrar"]}>
                <DashboardLayout>
                  <Programs />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/semesters"
            element={
              <ProtectedRoute roles={["superadmin", "registrar"]}>
                <DashboardLayout>
                  <Semesters />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Other roles */}
          <Route
            path="/registrar/dashboard"
            element={
              <ProtectedRoute roles={["registrar"]}>
                <RegistrarDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cashier/dashboard"
            element={
              <ProtectedRoute roles={["cashier"]}>
                <CashierDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute roles={["teacher"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/dashboard"
            element={
              <ProtectedRoute roles={["parent"]}>
                <ParentDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/apply" element={<Apply />} />
          <Route
            path="/registrar/applications"
            element={
              <ProtectedRoute roles={["superadmin", "registrar"]}>
                <Applications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/registrar/enrollments"
            element={
              <ProtectedRoute roles={["superadmin", "registrar"]}>
                <Enrollments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/enrollment"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentEnrollment />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Route
          path="/registrar/scheduling"
          element={
            <ProtectedRoute roles={["superadmin", "registrar"]}>
              <Scheduling />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/classes"
          element={
            <ProtectedRoute roles={["teacher"]}>
              <TeacherClasses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/schedule"
          element={
            <ProtectedRoute roles={["student"]}>
              <StudentSchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registrar/student-records"
          element={
            <ProtectedRoute roles={["superadmin", "registrar"]}>
              <StudentRecords />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <ProtectedRoute roles={["teacher"]}>
              <TeacherAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registrar/attendance-reports"
          element={
            <ProtectedRoute roles={["superadmin", "registrar"]}>
              <AttendanceReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/attendance"
          element={
            <ProtectedRoute roles={["student"]}>
              <StudentAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/grades"
          element={
            <ProtectedRoute roles={["teacher"]}>
              <TeacherGrades />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/grades"
          element={
            <ProtectedRoute roles={["student"]}>
              <StudentGrades />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registrar/report-cards"
          element={
            <ProtectedRoute roles={["superadmin", "registrar"]}>
              <ReportCards />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier/fees"
          element={
            <ProtectedRoute roles={["superadmin", "cashier"]}>
              <Fees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier/payments"
          element={
            <ProtectedRoute roles={["superadmin", "cashier"]}>
              <Payments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier/receipts"
          element={
            <ProtectedRoute roles={["superadmin", "cashier"]}>
              <Receipts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier/overdue"
          element={
            <ProtectedRoute roles={["superadmin", "cashier"]}>
              <Overdue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/fees"
          element={
            <ProtectedRoute roles={["student"]}>
              <StudentFees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/announcements"
          element={
            <ProtectedRoute roles={["superadmin", "registrar"]}>
              <Announcements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/announcements"
          element={
            <ProtectedRoute roles={["student"]}>
              <StudentAnnouncements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/announcements"
          element={
            <ProtectedRoute roles={["teacher"]}>
              <TeacherAnnouncements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/announcements"
          element={
            <ProtectedRoute roles={["parent"]}>
              <ParentAnnouncements />
            </ProtectedRoute>
          }
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
