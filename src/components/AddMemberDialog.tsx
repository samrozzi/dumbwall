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
import { CheckCircle, Mail, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  circleId: string;
  circleName: string;
  isOwner: boolean;
  invitePermission: 'anyone' | 'owner_only';
  onSuccess: () => void;
}

interface UserSearchResult {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setSearchResults([]);
        setSearchError(null);
        return;
      }

      setSearching(true);
      setSearchError(null);
      try {
        const cleanTerm = searchTerm.startsWith('@') ? searchTerm.slice(1) : searchTerm;
        
        console.log('Searching for:', cleanTerm);
        
        const { data, error } = await supabase.rpc('search_users_by_username_or_email', {
          search_term: cleanTerm
        });

        if (error) {
          console.error('Search error:', error);
          setSearchError(error.message);
          setSearchResults([]);
          throw error;
        }
        
        console.log('Search results:', data?.length || 0, data);
        console.log('popoverOpen state:', popoverOpen);
        setSearchResults(data || []);
        console.log('searchResults state after update:', data);
      } catch (error: any) {
        console.error('Search error:', error);
        setSearchError(error.message || 'Failed to search users');
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Control popover visibility based on search term
  useEffect(() => {
    if (searchTerm.length >= 2 && !selectedUser) {
      setPopoverOpen(true);
    } else {
      setPopoverOpen(false);
    }
  }, [searchTerm, selectedUser]);

  // Get email from username lookup
  const getEmailFromUserId = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (error || !data) return null;

      // Use the edge function to get user email
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      return userData?.user?.email || null;
    } catch {
      return null;
    }
  };

  const handleUserSelect = async (selectedUser: UserSearchResult) => {
    setSelectedUser(selectedUser);
    setSearchTerm(`@${selectedUser.username}`);
    setPopoverOpen(false);

    // For selected users, we'll use their user_id to send notification directly
    // But we still need an email for the invite record
    const userEmail = await getEmailFromUserId(selectedUser.id);
    if (userEmail) {
      setEmail(userEmail);
    }
  };

  const handleSendInvite = async () => {
    if ((!email && !selectedUser) || !user) return;

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

      const inviteEmail = selectedUser ? email : email;
      if (!inviteEmail) {
        toast.error('Please enter an email or select a user');
        setSending(false);
        return;
      }

      // Check if invite already exists for this email
      const { data: existingInvite } = await supabase
        .from('circle_invites')
        .select('id')
        .eq('circle_id', circleId)
        .eq('invited_email', inviteEmail)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingInvite) {
        toast.error('An invitation has already been sent to this user');
        setSending(false);
        return;
      }

      // Backend will handle duplicate member checking during invite acceptance

      // Create invite record
      const { data: invite, error: inviteError } = await supabase
        .from('circle_invites')
        .insert({
          circle_id: circleId,
          invited_email: inviteEmail,
          invited_by: user.id,
          invite_type: needsApproval ? 'pending_approval' : 'direct',
          status: 'pending',
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // If user was selected from search, send them a notification using secure function
      if (selectedUser) {
        await supabase.rpc('create_notification', {
          target_user_id: selectedUser.id,
          notif_type: 'circle_invite',
          notif_title: 'Circle Invitation',
          notif_message: `${inviterName} invited you to join ${circleName}`,
          notif_link: `/circles`,
          notif_metadata: { circle_id: circleId, invite_id: invite.id }
        });
      }

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
        if (!selectedUser) {
          await supabase.functions.invoke('send-invite-email', {
            body: {
              inviteId: invite.id,
              invitedEmail: inviteEmail,
              circleName,
              inviterName,
              type: 'new_user',
            },
          });
        }

        toast.success(selectedUser ? `Invite sent to @${selectedUser.username}!` : 'Invitation email sent!');
      }

      setEmail("");
      setSearchTerm("");
      setSelectedUser(null);
      setSearchResults([]);
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
            <Label htmlFor="search">Search by Username</Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen} modal={false}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => {
                      if (searchTerm.length >= 2) {
                        setPopoverOpen(true);
                      }
                    }}
                    placeholder="Search by @username..."
                    className="pl-9"
                    disabled={!!selectedUser}
                    autoComplete="off"
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[400px] p-0" 
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <Command shouldFilter={false}>
                  <CommandList>
                    <CommandEmpty>
                      {searching ? 'Searching...' : 
                       searchError ? `Error: ${searchError}` : 
                       'No users found.'}
                    </CommandEmpty>
                    <CommandGroup>
                      {searchResults.map((result) => (
                        <CommandItem
                          key={result.id}
                          onSelect={() => handleUserSelect(result)}
                          className="flex items-center gap-3 p-3 cursor-pointer"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={result.avatar_url || undefined} />
                            <AvatarFallback>
                              {result.display_name?.[0] || result.username?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{result.display_name || 'No name'}</span>
                            <span className="text-sm text-muted-foreground">@{result.username}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            {selectedUser && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback>
                    {selectedUser.display_name?.[0] || selectedUser.username?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-medium">{selectedUser.display_name}</span>
                  <span className="text-xs text-muted-foreground">@{selectedUser.username}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedUser(null);
                    setSearchTerm("");
                    setEmail("");
                  }}
                >
                  Clear
                </Button>
              </div>
            )}

            {!selectedUser && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="email" className="text-sm text-muted-foreground">Or enter email directly (if you know their email)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  For privacy, email addresses aren't searchable. Search by username above or enter email here.
                </p>
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
          <Button variant="outline" onClick={() => {
            onOpenChange(false);
            setSearchTerm("");
            setEmail("");
            setSelectedUser(null);
          }}>
            Cancel
          </Button>
          <Button onClick={handleSendInvite} disabled={sending || (!email && !selectedUser) || searching}>
            {sending ? 'Sending...' : 'Send Invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
