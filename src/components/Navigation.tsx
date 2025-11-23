import { NavLink, useLocation } from "react-router-dom";
import { StickyNote, MessageCircle, Users, Settings, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavigationProps {
  circleId?: string;
}

const Navigation = ({ circleId }: NavigationProps) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  
  const navItems = [
    { icon: StickyNote, label: "Wall", path: `/circle/${circleId}/wall` },
    { icon: Gamepad2, label: "Games", path: `/circle/${circleId}/games` },
    { icon: MessageCircle, label: "Chat", path: `/circle/${circleId}/chat` },
    { icon: Users, label: "People", path: `/circle/${circleId}/people` },
    { icon: Settings, label: "Settings", path: `/circle/${circleId}/settings` },
  ];

  if (!circleId) return null;

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-t border-border">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "p-3 rounded-full transition-all duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="w-5 h-5" />
            </NavLink>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed left-4 top-1/2 -translate-y-1/2 z-[100] bg-card/80 backdrop-blur-md border border-border rounded-full p-2 shadow-lg">
      <div className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isCurrentPage = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "p-3 rounded-full transition-all duration-300 group relative",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className={cn(
                "absolute left-full ml-3 px-2 py-1 border rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[99999] top-1/2 -translate-y-1/2",
                isCurrentPage 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-card text-foreground border-border"
              )}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
