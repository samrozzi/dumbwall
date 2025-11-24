import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Edit, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { compressImage } from "@/lib/imageCompression";

interface ProfileHeaderProps {
  userId: string;
  displayName?: string;
  username: string;
  avatarUrl?: string;
  coverUrl?: string;
  status?: string;
  lastSeenAt?: string;
  isOwnProfile?: boolean;
  onViewPublicProfile?: () => void;
  onEditProfile?: () => void;
}

const statusColors = {
  available: "bg-green-500",
  busy: "bg-red-500",
  away: "bg-yellow-500",
  offline: "bg-gray-400"
};

const statusLabels = {
  available: "Available",
  busy: "Busy",
  away: "Away",
  offline: "Offline"
};

export const ProfileHeader = ({
  userId,
  displayName,
  username,
  avatarUrl,
  coverUrl,
  status = "offline",
  lastSeenAt,
  isOwnProfile = false,
  onViewPublicProfile,
  onEditProfile
}: ProfileHeaderProps) => {
  const [uploading, setUploading] = useState(false);

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      const { blob } = await compressImage(file, 1600, 0.85);
      const fileName = `${userId}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(fileName, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("covers")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ cover_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      toast.success("Cover photo updated");
      window.location.reload();
    } catch (error) {
      console.error("Error uploading cover:", error);
      toast.error("Failed to upload cover photo");
    } finally {
      setUploading(false);
    }
  };

  const getInitials = () => {
    if (displayName) {
      return displayName
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-lg overflow-hidden">
        {coverUrl && (
          <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
        )}
        {isOwnProfile && (
          <label className="absolute top-4 right-4 cursor-pointer">
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              disabled={uploading}
              asChild
            >
              <span>
                <Camera className="h-4 w-4" />
                {uploading ? "Uploading..." : "Edit Cover"}
              </span>
            </Button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {/* Profile Info */}
      <div className="px-6 pb-6">
        {/* Avatar */}
        <div className="relative -mt-16 mb-4">
          <Avatar className="h-32 w-32 border-4 border-background">
            <AvatarImage src={avatarUrl} alt={displayName || username} />
            <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
          </Avatar>
          <div className={`absolute bottom-2 right-2 h-6 w-6 rounded-full border-4 border-background ${statusColors[status as keyof typeof statusColors]}`} />
        </div>

        {/* Name and Status */}
        <div className="space-y-2 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{displayName || username}</h2>
              <p className="text-muted-foreground">@{username}</p>
            </div>
            {status !== "offline" && (
              <Badge variant="secondary" className="gap-2">
                <div className={`h-2 w-2 rounded-full ${statusColors[status as keyof typeof statusColors]}`} />
                {statusLabels[status as keyof typeof statusLabels]}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        {isOwnProfile && (
          <div className="flex gap-2">
            {onEditProfile && (
              <Button variant="outline" onClick={onEditProfile} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            )}
            {onViewPublicProfile && (
              <Button variant="outline" onClick={onViewPublicProfile} className="gap-2">
                <Eye className="h-4 w-4" />
                View Public Profile
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
