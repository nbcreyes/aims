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
import ParentGrades from "./pages/parent/Grades";
import ParentAttendance from "./pages/parent/Attendance";
import ParentFees from "./pages/parent/Fees";
import UserManagement from "./pages/admin/UserManagement";
import Subjects from "./pages/admin/Subjects";
import Sections from "./pages/admin/Sections";
import GuestRoute from "./components/shared/GuestRoute";
import NotFound from "./pages/NotFound";
import Departments from "./pages/admin/Departments";
import Curriculum from "./pages/admin/Curriculum";
import ChangePassword from "./pages/shared/ChangePassword";
import Profile from "./pages/shared/Profile";
import INCGrades from "./pages/registrar/INCGrades";
import RemovalExams from "./pages/registrar/RemovalExams";
import GradeLock from "./pages/registrar/GradeLock";
import Transcript from "./pages/registrar/Transcript";
import StudentTranscript from "./pages/student/Transcript";

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
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />
          <Route
            path="/apply"
            element={
              <GuestRoute>
                <Apply />
              </GuestRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route
            path="/superadmin/change-password"
            element={
              <ProtectedRoute roles={["superadmin"]}>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/registrar/change-password"
            element={
              <ProtectedRoute roles={["registrar"]}>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cashier/change-password"
            element={
              <ProtectedRoute roles={["cashier"]}>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/change-password"
            element={
              <ProtectedRoute roles={["teacher"]}>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/change-password"
            element={
              <ProtectedRoute roles={["student"]}>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/change-password"
            element={
              <ProtectedRoute roles={["parent"]}>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          <Route
            path="/superadmin/profile"
            element={
              <ProtectedRoute roles={["superadmin"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/registrar/profile"
            element={
              <ProtectedRoute roles={["registrar"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cashier/profile"
            element={
              <ProtectedRoute roles={["cashier"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/profile"
            element={
              <ProtectedRoute roles={["teacher"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute roles={["student"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/profile"
            element={
              <ProtectedRoute roles={["parent"]}>
                <Profile />
              </ProtectedRoute>
            }
          />

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
          <Route
            path="/superadmin/announcements"
            element={
              <ProtectedRoute roles={["superadmin", "registrar"]}>
                <Announcements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/registrar/announcements"
            element={
              <ProtectedRoute roles={["superadmin", "registrar"]}>
                <Announcements />
              </ProtectedRoute>
            }
          />

          <Route
            path="/superadmin/subjects"
            element={
              <ProtectedRoute roles={["superadmin", "registrar"]}>
                <Subjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/sections"
            element={
              <ProtectedRoute roles={["superadmin", "registrar"]}>
                <Sections />
              </ProtectedRoute>
            }
          />

          <Route
            path="/superadmin/departments"
            element={
              <ProtectedRoute roles={["superadmin", "registrar"]}>
                <Departments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/superadmin/curriculum"
            element={
              <ProtectedRoute roles={["superadmin", "registrar"]}>
                <Curriculum />
              </ProtectedRoute>
            }
          />

          {/* Dashboards */}
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

          {/* Registrar */}
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
            path="/registrar/scheduling"
            element={
              <ProtectedRoute roles={["superadmin", "registrar"]}>
                <Scheduling />
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
            path="/registrar/attendance-reports"
            element={
              <ProtectedRoute roles={["superadmin", "registrar"]}>
                <AttendanceReports />
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
            path="/registrar/inc-grades"
            element={
              <ProtectedRoute roles={["registrar", "superadmin"]}>
                <INCGrades />
              </ProtectedRoute>
            }
          />

          <Route
            path="/registrar/removal-exams"
            element={
              <ProtectedRoute roles={["registrar", "superadmin"]}>
                <RemovalExams />
              </ProtectedRoute>
            }
          />

          <Route
            path="/registrar/grade-lock"
            element={
              <ProtectedRoute roles={["registrar", "superadmin"]}>
                <GradeLock />
              </ProtectedRoute>
            }
          />

          <Route
            path="/registrar/transcript"
            element={
              <ProtectedRoute roles={["registrar", "superadmin"]}>
                <Transcript />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/transcript"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentTranscript />
              </ProtectedRoute>
            }
          />

          {/* Student */}
          <Route
            path="/student/enrollment"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentEnrollment />
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
            path="/student/attendance"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentAttendance />
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
            path="/student/fees"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentFees />
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

          {/* Teacher */}
          <Route
            path="/teacher/classes"
            element={
              <ProtectedRoute roles={["teacher"]}>
                <TeacherClasses />
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
            path="/teacher/grades"
            element={
              <ProtectedRoute roles={["teacher"]}>
                <TeacherGrades />
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

          {/* Cashier */}
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

          {/* Parent */}
          <Route
            path="/parent/announcements"
            element={
              <ProtectedRoute roles={["parent"]}>
                <ParentAnnouncements />
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent/grades"
            element={
              <ProtectedRoute roles={["parent"]}>
                <ParentGrades />
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent/attendance"
            element={
              <ProtectedRoute roles={["parent"]}>
                <ParentAttendance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent/fees"
            element={
              <ProtectedRoute roles={["parent"]}>
                <ParentFees />
              </ProtectedRoute>
            }
          />

          <Route
            path="/superadmin/users"
            element={
              <ProtectedRoute roles={["superadmin"]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
