import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Mail } from "lucide-react";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  circleId: string;
  circleName: string;
  isOwner: boolean;
  invitePermission: 'anyone' | 'owner_only';
  onSuccess: () => void;
}

export function AddMemberDialog({
  open,
  onOpenChange,
  circleId,
  circleName,
  isOwner,
  invitePermission,
  onSuccess,
}: AddMemberDialogProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  useEffect(() => {
    const checkEmail = async () => {
      if (!email || !email.includes('@')) {
        setUserExists(null);
        return;
      }

      setCheckingEmail(true);
      try {
        const { data } = await supabase
          .rpc('get_user_id_by_email', { user_email: email });
        
        setUserExists(!!data);
      } catch (error) {
        setUserExists(null);
      } finally {
        setCheckingEmail(false);
      }
    };

    const timer = setTimeout(checkEmail, 500);
    return () => clearTimeout(timer);
  }, [email]);

  const handleSendInvite = async () => {
    if (!email || !user) return;

    setSending(true);
    try {
      // Get inviter's name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', user.id)
        .single();

      const inviterName = profile?.display_name || profile?.username || 'A member';

      // Determine invite type based on permissions
      const needsApproval = !isOwner && invitePermission === 'owner_only';

      // Check if invite already exists for this email
      const { data: existingInvite } = await supabase
        .from('circle_invites')
        .select('id')
        .eq('circle_id', circleId)
        .eq('invited_email', email)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingInvite) {
        toast.error('An invitation has already been sent to this email');
        setSending(false);
        return;
      }

      // For existing users, check if they're already members via profiles table
      if (userExists) {
        const { data: existingMember } = await supabase
          .from('profiles')
          .select(`
            id,
            circle_members!inner (
              circle_id
            )
          `)
          .eq('circle_members.circle_id', circleId)
          .ilike('username', email.split('@')[0])
          .maybeSingle();

        if (existingMember) {
          toast.error('User is already a member of this circle');
          setSending(false);
          return;
        }
      }

      // Create invite record
      const { data: invite, error: inviteError } = await supabase
        .from('circle_invites')
        .insert({
          circle_id: circleId,
          invited_email: email,
          invited_by: user.id,
          invite_type: needsApproval ? 'pending_approval' : 'direct',
          status: 'pending',
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Send email notification
      if (needsApproval) {
        // Get owner email for approval request
        const { data: circle } = await supabase
          .from('circles')
          .select('created_by')
          .eq('id', circleId)
          .single();

        if (circle) {
          // Get owner's profile to access their email via auth.users
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', circle.created_by)
            .single();
          
          if (ownerProfile) {
            // Call the edge function - it will get the owner's email server-side
            await supabase.functions.invoke('send-invite-email', {
              body: {
                inviteId: invite.id,
                invitedEmail: email,
                circleName,
                inviterName,
                type: 'approval_request',
                ownerId: circle.created_by,
              },
            });
          }
        }

        toast.success('Approval request sent to circle owner');
      } else {
        // Send direct invite
        await supabase.functions.invoke('send-invite-email', {
          body: {
            inviteId: invite.id,
            invitedEmail: email,
            circleName,
            inviterName,
            type: userExists ? 'existing_user' : 'new_user',
          },
        });

        toast.success(userExists ? 'Invite sent! They\'ll see it when they log in.' : 'Invitation email sent!');
      }

      setEmail("");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Failed to send invite: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member to {circleName}</DialogTitle>
          <DialogDescription>
            Enter the email address of the person you'd like to invite.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
            />
            {checkingEmail && (
              <p className="text-sm text-muted-foreground">Checking...</p>
            )}
            {userExists !== null && !checkingEmail && (
              <div className="flex items-center gap-2 text-sm">
                {userExists ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Existing user - will receive in-app notification</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-600">New user - will receive signup invitation</span>
                  </>
                )}
              </div>
            )}
            {!isOwner && invitePermission === 'owner_only' && (
              <p className="text-sm text-amber-600">
                This circle requires owner approval. Your request will be sent to the owner.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendInvite} disabled={sending || !email || checkingEmail}>
            {sending ? 'Sending...' : 'Send Invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
