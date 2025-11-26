import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { CustomNotification } from "@/components/ui/custom-notification";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { usePresenceTracking } from "./hooks/usePresenceTracking";
import ErrorBoundary from "./components/ErrorBoundary";
import Auth from "./pages/Auth";
import Circles from "./pages/Circles";
import Wall from "./pages/Wall";
import Games from "./pages/Games";
import GameDetail from "./pages/GameDetail";
import Chat from "./pages/Chat";
import People from "./pages/People";
import Settings from "./pages/Settings";
import PublicProfile from "./pages/PublicProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  usePresenceTracking();
  
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/circles" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/circles" element={<ProtectedRoute><Circles /></ProtectedRoute>} />
      <Route path="/circle/:circleId/wall" element={<ProtectedRoute><Wall /></ProtectedRoute>} />
      <Route path="/circle/:circleId/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
      <Route path="/circle/:circleId/games/:gameId" element={<ProtectedRoute><GameDetail /></ProtectedRoute>} />
      <Route path="/circle/:circleId/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/circle/:circleId/people" element={<ProtectedRoute><People /></ProtectedRoute>} />
      <Route path="/circle/:circleId/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/u/:username" element={<PublicProfile />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};


const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CustomNotification />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
