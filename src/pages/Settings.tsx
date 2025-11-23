import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Upload, LogOut, Trash2, Users, Plus, AlertTriangle, Settings2 } from "lucide-react";
import { CircleSettingsDialog } from "@/components/CircleSettingsDialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface UserProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  last_username_change_at: string | null;
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
    <div className="min-h-screen bg-background">
      <Navigation circleId={circleId} />

      <div className={`${isMobile ? 'pb-24' : 'pl-24 pr-8'} pt-8 ${isMobile ? 'max-w-full px-4' : 'max-w-5xl'} mx-auto pb-16`}>
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
            <Card>
              <CardHeader>
                <CardTitle>Avatar</CardTitle>
                <CardDescription>Upload or manage your profile picture</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-4xl">
                    {username?.slice(0, 2).toUpperCase() || displayName?.slice(0, 2).toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <label className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  </Button>
                  {avatarUrl && (
                    <Button variant="destructive" onClick={handleDeleteAvatar}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Display Name</CardTitle>
                <CardDescription>Your public display name</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  <Button onClick={handleSaveDisplayName}>Save</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Username</CardTitle>
                <CardDescription>
                  Your unique identifier (3-20 characters, lowercase only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
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
                      <div className="flex gap-2">
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
                              size="icon"
                              onClick={() => {
                                setSettingsCircleId(circle.id);
                                setSettingsCircleName(circle.name);
                              }}
                              title="Circle Settings"
                            >
                              <Settings2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setRenameCircleId(circle.id);
                                setRenameValue(circle.name);
                              }}
                            >
                              Rename
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => setDeleteCircleId(circle.id)}
                            >
                              <Trash2 className="w-4 h-4" />
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
    </div>
  );
};

export default Settings;
