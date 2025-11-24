import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PresenceIndicator } from "@/components/profile/PresenceIndicator";
import { MessageCircle, User, Search, UserPlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Member {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  show_presence: boolean | null;
  status_mode: string | null;
  last_active_at: string | null;
  nickname: string | null;
  avatar_override_url: string | null;
  role: string;
}

interface MemberDropdownProps {
  members: Member[];
  circleId: string;
  onAddMember?: () => void;
  onClose: () => void;
}

export const MemberDropdown = ({ members, circleId, onAddMember, onClose }: MemberDropdownProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const getPresenceStatus = (member: Member) => {
    if (!member.show_presence || member.status_mode === "manual_offline") return "offline";
    if (member.status_mode === "manual_online") return "online";
    if (member.status_mode === "manual_away") return "away";
    if (member.status_mode === "manual_dnd") return "dnd";
    
    if (!member.last_active_at) return "offline";
    const minutesAgo = (Date.now() - new Date(member.last_active_at).getTime()) / 1000 / 60;
    if (minutesAgo <= 5) return "online";
    if (minutesAgo <= 20) return "away";
    return "offline";
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "online": return "Online";
      case "away": return "Away";
      case "dnd": return "Do Not Disturb";
      default: return "Offline";
    }
  };

  const filteredMembers = members.filter((member) => {
    const name = member.nickname || member.display_name || member.username;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const activeMembers = filteredMembers.filter((m) => {
    const status = getPresenceStatus(m);
    return status === "online" || status === "away" || status === "dnd";
  });

  const offlineMembers = filteredMembers.filter((m) => getPresenceStatus(m) === "offline");

  const handleViewProfile = (username: string) => {
    navigate(`/u/${username}`);
    onClose();
  };

  const handleMessage = (username: string) => {
    navigate(`/circle/${circleId}/chat`);
    onClose();
  };

  const renderMember = (member: Member) => {
    const avatar = member.avatar_override_url || member.avatar_url;
    const name = member.nickname || member.display_name || member.username;
    const status = getPresenceStatus(member);

    return (
      <div key={member.user_id} className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors">
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage src={avatar || undefined} />
            <AvatarFallback className="text-sm">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {member.show_presence && (
            <PresenceIndicator
              statusMode={member.status_mode || 'auto'}
              showPresence={member.show_presence ?? true}
              lastActiveAt={member.last_active_at || undefined}
              className="absolute bottom-0 right-0 w-3 h-3 border-2 border-background"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{name}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>@{member.username}</span>
            {member.show_presence && (
              <>
                <span>•</span>
                <span>{getStatusLabel(status)}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleViewProfile(member.username)}
            title="View Profile"
          >
            <User className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleMessage(member.username)}
            title="Send Message"
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col max-h-[500px]">
      {/* Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Circle Members ({members.length})</h3>
        </div>

        {/* Search */}
        {members.length > 5 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search members..."
              className="pl-9 h-9"
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Members List */}
      <ScrollArea className="flex-1">
        {activeMembers.length > 0 && (
          <div>
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Active ({activeMembers.length})
            </div>
            {activeMembers.map(renderMember)}
          </div>
        )}

        {offlineMembers.length > 0 && (
          <div>
            {activeMembers.length > 0 && <Separator className="my-2" />}
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Offline ({offlineMembers.length})
            </div>
            {offlineMembers.map(renderMember)}
          </div>
        )}

        {filteredMembers.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No members found
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {onAddMember && (
        <>
          <Separator />
          <div className="p-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onAddMember();
                onClose();
              }}
              className="w-full gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
