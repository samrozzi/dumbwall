import { Instagram, Music, Twitter, MessageCircle, Gamepad2, Radio, Video, Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SocialLinkIconProps {
  platform: string;
  handleOrUrl: string;
  isEditable?: boolean;
  onEdit?: () => void;
}

const platformIcons = {
  instagram: Instagram,
  tiktok: Video,
  x: Twitter,
  discord: MessageCircle,
  steam: Gamepad2,
  spotify: Music,
  twitch: Radio,
  youtube: Video,
  website: Globe,
  other: ExternalLink
};

const platformColors = {
  instagram: "hover:bg-pink-500/10 hover:text-pink-500",
  tiktok: "hover:bg-black/10 hover:text-black",
  x: "hover:bg-blue-500/10 hover:text-blue-500",
  discord: "hover:bg-indigo-500/10 hover:text-indigo-500",
  steam: "hover:bg-blue-600/10 hover:text-blue-600",
  spotify: "hover:bg-green-500/10 hover:text-green-500",
  twitch: "hover:bg-purple-500/10 hover:text-purple-500",
  youtube: "hover:bg-red-500/10 hover:text-red-500",
  website: "hover:bg-gray-500/10 hover:text-gray-500",
  other: "hover:bg-gray-500/10 hover:text-gray-500"
};

export const SocialLinkIcon = ({ platform, handleOrUrl, isEditable, onEdit }: SocialLinkIconProps) => {
  const Icon = platformIcons[platform as keyof typeof platformIcons] || ExternalLink;
  const colorClass = platformColors[platform as keyof typeof platformColors] || platformColors.other;

  const formatUrl = () => {
    if (handleOrUrl.startsWith("http")) return handleOrUrl;
    
    const urlMap: Record<string, string> = {
      instagram: `https://instagram.com/${handleOrUrl}`,
      tiktok: `https://tiktok.com/@${handleOrUrl}`,
      x: `https://x.com/${handleOrUrl}`,
      discord: handleOrUrl,
      steam: `https://steamcommunity.com/id/${handleOrUrl}`,
      spotify: `https://open.spotify.com/user/${handleOrUrl}`,
      twitch: `https://twitch.tv/${handleOrUrl}`,
      youtube: `https://youtube.com/@${handleOrUrl}`,
    };

    return urlMap[platform] || handleOrUrl;
  };

  const handleClick = () => {
    if (isEditable && onEdit) {
      onEdit();
    } else {
      window.open(formatUrl(), "_blank");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={`gap-2 ${colorClass} transition-colors`}
    >
      <Icon className="h-4 w-4" />
      {platform.charAt(0).toUpperCase() + platform.slice(1)}
    </Button>
  );
};
