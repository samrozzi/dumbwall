import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

interface Member {
  user_id: string;
  profiles: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface MemberPickerProps {
  circleId: string;
  selectedMembers: string[];
  onMemberToggle: (userId: string) => void;
  excludeUserIds?: string[];
}

const MemberPicker = ({ circleId, selectedMembers, onMemberToggle, excludeUserIds = [] }: MemberPickerProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadMembers();
  }, [circleId]);

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from("circle_members")
      .select(`
        user_id,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq("circle_id", circleId);

    if (!error && data) {
      setMembers(data as any);
    }
  };

  const getDisplayName = (member: Member) => {
    return member.profiles?.display_name || member.profiles?.username || "Unknown";
  };

  const getInitials = (member: Member) => {
    const name = getDisplayName(member);
    return name.slice(0, 2).toUpperCase();
  };

  const filteredMembers = members.filter((member) => {
    if (excludeUserIds.includes(member.user_id)) return false;
    
    const displayName = getDisplayName(member).toLowerCase();
    const username = (member.profiles?.username || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return displayName.includes(query) || username.includes(query);
  });

  const selectedMembersList = members.filter((m) => selectedMembers.includes(m.user_id));

  return (
    <div className="space-y-4">
      {/* Selected Members */}
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMembersList.map((member) => (
            <Badge
              key={member.user_id}
              variant="secondary"
              className="pl-1 pr-2 py-1 flex items-center gap-1"
            >
              <Avatar className="w-5 h-5">
                <AvatarImage src={member.profiles?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">{getInitials(member)}</AvatarFallback>
              </Avatar>
              <span>{getDisplayName(member)}</span>
              <button
                onClick={() => onMemberToggle(member.user_id)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Input */}
      <Input
        placeholder="Search members..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Member List */}
      <ScrollArea className="h-[300px] border rounded-lg">
        <div className="p-2 space-y-1">
          {filteredMembers.map((member) => {
            const isSelected = selectedMembers.includes(member.user_id);
            return (
              <button
                key={member.user_id}
                onClick={() => onMemberToggle(member.user_id)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  isSelected
                    ? "bg-primary/20 hover:bg-primary/30"
                    : "hover:bg-accent"
                }`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={member.profiles?.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(member)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="font-medium">{getDisplayName(member)}</div>
                  {member.profiles?.username && (
                    <div className="text-xs text-muted-foreground">
                      @{member.profiles.username}
                    </div>
                  )}
                </div>
                {isSelected && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                  </div>
                )}
              </button>
            );
          })}
          {filteredMembers.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No members found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MemberPicker;
