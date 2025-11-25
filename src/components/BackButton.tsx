import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export const BackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Only show on settings and profile pages
  const shouldShow = location.pathname.includes('/settings') || 
                     location.pathname.startsWith('/u/');
  
  if (!shouldShow || isMobile) return null;
  
  return (
    <div className="fixed left-4 top-[calc(50%-200px)] z-[10001]">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(-1)}
        className="rounded-full bg-yellow-500 hover:bg-yellow-600 text-black w-12 h-12 shadow-lg"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>
    </div>
  );
};
