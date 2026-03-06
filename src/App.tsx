import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import ProcedimentosPage from "./pages/ProcedimentosPage";
import MidiaPage from "./pages/MidiaPage";
import FunilPage from "./pages/FunilPage";
import VendasPage from "./pages/VendasPage";
import AlertasPage from "./pages/AlertasPage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, masterOnly = false }: { children: React.ReactNode; masterOnly?: boolean }) {
  const { user, loading, isMaster } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="text-muted-foreground">Carregando...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (masterOnly && !isMaster) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="text-muted-foreground">Carregando...</div></div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><ExecutiveDashboard /></ProtectedRoute>} />
      <Route path="/procedimentos" element={<ProtectedRoute masterOnly><ProcedimentosPage /></ProtectedRoute>} />
      <Route path="/midia" element={<ProtectedRoute masterOnly><MidiaPage /></ProtectedRoute>} />
      <Route path="/funil" element={<ProtectedRoute><FunilPage /></ProtectedRoute>} />
      <Route path="/vendas" element={<ProtectedRoute><VendasPage /></ProtectedRoute>} />
      <Route path="/alertas" element={<ProtectedRoute masterOnly><AlertasPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute masterOnly><AdminPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <StoreProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </StoreProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
