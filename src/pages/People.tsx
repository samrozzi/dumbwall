import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { CircleHeader } from "@/components/CircleHeader";
import { AddMemberDialog } from "@/components/AddMemberDialog";
import { supabase } from "@/integrations/supabase/client";
import { StoriesRow } from "@/components/people/StoriesRow";
import { ActivityFeed } from "@/components/people/ActivityFeed";
import { MembersPanel } from "@/components/people/MembersPanel";
import { useIsMobile } from "@/hooks/use-mobile";

const People = () => {
  const { circleId } = useParams();
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [circleName, setCircleName] = useState("");
  const [canInvite, setCanInvite] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!circleId) return;
    loadCircleInfo();
  }, [circleId]);

  const loadCircleInfo = async () => {
    if (!circleId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: circle } = await supabase
        .from("circles")
        .select("name, created_by")
        .eq("id", circleId)
        .single();

      if (circle) {
        setCircleName(circle.name);
        setIsOwner(circle.created_by === user.id);
      }

      const { data: canInviteResult } = await supabase.rpc("can_invite_to_circle", {
        circle_uuid: circleId,
        user_uuid: user.id,
      });

      setCanInvite(canInviteResult || false);
    } catch (error) {
      console.error("Error loading circle info:", error);
    }
  };

  if (!circleId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Circle not found</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <Navigation circleId={circleId} />

      <div className={`flex-1 flex flex-col ${!isMobile ? 'pl-24 pr-8' : 'px-4'} pt-8 min-h-0`}>
        {/* Header */}
        <CircleHeader
          circleId={circleId}
          pageTitle={circleName}
          onAddMember={canInvite ? () => setAddMemberOpen(true) : undefined}
        />

        {/* Stories Row */}
        <div className="mb-4 pb-4 border-b border-white/[0.06] flex-shrink-0">
          <StoriesRow circleId={circleId} />
        </div>

        {/* Two Column Layout - Now takes remaining height */}
        <div className={`flex ${isMobile ? 'flex-col' : 'gap-6'} flex-1 min-h-0`}>
          {/* Activity Feed */}
          <div className={`${isMobile ? 'mb-6' : 'flex-[2]'} flex flex-col min-h-0`}>
            <h2 className="text-2xl font-bold mb-4 flex-shrink-0">Activity</h2>
            <ActivityFeed circleId={circleId} />
          </div>

          {/* Members Panel (hidden on mobile, uses top bar) */}
          {!isMobile && (
            <div className="flex-1 min-w-0">
              <MembersPanel circleId={circleId} />
            </div>
          )}
        </div>
      </div>

      <AddMemberDialog
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        circleId={circleId}
        circleName={circleName}
        isOwner={isOwner}
        invitePermission={canInvite ? 'anyone' : 'owner_only'}
        onSuccess={() => {}}
      />
    </div>
  );
};

export default People;
