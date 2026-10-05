import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import Welcome from "./pages/Welcome";
import Index from "./pages/Index";
import Calculator from "./pages/Calculator";
import DriverSelect from "./pages/DriverSelect";
import DriverDashboard from "./pages/DriverDashboard";
import FleetMapPage from "./pages/FleetMapPage";
import MQTTDebug from "./pages/MQTTDebug";
import NotFound from "./pages/NotFound";
import { adminSession } from "@/lib/driver-api";

const queryClient = new QueryClient();

/**
 * UX guard only — real authorization is enforced by the driver-crud edge function
 * and database RLS. This just keeps signed-out visitors off admin screens.
 */
const RequireAdmin = ({ children }: { children: ReactNode }) =>
  adminSession.isActive() ? <>{children}</> : <Navigate to="/" replace />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/admin" element={<RequireAdmin><Index /></RequireAdmin>} />
          <Route path="/map" element={<RequireAdmin><FleetMapPage /></RequireAdmin>} />
          <Route path="/mqtt-debug" element={<RequireAdmin><MQTTDebug /></RequireAdmin>} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/driver" element={<DriverSelect />} />
          <Route path="/driver/select" element={<Navigate to="/driver" replace />} />
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
