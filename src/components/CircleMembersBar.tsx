import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PresenceIndicator } from "@/components/profile/PresenceIndicator";
import { UserPlus, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MemberDropdown } from "@/components/MemberDropdown";
import { useIsMobile } from "@/hooks/use-mobile";

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

interface CircleMembersBarProps {
  circleId: string;
  onAddMember?: () => void;
  compact?: boolean;
}

export const CircleMembersBar = ({ circleId, onAddMember, compact = false }: CircleMembersBarProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadMembers();

    // Subscribe to member changes
    const channel = supabase
      .channel(`circle-members-${circleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'circle_members',
          filter: `circle_id=eq.${circleId}`
        },
        () => {
          loadMembers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          loadMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [circleId]);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('circle_members')
        .select(`
          user_id,
          role,
          profiles!circle_members_user_id_fkey (
            username,
            display_name,
            avatar_url,
            show_presence,
            status_mode,
            last_active_at
          )
        `)
        .eq('circle_id', circleId);

      if (error) {
        console.error('Error loading members:', error);
        throw error;
      }

      if (!data) {
        setMembers([]);
        return;
      }

      // Fetch circle profiles separately to avoid filtering issues
      const { data: circleProfiles } = await supabase
        .from('circle_profiles')
        .select('user_id, nickname, avatar_override_url')
        .eq('circle_id', circleId);

      const circleProfilesMap = new Map(
        (circleProfiles || []).map(cp => [cp.user_id, cp])
      );

      const formattedMembers: Member[] = data
        .filter((item: any) => item.profiles)
        .map((item: any) => {
          const circleProfile = circleProfilesMap.get(item.user_id);
          return {
            user_id: item.user_id,
            username: item.profiles.username,
            display_name: item.profiles.display_name,
            avatar_url: item.profiles.avatar_url,
            show_presence: item.profiles.show_presence,
            status_mode: item.profiles.status_mode,
            last_active_at: item.profiles.last_active_at,
            nickname: circleProfile?.nickname || null,
            avatar_override_url: circleProfile?.avatar_override_url || null,
            role: item.role,
          };
        });

      // Sort: online first, then by name
      formattedMembers.sort((a, b) => {
        const getPresenceValue = (member: Member) => {
          if (!member.show_presence || member.status_mode === "manual_offline") return 4;
          if (member.status_mode === "manual_online") return 0;
          if (member.status_mode === "manual_away") return 2;
          if (member.status_mode === "manual_dnd") return 3;
          
          if (!member.last_active_at) return 4;
          const minutesAgo = (Date.now() - new Date(member.last_active_at).getTime()) / 1000 / 60;
          if (minutesAgo <= 5) return 0;
          if (minutesAgo <= 20) return 1;
          return 4;
        };

        const aPresence = getPresenceValue(a);
        const bPresence = getPresenceValue(b);
        
        if (aPresence !== bPresence) return aPresence - bPresence;
        
        const aName = a.nickname || a.display_name || a.username;
        const bName = b.nickname || b.display_name || b.username;
        return aName.localeCompare(bName);
      });

      setMembers(formattedMembers);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxVisible = compact ? 3 : 5;
  const visibleMembers = members.slice(0, maxVisible);
  const remainingCount = members.length - maxVisible;

  if (loading) {
    return (
      <div className="flex items-center gap-1">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-8 h-8 rounded-full bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center -space-x-2">
        {visibleMembers.map((member) => {
          const avatar = member.avatar_override_url || member.avatar_url;
          const name = member.nickname || member.display_name || member.username;
          
          return (
            <div key={member.user_id} className="relative group">
              <Avatar className="w-8 h-8 border-2 border-background cursor-pointer hover:z-10 transition-transform hover:scale-110">
                <AvatarImage src={avatar || undefined} />
                <AvatarFallback className="text-xs">
                  {name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <PresenceIndicator
                statusMode={member.status_mode || 'auto'}
                showPresence={member.show_presence ?? true}
                lastActiveAt={member.last_active_at || undefined}
                className="absolute bottom-0 right-0 w-2.5 h-2.5 border border-background"
              />
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                {name}
              </div>
            </div>
          );
        })}
      </div>

      <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size={compact ? "sm" : "default"}
            className="gap-1 h-8 px-2"
          >
            {remainingCount > 0 && (
              <span className="text-xs font-medium">+{remainingCount}</span>
            )}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 z-[10000]" align="center">
          <MemberDropdown 
            members={members} 
            circleId={circleId}
            onAddMember={onAddMember}
            onClose={() => setDropdownOpen(false)}
          />
        </PopoverContent>
      </Popover>

      {onAddMember && (
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          onClick={onAddMember}
          className="gap-1 h-8 px-2"
        >
          <UserPlus className="w-4 h-4" />
          {!compact && !isMobile && <span className="text-xs">Add</span>}
        </Button>
      )}
    </div>
  );
};
