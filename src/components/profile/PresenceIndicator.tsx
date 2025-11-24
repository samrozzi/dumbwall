import { cn } from "@/lib/utils";

interface PresenceIndicatorProps {
  statusMode: string;
  showPresence: boolean;
  lastActiveAt?: string;
  className?: string;
}

const getPresenceStatus = (statusMode: string, showPresence: boolean, lastActiveAt?: string) => {
  if (!showPresence || statusMode === "manual_offline") {
    return { status: "offline", color: "bg-gray-400" };
  }

  if (statusMode === "manual_online") {
    return { status: "online", color: "bg-green-500" };
  }

  if (statusMode === "manual_away") {
    return { status: "away", color: "bg-yellow-500" };
  }

  if (statusMode === "manual_dnd") {
    return { status: "dnd", color: "bg-orange-500" };
  }

  // Auto mode - calculate from last_active_at
  if (!lastActiveAt) {
    return { status: "offline", color: "bg-gray-400" };
  }

  const lastActive = new Date(lastActiveAt).getTime();
  const now = Date.now();
  const minutesAgo = (now - lastActive) / 1000 / 60;

  if (minutesAgo <= 5) {
    return { status: "online", color: "bg-green-500" };
  } else if (minutesAgo <= 20) {
    return { status: "away", color: "bg-yellow-500" };
  } else {
    return { status: "offline", color: "bg-gray-400" };
  }
};

export const PresenceIndicator = ({
  statusMode,
  showPresence,
  lastActiveAt,
  className,
}: PresenceIndicatorProps) => {
  const { color } = getPresenceStatus(statusMode, showPresence, lastActiveAt);

  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        color,
        className
      )}
      aria-label={showPresence ? "Online status" : "Offline"}
    />
  );
};
