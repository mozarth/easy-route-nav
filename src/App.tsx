import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import PropertyPage from "./pages/PropertyPage";
import LoteFinder from "./pages/LoteFinder";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProperties from "./pages/admin/AdminProperties";
import AdminHistory from "./pages/admin/AdminHistory";
import AdminQRCodes from "./pages/admin/AdminQRCodes";
import AdminQRCodesEtapas from "./pages/admin/AdminQRCodesEtapas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/property/:slug" element={<PropertyPage />} />
            <Route path="/lote-finder/:etapa" element={<LoteFinder />} />
            
            {/* Admin Login */}
            <Route path="/admin" element={<AdminLogin />} />
            
            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/properties" element={<AdminProperties />} />
              <Route path="/admin/history" element={<AdminHistory />} />
              <Route path="/admin/qr-codes" element={<AdminQRCodes />} />
              <Route path="/admin/qr-etapas" element={<AdminQRCodesEtapas />} />
            </Route>
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
