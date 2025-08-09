import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
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
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/children" component={Children} />
          <Route path="/classes" component={Classes} />
          <Route path="/attendance" component={Attendance} />
          <Route path="/meditation" component={Meditation} />
          <Route path="/verses" component={Verses} />
          <Route path="/notes" component={Notes} />
          <Route path="/messages" component={Messages} />
          <Route path="/reports" component={Reports} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
