import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { NotificationCenter } from "@/components/NotificationCenter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Upload, LogOut, Trash2, Users, Plus, AlertTriangle, Settings2, Eye, ArrowLeft } from "lucide-react";
import { CircleSettingsDialog } from "@/components/CircleSettingsDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatusSelector } from "@/components/profile/StatusSelector";
import { PrivacyToggle } from "@/components/profile/PrivacyToggle";
import { InterestTags } from "@/components/profile/InterestTags";
import { SocialLinkIcon } from "@/components/profile/SocialLinkIcon";
import { CircleProfileCard } from "@/components/profile/CircleProfileCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface UserProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  tagline: string | null;
  location: string | null;
  pronouns: string | null;
  status: string;
  status_mode: string;
  show_presence: boolean;
  last_username_change_at: string | null;
  bio_public: boolean;
  tagline_public: boolean;
  location_public: boolean;
  pronouns_public: boolean;
  interests_public: boolean;
  social_links_public: boolean;
}

interface UserCircle {
  id: string;
  name: string;
  created_by: string;
  role: "owner" | "member";
  memberCount: number;
  isActive: boolean;
}

const Settings = () => {
  const { circleId } = useParams();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [bio, setBio] = useState("");
  const [tagline, setTagline] = useState("");
  const [location, setLocation] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [status, setStatus] = useState("auto");
  const [showPresence, setShowPresence] = useState(true);
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [newLinkPlatform, setNewLinkPlatform] = useState("");
  const [newLinkHandle, setNewLinkHandle] = useState("");
  const [addLinkOpen, setAddLinkOpen] = useState(false);

  // Circles state
  const [circles, setCircles] = useState<UserCircle[]>([]);
  const [newCircleName, setNewCircleName] = useState("");
  const [createCircleOpen, setCreateCircleOpen] = useState(false);
  const [deleteCircleId, setDeleteCircleId] = useState<string | null>(null);
  const [renameCircleId, setRenameCircleId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [settingsCircleId, setSettingsCircleId] = useState<string | null>(null);
  const [settingsCircleName, setSettingsCircleName] = useState("");
  const [circleSettings, setCircleSettings] = useState<Record<string, 'anyone' | 'owner_only'>>({});

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadProfile();
    loadUserCircles();
    loadCircleSettings();
    setUserEmail(user.email || "");
  }, [user, navigate]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      toast.error("Error loading profile");
      return;
    }

    setProfile(data);
    setDisplayName(data.display_name || "");
    setUsername(data.username || "");
    setAvatarUrl(data.avatar_url || "");
    setBio(data.bio || "");
    setTagline(data.tagline || "");
    setLocation(data.location || "");
    setPronouns(data.pronouns || "");
    setStatus(data.status_mode || "auto");
    setShowPresence(data.show_presence ?? true);

    // Load interests
    const { data: interestsData } = await supabase
      .from("profile_interests")
      .select("interest")
      .eq("user_id", user.id);
    if (interestsData) {
      setInterests(interestsData.map(i => i.interest));
    }

    // Load social links
    const { data: linksData } = await supabase
      .from("social_links")
      .select("*")
      .eq("user_id", user.id)
      .order("display_order");
    if (linksData) {
      setSocialLinks(linksData);
    }
  };

  const loadUserCircles = async () => {
    if (!user) return;

    const { data: memberCircles, error } = await supabase
      .from("circle_members")
      .select(`
        role,
        circles (
          id,
          name,
          created_by
        )
      `)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Error loading circles");
      return;
    }

    // Get member counts for each circle
    const circlesWithCounts = await Promise.all(
      (memberCircles || []).map(async (mc: any) => {
        const { count } = await supabase
          .from("circle_members")
          .select("*", { count: "exact", head: true })
          .eq("circle_id", mc.circles.id);

        return {
          ...mc.circles,
          role: mc.role,
          memberCount: count || 0,
          isActive: mc.circles.id === circleId
        };
      })
    );

    setCircles(circlesWithCounts);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    try {
      // Delete any existing avatar files first
      const { data: existingFiles } = await supabase.storage
        .from("avatars")
        .list(user.id);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(file => `${user.id}/${file.name}`);
        await supabase.storage
          .from("avatars")
          .remove(filesToDelete);
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Add cache-busting parameter
      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlWithTimestamp })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(urlWithTimestamp);
      toast.success("Avatar updated!");
      loadProfile();
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error(error.message || "Failed to upload avatar");
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user) return;

    try {
      // Delete files from storage
      const { data: existingFiles } = await supabase.storage
        .from("avatars")
        .list(user.id);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(file => `${user.id}/${file.name}`);
        await supabase.storage
          .from("avatars")
          .remove(filesToDelete);
      }

      // Update database
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

      if (error) throw error;

      setAvatarUrl("");
      await loadProfile();
      toast.success("Avatar removed!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          bio, 
          tagline, 
          location, 
          pronouns, 
          status_mode: status,
          show_presence: showPresence,
          bio_public: profile?.bio_public ?? true,
          tagline_public: profile?.tagline_public ?? true,
          location_public: profile?.location_public ?? true,
          pronouns_public: profile?.pronouns_public ?? true
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated!");
      loadProfile();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleTogglePrivacy = async (field: string, value: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [field]: value })
        .eq("id", user.id);

      if (error) throw error;
      loadProfile();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddInterest = async () => {
    if (!user || !newInterest.trim()) return;

    try {
      await supabase
        .from("profile_interests")
        .insert({ user_id: user.id, interest: newInterest.trim() });

      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
      toast.success("Interest added!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRemoveInterest = async (interest: string) => {
    if (!user) return;

    try {
      await supabase
        .from("profile_interests")
        .delete()
        .eq("user_id", user.id)
        .eq("interest", interest);

      setInterests(interests.filter(i => i !== interest));
      toast.success("Interest removed!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddSocialLink = async () => {
    if (!user || !newLinkPlatform || !newLinkHandle.trim()) return;

    try {
      const { data } = await supabase
        .from("social_links")
        .insert([{
          user_id: user.id,
          platform: newLinkPlatform as any,
          handle_or_url: newLinkHandle.trim(),
          display_order: socialLinks.length
        }])
        .select()
        .single();

      if (data) {
        setSocialLinks([...socialLinks, data]);
        setNewLinkPlatform("");
        setNewLinkHandle("");
        setAddLinkOpen(false);
        toast.success("Social link added!");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRemoveSocialLink = async (linkId: string) => {
    if (!user) return;

    try {
      await supabase
        .from("social_links")
        .delete()
        .eq("id", linkId);

      setSocialLinks(socialLinks.filter(l => l.id !== linkId));
      toast.success("Social link removed!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };


  const loadCircleSettings = async () => {
    if (!user) return;

    try {
      const { data: memberCircles } = await supabase
        .from("circle_members")
        .select("circle_id")
        .eq("user_id", user.id);

      if (!memberCircles) return;

      const circleIds = memberCircles.map(m => m.circle_id);
      const { data: settings } = await supabase
        .from("circle_settings")
        .select("circle_id, invite_permission")
        .in("circle_id", circleIds);

      const settingsMap: Record<string, 'anyone' | 'owner_only'> = {};
      settings?.forEach(s => {
        settingsMap[s.circle_id] = s.invite_permission as 'anyone' | 'owner_only';
      });
      setCircleSettings(settingsMap);
    } catch (error: any) {
      console.error("Error loading circle settings:", error);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Display name updated!");
      loadProfile();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveUsername = async () => {
    if (!user || !profile) return;

    // Validate username format
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      toast.error("Username must be 3-20 characters (lowercase, numbers, underscores only)");
      return;
    }

    // Check 30-day restriction
    if (profile.last_username_change_at) {
      const lastChange = new Date(profile.last_username_change_at);
      const daysSinceChange = Math.floor((Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceChange < 30) {
        toast.error(`You can change your username in ${30 - daysSinceChange} days`);
        return;
      }
    }

    // Check uniqueness
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", user.id)
      .single();

    if (existing) {
      toast.error("Username already taken");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          username,
          last_username_change_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Username updated!");
      loadProfile();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCreateCircle = async () => {
    if (!user || !newCircleName.trim()) return;

    try {
      const { data: newCircle, error: circleError } = await supabase
        .from("circles")
        .insert({ name: newCircleName, created_by: user.id })
        .select()
        .single();

      if (circleError) throw circleError;

      const { error: memberError } = await supabase
        .from("circle_members")
        .insert({ 
          circle_id: newCircle.id, 
          user_id: user.id, 
          role: "owner" 
        });

      if (memberError) throw memberError;

      toast.success("Circle created!");
      setNewCircleName("");
      setCreateCircleOpen(false);
      loadUserCircles();
      navigate(`/circle/${newCircle.id}/wall`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLeaveCircle = async (circleId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("circle_members")
        .delete()
        .eq("circle_id", circleId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Left circle");
      loadUserCircles();
      
      // Navigate to another circle if leaving the active one
      const remainingCircles = circles.filter(c => c.id !== circleId);
      if (remainingCircles.length > 0) {
        navigate(`/circle/${remainingCircles[0].id}/wall`);
      } else {
        navigate("/circles");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteCircle = async (circleId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("circles")
        .delete()
        .eq("id", circleId)
        .eq("created_by", user.id);

      if (error) throw error;

      toast.success("Circle deleted");
      setDeleteCircleId(null);
      loadUserCircles();
      
      const remainingCircles = circles.filter(c => c.id !== circleId);
      if (remainingCircles.length > 0) {
        navigate(`/circle/${remainingCircles[0].id}/wall`);
      } else {
        navigate("/circles");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRenameCircle = async () => {
    if (!renameCircleId || !renameValue.trim()) return;

    try {
      const { error } = await supabase
        .from("circles")
        .update({ name: renameValue })
        .eq("id", renameCircleId);

      if (error) throw error;

      toast.success("Circle renamed!");
      setRenameCircleId(null);
      setRenameValue("");
      loadUserCircles();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!userEmail) return;

    try {
      await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      toast.success("Password reset email sent!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const getDaysUntilUsernameChange = () => {
    if (!profile?.last_username_change_at) return null;
    const lastChange = new Date(profile.last_username_change_at);
    const daysSinceChange = Math.floor((Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = 30 - daysSinceChange;
    return daysRemaining > 0 ? daysRemaining : 0;
  };

  const daysRemaining = getDaysUntilUsernameChange();

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Navigation circleId={circleId} />

      <div className={`${isMobile ? 'pb-24' : 'pl-24 pr-8'} pt-8 ${isMobile ? 'max-w-full px-4' : 'max-w-5xl'} mx-auto relative`}>
        {!isMobile && (
          <div className="absolute top-8 right-8 z-50">
            <NotificationCenter />
          </div>
        )}
        
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Settings2 className="w-8 h-8" />
          Settings
        </h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="circles">Circles</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Back to People Button */}
            {circleId && (
              <div className="flex items-center gap-3 mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/circle/${circleId}/people`)}
                  className="rounded-full"
                  title="Back to My Friends"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-2xl font-bold">My Profile</h2>
              </div>
            )}
            
            {/* Profile Preview */}
            <Card>
              {profile && (
                <ProfileHeader
                  userId={user?.id || ""}
                  displayName={profile.display_name || undefined}
                  username={profile.username || ""}
                  avatarUrl={profile.avatar_url || undefined}
                  coverUrl={profile.cover_url || undefined}
                  status={profile.status}
                  isOwnProfile={true}
                  onViewPublicProfile={() => navigate(`/u/${profile.username}`)}
                  onEditProfile={() => {
                    document.getElementById("about-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                />
              )}
            </Card>

            {/* Status & Presence */}
            <Card id="about-section">
              <CardHeader>
                <CardTitle>Status & Presence</CardTitle>
                <CardDescription>Manage your availability and online status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status Mode</Label>
                  <StatusSelector value={status} onChange={setStatus} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show my online status</Label>
                    <p className="text-sm text-muted-foreground">
                      When off, you'll always appear offline to others
                    </p>
                  </div>
                  <Switch checked={showPresence} onCheckedChange={setShowPresence} />
                </div>
                <Button onClick={handleSaveProfile}>Save Status</Button>
              </CardContent>
            </Card>

            {/* Circle Profile - Only show when inside a circle */}
            {circleId && (
              <CircleProfileCard
                circleId={circleId}
                circleName={circles.find(c => c.id === circleId)?.name || "Circle"}
                userId={user?.id || ""}
              />
            )}

            {/* About Me */}
            <Card>
              <CardHeader>
                <CardTitle>About Me</CardTitle>
                <CardDescription>Share more about yourself</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Tagline</Label>
                    <PrivacyToggle
                      isPublic={profile?.tagline_public ?? true}
                      onChange={(val) => handleTogglePrivacy("tagline_public", val)}
                    />
                  </div>
                  <Input
                    placeholder="A short one-liner about you"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Bio</Label>
                    <PrivacyToggle
                      isPublic={profile?.bio_public ?? true}
                      onChange={(val) => handleTogglePrivacy("bio_public", val)}
                    />
                  </div>
                  <Textarea
                    placeholder="Tell people about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={240}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Location</Label>
                    <PrivacyToggle
                      isPublic={profile?.location_public ?? true}
                      onChange={(val) => handleTogglePrivacy("location_public", val)}
                    />
                  </div>
                  <Input
                    placeholder="City, Country"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Pronouns</Label>
                    <PrivacyToggle
                      isPublic={profile?.pronouns_public ?? true}
                      onChange={(val) => handleTogglePrivacy("pronouns_public", val)}
                    />
                  </div>
                  <Input
                    placeholder="she/her, he/him, they/them, etc."
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                  />
                </div>

                <Button onClick={handleSaveProfile}>Save About Me</Button>
              </CardContent>
            </Card>

            {/* Interests */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Interests</CardTitle>
                    <CardDescription>Add tags that represent your interests</CardDescription>
                  </div>
                  <PrivacyToggle
                    isPublic={profile?.interests_public ?? true}
                    onChange={(val) => handleTogglePrivacy("interests_public", val)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <InterestTags interests={interests} isEditable onRemove={handleRemoveInterest} />
                <div className="flex gap-2">
                  <Input
                    placeholder="Add an interest..."
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddInterest()}
                  />
                  <Button onClick={handleAddInterest}>Add</Button>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Social Links</CardTitle>
                    <CardDescription>Connect your other social profiles</CardDescription>
                  </div>
                  <PrivacyToggle
                    isPublic={profile?.social_links_public ?? true}
                    onChange={(val) => handleTogglePrivacy("social_links_public", val)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map(link => (
                    <div key={link.id} className="relative group">
                      <SocialLinkIcon platform={link.platform} handleOrUrl={link.handle_or_url} isEditable />
                      <button
                        onClick={() => handleRemoveSocialLink(link.id)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button onClick={() => setAddLinkOpen(true)} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Social Link
                </Button>
              </CardContent>
            </Card>

            {/* Account Basics */}
            <Card>
              <CardHeader>
                <CardTitle>Account Basics</CardTitle>
                <CardDescription>Your display name and username</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Display name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                    <Button onClick={handleSaveDisplayName}>Save</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Username</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                      <Input
                        className="pl-7"
                        placeholder="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        disabled={daysRemaining !== null && daysRemaining > 0}
                      />
                    </div>
                    <Button 
                      onClick={handleSaveUsername}
                      disabled={daysRemaining !== null && daysRemaining > 0}
                    >
                      Save
                    </Button>
                  </div>
                  {daysRemaining !== null && daysRemaining > 0 && (
                    <p className="text-sm text-muted-foreground">
                      ℹ️ You can change your username in {daysRemaining} days
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Circles Tab */}
          <TabsContent value="circles" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Circles</CardTitle>
                  <CardDescription>Manage and switch between your circles</CardDescription>
                </div>
                <Button onClick={() => setCreateCircleOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Circle
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {circles.map((circle) => (
                  <div
                    key={circle.id}
                    className={`p-4 border rounded-lg transition-all ${
                      circle.isActive ? "bg-primary/10 border-primary" : "bg-card"
                    }`}
                  >
                    <div className="flex flex-wrap gap-2 items-center justify-between sm:flex-nowrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-lg">{circle.name}</h3>
                          {circle.isActive && (
                            <Badge variant="default">Active</Badge>
                          )}
                          <Badge variant="outline">
                            {circle.role === "owner" ? "Owner" : "Member"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          <Users className="w-3 h-3 inline mr-1" />
                          {circle.memberCount} {circle.memberCount === 1 ? "member" : "members"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:justify-end w-full sm:w-auto">
                        {!circle.isActive && (
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/circle/${circle.id}/wall`)}
                          >
                            Switch
                          </Button>
                        )}
                        {circle.role === "owner" && (
                          <>
                            <Button
                              variant="ghost"
                              size={isMobile ? "sm" : "icon"}
                              onClick={() => {
                                setSettingsCircleId(circle.id);
                                setSettingsCircleName(circle.name);
                              }}
                              title="Circle Settings"
                            >
                              <Settings2 className="w-4 h-4" />
                              {isMobile && <span className="ml-2 sm:hidden">Settings</span>}
                            </Button>
                            <Button
                              variant="outline"
                              size={isMobile ? "sm" : "default"}
                              onClick={() => {
                                setRenameCircleId(circle.id);
                                setRenameValue(circle.name);
                              }}
                            >
                              {isMobile ? "Rename" : "Rename"}
                            </Button>
                            <Button
                              variant="destructive"
                              size={isMobile ? "icon" : "default"}
                              onClick={() => setDeleteCircleId(circle.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                              {!isMobile && <span className="ml-2">Delete</span>}
                            </Button>
                          </>
                        )}
                        {circle.role === "member" && (
                          <Button
                            variant="outline"
                            onClick={() => handleLeaveCircle(circle.id)}
                          >
                            Leave
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {circles.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    You're not a member of any circles yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email</CardTitle>
                <CardDescription>Your account email address</CardDescription>
              </CardHeader>
              <CardContent>
                <Input value={userEmail} disabled />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Reset your password via email</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handlePasswordReset}>
                  Send Password Reset Email
                </Button>
              </CardContent>
            </Card>

            <Separator />

            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>Sign out of your account</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={handleLogout} className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Circle Dialog */}
      <Dialog open={createCircleOpen} onOpenChange={setCreateCircleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Circle</DialogTitle>
            <DialogDescription>
              Create a new circle and invite members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Circle Name</Label>
              <Input
                placeholder="My awesome circle"
                value={newCircleName}
                onChange={(e) => setNewCircleName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCreateCircle()}
              />
            </div>
            <Button onClick={handleCreateCircle} className="w-full">
              Create Circle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Circle Dialog */}
      <Dialog open={renameCircleId !== null} onOpenChange={() => setRenameCircleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Circle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Name</Label>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleRenameCircle()}
              />
            </div>
            <Button onClick={handleRenameCircle} className="w-full">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Circle Dialog */}
      <Dialog open={deleteCircleId !== null} onOpenChange={() => setDeleteCircleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Circle
            </DialogTitle>
            <DialogDescription>
              This will permanently delete the circle and all its content. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCircleId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteCircleId && handleDeleteCircle(deleteCircleId)}
            >
              Delete Circle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Circle Settings Dialog */}
      {settingsCircleId && (
        <CircleSettingsDialog
          open={settingsCircleId !== null}
          onOpenChange={(open) => !open && setSettingsCircleId(null)}
          circleId={settingsCircleId}
          circleName={settingsCircleName}
          currentPermission={circleSettings[settingsCircleId] || 'owner_only'}
          onSuccess={() => {
            loadCircleSettings();
            loadUserCircles();
          }}
        />
      )}

      {/* Add Social Link Dialog */}
      <Dialog open={addLinkOpen} onOpenChange={setAddLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Social Link</DialogTitle>
            <DialogDescription>Connect your social media profiles</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={newLinkPlatform} onValueChange={setNewLinkPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="x">X (Twitter)</SelectItem>
                  <SelectItem value="discord">Discord</SelectItem>
                  <SelectItem value="steam">Steam</SelectItem>
                  <SelectItem value="spotify">Spotify</SelectItem>
                  <SelectItem value="twitch">Twitch</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Username or URL</Label>
              <Input
                placeholder="@username or https://..."
                value={newLinkHandle}
                onChange={(e) => setNewLinkHandle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddLinkOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSocialLink}>Add Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
