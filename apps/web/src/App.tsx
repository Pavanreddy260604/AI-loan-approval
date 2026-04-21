import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AppShell, NotificationProvider } from "./components/layout";
import { ScrollToTop } from "./components/ScrollToTop";
import { OfflineBanner } from "./components/OfflineBanner";
import { clearSession, getSession, persistSession, type AuthSession } from "./lib/api";

// Elite v2 Page Modules
const AuthPage = lazy(() => import("./pages/AuthPage").then((m) => ({ default: m.AuthPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const DatasetsPage = lazy(() => import("./pages/DatasetsPage").then((m) => ({ default: m.DatasetsPage })));
const ModelsPage = lazy(() => import("./pages/ModelsPage").then((m) => ({ default: m.ModelsPage })));
const PredictPage = lazy(() => import("./pages/PredictPage").then((m) => ({ default: m.PredictPage })));
const AdminPage = lazy(() => import("./pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const LoanDetailPage = lazy(() => import("./pages/LoanDetailPage").then((m) => ({ default: m.LoanDetailPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

export interface AuthContextValue {
  session: AuthSession | null;
  setSession: (next: AuthSession | null) => void;
}

// Global Loading State (Pro Skeletons)
function GlobalSkeleton() {
  return (
     <div className="flex-1 p-8 space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-base-900 rounded-pro" />
        <div className="grid grid-cols-4 gap-6">
           {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-base-900 rounded-pro-lg" />)}
        </div>
        <div className="h-[400px] bg-base-900 rounded-pro-lg" />
     </div>
  );
}

function App() {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = getSession();
    if (saved) setSessionState(saved);
    setLoading(false);
  }, []);

  const auth = useMemo<AuthContextValue>(
    () => ({
      session,
      setSession(next: AuthSession | null) {
        setSessionState(next);
        if (next) {
          persistSession(next);
        } else {
          clearSession();
        }
      },
    }),
    [session],
  );

  useEffect(() => {
    if (loading) return;
    if (!session && location.pathname.startsWith("/app")) {
      navigate("/auth", { replace: true });
    }
    if (session && (location.pathname === "/" || location.pathname === "/auth")) {
      navigate("/app/dashboard", { replace: true });
    }
  }, [loading, location.pathname, navigate, session]);

  if (loading) {
    return <div className="h-screen bg-base-950 flex items-center justify-center"><GlobalSkeleton /></div>;
  }

  return (
    <div className="min-h-screen bg-base-950 flex flex-col font-sans selection:bg-primary/30">
      <OfflineBanner />
      <ScrollToTop />
      <Suspense fallback={<GlobalSkeleton />}>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<AuthPage auth={auth} />} />
          <Route path="/app/*" element={session ? <ProtectedApp auth={auth} /> : <GlobalSkeleton />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

import { AccessibilityProvider } from "./lib/accessibility/AccessibilityProvider";
import { UndoProvider } from "./lib/undo-provider";
import { ThemeProvider } from "./lib/theme-provider";

// ProtectedApp wraps all authenticated routes with necessary providers
function ProtectedApp({ auth }: { auth: AuthContextValue }) {
  const navigate = useNavigate();

  function handleLogout() {
    auth.setSession(null);
    navigate("/auth", { replace: true });
  }

  return (
    <ThemeProvider>
      <NotificationProvider authToken={auth.session?.token}>
        <AccessibilityProvider>
          <UndoProvider>
            <AppShell auth={auth} onLogout={handleLogout}>
          <Suspense fallback={<GlobalSkeleton />}>
            <Routes>
              <Route path="/" element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage auth={auth} />} />
              <Route path="datasets" element={<DatasetsPage auth={auth} />} />
              <Route path="models" element={<ModelsPage auth={auth} />} />
              <Route path="predict" element={<PredictPage auth={auth} />} />
              <Route path="profile" element={<ProfilePage auth={auth} />} />
              <Route path="loan/:id" element={<LoanDetailPage auth={auth} />} />
              <Route
                path="admin"
                element={
                  auth.session?.user.role === "ADMIN"
                    ? <AdminPage auth={auth} />
                    : <Navigate to="/app/dashboard" replace />
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          </AppShell>
          </UndoProvider>
        </AccessibilityProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
