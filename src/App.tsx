import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Index from "./pages/Index";
import Calculator from "./pages/Calculator";
import DriverLogin from "./pages/DriverLogin";
import DriverSelect from "./pages/DriverSelect";
import DriverDashboard from "./pages/DriverDashboard";
import DriverManagementPage from "./pages/DriverManagementPage";
import FleetMapPage from "./pages/FleetMapPage";
import MQTTDebug from "./pages/MQTTDebug";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

//temp
console.log("SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/admin" element={<Index />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/map" element={<FleetMapPage />} />
          <Route path="/driver" element={<DriverLogin />} />
          <Route path="/driver/select" element={<DriverSelect />} />
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
          <Route path="/driver/manage" element={<DriverManagementPage />} />
          <Route path="/mqtt-debug" element={<MQTTDebug />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
