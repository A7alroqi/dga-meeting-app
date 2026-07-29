import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { RequireAuth, RequireRole } from "./components/RoleGuard";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { GovernancePage } from "./pages/GovernancePage";
import { AgendaPage } from "./pages/AgendaPage";
import { ObjectivesPage } from "./pages/ObjectivesPage";
import { KpiDashboardPage } from "./pages/KpiDashboardPage";
import { TasksPage } from "./pages/TasksPage";
import { ChallengesPage } from "./pages/ChallengesPage";
import { FilesPage } from "./pages/FilesPage";
import { FileViewerPage } from "./pages/FileViewerPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminPeoplePage } from "./pages/admin/AdminPeoplePage";
import { AdminContentPage } from "./pages/admin/AdminContentPage";
import { AdminKpisPage } from "./pages/admin/AdminKpisPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <AppLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/governance" element={<GovernancePage />} />
                <Route path="/agenda" element={<AgendaPage />} />
                <Route path="/objectives" element={<ObjectivesPage />} />
                <Route path="/kpis" element={<KpiDashboardPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/challenges" element={<ChallengesPage />} />
                <Route path="/files" element={<FilesPage />} />
                <Route path="/files/:id" element={<FileViewerPage />} />
                <Route
                  path="/admin/users"
                  element={
                    <RequireRole roles={["admin"]}>
                      <AdminUsersPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/admin/people"
                  element={
                    <RequireRole roles={["admin"]}>
                      <AdminPeoplePage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/admin/content"
                  element={
                    <RequireRole roles={["admin"]}>
                      <AdminContentPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/admin/kpis"
                  element={
                    <RequireRole roles={["admin"]}>
                      <AdminKpisPage />
                    </RequireRole>
                  }
                />
              </Routes>
            </AppLayout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
