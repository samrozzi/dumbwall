import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Game } from "@/types/games";
import { GameWrapper } from "./GameWrapper";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { InviteMemberDialog } from "./InviteMemberDialog";

interface GameCardProps {
  game: Game;
  userId: string;
}

export const GameCard = ({ game, userId }: GameCardProps) => {
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  return (
    <>
      <Card className="relative group">
        <CardContent className="p-4">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowInviteDialog(true)}
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Invite
            </Button>
          </div>
          <GameWrapper gameId={game.id} userId={userId} />
        </CardContent>
      </Card>

      <InviteMemberDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        gameId={game.id}
        circleId={game.circle_id}
      />
    </>
  );
};
