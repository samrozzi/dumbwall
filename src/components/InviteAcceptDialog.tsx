import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mail, Users } from "lucide-react";

interface PendingInvite {
  id: string;
  circle_id: string;
  circles: {
    name: string;
  };
  profiles: {
    display_name: string | null;
  };
}

interface InviteAcceptDialogProps {
  invite: PendingInvite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: (inviteId: string, circleId: string) => void;
  onDecline: (inviteId: string) => void;
}

export const InviteAcceptDialog = ({
  invite,
  open,
  onOpenChange,
  onAccept,
  onDecline,
}: InviteAcceptDialogProps) => {
  if (!invite) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <AlertDialogTitle className="text-center text-2xl">
            Circle Invitation
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-3 pt-2">
            <div className="flex items-center justify-center gap-2 text-base">
              <Users className="h-4 w-4" />
              <span className="font-semibold text-foreground">
                {invite.circles.name}
              </span>
            </div>
            <p className="text-sm">
              <span className="font-medium text-foreground">
                {invite.profiles?.display_name || "Someone"}
              </span>{" "}
              invited you to join this circle
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel
            onClick={() => onDecline(invite.id)}
            className="w-full sm:w-auto"
          >
            Decline
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onAccept(invite.id, invite.circle_id)}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            Join Circle
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
