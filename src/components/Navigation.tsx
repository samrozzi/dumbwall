import { NavLink } from "react-router-dom";
import { StickyNote, MessageCircle, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  circleId?: string;
}

const Navigation = ({ circleId }: NavigationProps) => {
  const navItems = [
    { icon: StickyNote, label: "Wall", path: `/circle/${circleId}/wall` },
    { icon: MessageCircle, label: "Chat", path: `/circle/${circleId}/chat` },
    { icon: Users, label: "People", path: `/circle/${circleId}/people` },
    { icon: Settings, label: "Settings", path: `/circle/${circleId}/settings` },
  ];

  if (!circleId) return null;

  return (
    <nav className="fixed left-4 top-1/2 -translate-y-1/2 z-50 bg-card/80 backdrop-blur-md border border-border rounded-full p-2 shadow-lg">
      <div className="flex flex-col gap-2">
        {navItems.map((item) => (
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
            <span className="absolute left-full ml-3 px-2 py-1 bg-card border border-border rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
