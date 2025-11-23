import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import Auth from "./pages/Auth";
import Circles from "./pages/Circles";
import Wall from "./pages/Wall";
import Chat from "./pages/Chat";
import People from "./pages/People";
import CircleSettings from "./pages/CircleSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/circles" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/circles" element={<Circles />} />
            <Route path="/circle/:circleId/wall" element={<Wall />} />
            <Route path="/circle/:circleId/chat" element={<Chat />} />
            <Route path="/circle/:circleId/people" element={<People />} />
            <Route path="/circle/:circleId/settings" element={<CircleSettings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
