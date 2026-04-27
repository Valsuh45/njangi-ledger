import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Groups from "./pages/Groups";
import NewGroup from "./pages/NewGroup";
import GroupDetail from "./pages/GroupDetail";
import MemberDetail from "./pages/MemberDetail";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
          <Route path="/groups/new" element={<ProtectedRoute><NewGroup /></ProtectedRoute>} />
          <Route path="/groups/:id" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
          <Route
            path="/groups/:groupId/members/:memberId"
            element={<ProtectedRoute><MemberDetail /></ProtectedRoute>}
          />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/index" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
