import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StoreProvider } from "@/contexts/StoreContext";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import ProcedimentosPage from "./pages/ProcedimentosPage";
import MidiaPage from "./pages/MidiaPage";
import FunilPage from "./pages/FunilPage";
import VendasPage from "./pages/VendasPage";
import AlertasPage from "./pages/AlertasPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <StoreProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ExecutiveDashboard />} />
            <Route path="/procedimentos" element={<ProcedimentosPage />} />
            <Route path="/midia" element={<MidiaPage />} />
            <Route path="/funil" element={<FunilPage />} />
            <Route path="/vendas" element={<VendasPage />} />
            <Route path="/alertas" element={<AlertasPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
