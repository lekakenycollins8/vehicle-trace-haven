import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Vehicles from "./pages/Vehicles";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SessionContextProvider supabaseClient={supabase}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <DashboardLayout>
                  <Index />
                </DashboardLayout>
              }
            />
            <Route
              path="/vehicles"
              element={
                <DashboardLayout>
                  <Vehicles />
                </DashboardLayout>
              }
            />
            <Route
              path="/reports"
              element={
                <DashboardLayout>
                  <Reports />
                </DashboardLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SessionContextProvider>
  </QueryClientProvider>
);

export default App;