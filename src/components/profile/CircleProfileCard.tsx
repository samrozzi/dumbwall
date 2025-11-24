import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface CircleProfileCardProps {
  circleId: string;
  circleName: string;
  userId: string;
}

export const CircleProfileCard = ({ circleId, circleName, userId }: CircleProfileCardProps) => {
  const [nickname, setNickname] = useState("");
  const [taglineOverride, setTaglineOverride] = useState("");
  const [avatarOverride, setAvatarOverride] = useState("");
  const [showSocials, setShowSocials] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showInterests, setShowInterests] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCircleProfile();
  }, [circleId, userId]);

  const loadCircleProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("circle_profiles")
        .select("*")
        .eq("user_id", userId)
        .eq("circle_id", circleId)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setNickname(data.nickname || "");
        setTaglineOverride(data.tagline_override || "");
        setAvatarOverride(data.avatar_override_url || "");
        const visibility = data.visibility as any;
        setShowSocials(visibility?.show_socials ?? true);
        setShowLocation(visibility?.show_location ?? true);
        setShowInterests(visibility?.show_interests ?? true);
      }
    } catch (error) {
      console.error("Error loading circle profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("circle_profiles")
        .upsert({
          user_id: userId,
          circle_id: circleId,
          nickname: nickname || null,
          tagline_override: taglineOverride || null,
          avatar_override_url: avatarOverride || null,
          visibility: {
            show_socials: showSocials,
            show_location: showLocation,
            show_interests: showInterests,
          },
        });

      if (error) throw error;
      toast.success("Circle profile updated");
    } catch (error) {
      console.error("Error saving circle profile:", error);
      toast.error("Failed to save circle profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${circleId}-${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(data.path);

      setAvatarOverride(publicUrl);
      toast.success("Avatar uploaded");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    }
  };

  if (loading) return null;

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Circle Profile – {circleName}</h3>
        <p className="text-sm text-muted-foreground">
          Customize how you appear in this circle. Leave blank to use your global profile.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="circle-avatar">Circle Avatar</Label>
          <div className="flex items-center gap-4 mt-2">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarOverride} />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div>
              <Input
                id="circle-avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("circle-avatar")?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="nickname">Nickname</Label>
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Optional nickname for this circle"
          />
        </div>

        <div>
          <Label htmlFor="circle-tagline">Circle Tagline</Label>
          <Input
            id="circle-tagline"
            value={taglineOverride}
            onChange={(e) => setTaglineOverride(e.target.value)}
            placeholder="Optional tagline for this circle"
          />
        </div>

        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-medium">Visibility in this Circle</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="show-socials" className="cursor-pointer">
              Show my social links
            </Label>
            <Switch
              id="show-socials"
              checked={showSocials}
              onCheckedChange={setShowSocials}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-location" className="cursor-pointer">
              Show my location
            </Label>
            <Switch
              id="show-location"
              checked={showLocation}
              onCheckedChange={setShowLocation}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-interests" className="cursor-pointer">
              Show my interests
            </Label>
            <Switch
              id="show-interests"
              checked={showInterests}
              onCheckedChange={setShowInterests}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Circle Profile"}
        </Button>
      </div>
    </Card>
  );
};
