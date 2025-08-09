import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Children from "@/pages/children";
import Classes from "@/pages/classes";
import Attendance from "@/pages/attendance";
import Meditation from "@/pages/meditation";
import Verses from "@/pages/verses";
import Notes from "@/pages/notes";
import Messages from "@/pages/messages";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/children" component={Children} />
      <ProtectedRoute path="/classes" component={Classes} />
      <ProtectedRoute path="/attendance" component={Attendance} />
      <ProtectedRoute path="/meditation" component={Meditation} />
      <ProtectedRoute path="/verses" component={Verses} />
      <ProtectedRoute path="/notes" component={Notes} />
      <ProtectedRoute path="/messages" component={Messages} />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/settings" component={Settings} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="dark">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
