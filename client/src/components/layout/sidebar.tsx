import { Link, useLocation } from "wouter";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  LayoutDashboard, 
  UsersRound, 
  CheckSquare, 
  Heart, 
  BookOpen, 
  StickyNote, 
  MessageCircle, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Turmas", href: "/classes", icon: Users },
  { name: "Crianças", href: "/children", icon: UsersRound },
  { name: "Chamada", href: "/attendance", icon: CheckSquare },
  { name: "Meditação", href: "/meditation", icon: Heart },
  { name: "Versículos", href: "/verses", icon: BookOpen },
  { name: "Anotações", href: "/notes", icon: StickyNote },
  { name: "Mensagens", href: "/messages", icon: MessageCircle },
  { name: "Relatórios", href: "/reports", icon: BarChart3 },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const SidebarContent = () => (
    <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-surface border-r border-border">
      <div className="flex items-center flex-shrink-0 px-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
            <Users className="text-white h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Sistema Kids</h1>
        </div>
      </div>
      
      {/* User Profile */}
      <div className="mt-6 px-4">
        <div className="flex items-center p-3 bg-accent rounded-lg">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-medium text-sm">
              {user ? getInitials(`${user.firstName || ''} ${user.lastName || ''}`) : 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user ? `${user.firstName || ''} ${user.lastName || ''}` : 'Usuário'}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.role === 'admin' ? 'Admin' : 
               user?.role === 'leader' ? 'Líder' : 'Auxiliar'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6 flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start group",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Settings and Logout */}
      <div className="px-4 pb-4 space-y-1">
        <Link href="/settings">
          <Button
            variant={location === "/settings" ? "default" : "ghost"}
            className={cn(
              "w-full justify-start",
              location === "/settings" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
            onClick={() => setIsMobileOpen(false)}
          >
            <Settings className="mr-3 h-4 w-4" />
            Configurações
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-surface border border-border"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
