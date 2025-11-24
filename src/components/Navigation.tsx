import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { StickyNote, MessageCircle, Users, Settings, Gamepad2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

interface NavigationProps {
  circleId?: string;
  hideBackButton?: boolean;
}

const Navigation = ({ circleId, hideBackButton }: NavigationProps) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're on a profile page (should highlight People nav)
  const isOnProfilePage = location.pathname.startsWith('/u/');
  
  // If no circleId and hideBackButton is true, don't render anything
  if (!circleId && hideBackButton) {
    return null;
  }
  
  // If no circleId, show simple back navigation
  if (!circleId) {
    if (isMobile) {
      return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-t border-border">
          <div className="flex items-center justify-center px-2 py-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/circles")}
              className="gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Circles
            </Button>
          </div>
        </nav>
      );
    }
    return (
      <nav className="fixed left-4 top-1/2 -translate-y-1/2 z-[10000] bg-card/80 backdrop-blur-md border border-border rounded-full p-2 shadow-lg">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate("/circles")}
          className="rounded-full"
          title="Back to Circles"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </nav>
    );
  }
  
  const navItems = [
    { icon: StickyNote, label: "Wall", path: `/circle/${circleId}/wall` },
    { icon: Gamepad2, label: "Games", path: `/circle/${circleId}/games` },
    { icon: MessageCircle, label: "Chat", path: `/circle/${circleId}/chat` },
    { icon: Users, label: "People", path: `/circle/${circleId}/people` },
    { icon: Settings, label: "Settings", path: `/circle/${circleId}/settings` },
  ];

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-t border-border">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
                           (item.label === "People" && isOnProfilePage);
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={
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
          );
        })}
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed left-4 top-1/2 -translate-y-1/2 z-[10000] bg-card/80 backdrop-blur-md border border-border rounded-full p-2 shadow-lg">
      <div className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isCurrentPage = location.pathname === item.path ||
                               (item.label === "People" && isOnProfilePage);
          
          return (
            <div key={item.path} className="relative group">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "p-3 rounded-full transition-all duration-300 block",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
              </NavLink>
              <div 
                className={cn(
                  "absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-md text-sm whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-[9999]",
                  isCurrentPage 
                    ? "bg-primary text-primary-foreground border border-primary shadow-md" 
                    : "bg-card text-foreground border border-border shadow-md"
                )}
              >
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
