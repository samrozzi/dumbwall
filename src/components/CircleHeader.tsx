import { CircleMembersBar } from "@/components/CircleMembersBar";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useIsMobile } from "@/hooks/use-mobile";

interface CircleHeaderProps {
  circleId: string;
  pageTitle: string;
  onAddMember?: () => void;
  actions?: React.ReactNode;
}

export const CircleHeader = ({ 
  circleId, 
  pageTitle, 
  onAddMember, 
  actions 
}: CircleHeaderProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="w-full mb-6">
      {/* Desktop layout */}
      <div className="hidden sm:flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold">{pageTitle}</h1>
        
        <div className="flex gap-3 items-center">
          <CircleMembersBar 
            circleId={circleId} 
            onAddMember={onAddMember}
          />
          <NotificationCenter />
          {actions}
        </div>
      </div>
      
      {/* Mobile layout */}
      <div className="sm:hidden flex justify-between items-center">
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
        
        <div className="flex gap-2 items-center">
          <CircleMembersBar 
            circleId={circleId} 
            onAddMember={onAddMember}
            compact
          />
          <NotificationCenter />
          {actions}
        </div>
      </div>
    </div>
  );
};
