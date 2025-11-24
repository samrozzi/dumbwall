import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { SocialLinkIcon } from "@/components/profile/SocialLinkIcon";
import { InterestTags } from "@/components/profile/InterestTags";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProfileData {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  cover_url?: string;
  bio?: string;
  tagline?: string;
  location?: string;
  pronouns?: string;
  status?: string;
  last_seen_at?: string;
  bio_public: boolean;
  tagline_public: boolean;
  location_public: boolean;
  pronouns_public: boolean;
  interests_public: boolean;
  social_links_public: boolean;
}

interface SocialLink {
  id: string;
  platform: string;
  handle_or_url: string;
  is_public: boolean;
}

interface Circle {
  id: string;
  name: string;
}

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [mutualCircles, setMutualCircles] = useState<Circle[]>([]);
  const isOwnProfile = user && profile && user.id === profile.id;

  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username]);

  const loadProfile = async () => {
    try {
      setLoading(true);

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Log profile view if not own profile
      if (user && user.id !== profileData.id) {
        await supabase.from("profile_views").insert({
          profile_user_id: profileData.id,
          viewer_user_id: user.id
        });
      }

      // Load interests if public or own profile
      if (profileData.interests_public || user?.id === profileData.id) {
        const { data: interestsData } = await supabase
          .from("profile_interests")
          .select("interest")
          .eq("user_id", profileData.id);

        if (interestsData) {
          setInterests(interestsData.map(i => i.interest));
        }
      }

      // Load social links if public or own profile
      if (profileData.social_links_public || user?.id === profileData.id) {
        const { data: linksData } = await supabase
          .from("social_links")
          .select("*")
          .eq("user_id", profileData.id)
          .eq("is_public", true)
          .order("display_order");

        if (linksData) {
          setSocialLinks(linksData);
        }
      }

      // Load mutual circles if logged in
      if (user) {
        const { data: myCircles } = await supabase
          .from("circle_members")
          .select("circle_id, circles(id, name)")
          .eq("user_id", user.id);

        const { data: theirCircles } = await supabase
          .from("circle_members")
          .select("circle_id")
          .eq("user_id", profileData.id);

        if (myCircles && theirCircles) {
          const theirCircleIds = theirCircles.map(c => c.circle_id);
          const mutual = myCircles
            .filter(mc => theirCircleIds.includes(mc.circle_id))
            .map(mc => ({ id: mc.circles.id, name: mc.circles.name }));
          setMutualCircles(mutual);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Profile not found");
      navigate("/circles");
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!user || !profile) return;

    try {
      // Check for existing private thread
      const { data: existingThreads } = await supabase
        .from("chat_threads")
        .select(`
          id,
          circle_id,
          thread_members!inner(user_id)
        `)
        .eq("linked_wall_item_id", null);

      const privateThread = existingThreads?.find(thread => {
        const memberIds = thread.thread_members.map((m: any) => m.user_id);
        return memberIds.length === 2 && 
               memberIds.includes(user.id) && 
               memberIds.includes(profile.id);
      });

      if (privateThread) {
        navigate(`/circle/${privateThread.circle_id}/chat?threadId=${privateThread.id}`);
        return;
      }

      // Create new thread in a mutual circle
      if (mutualCircles.length > 0) {
        const circleId = mutualCircles[0].id;
        const { data: thread, error: threadError } = await supabase
          .from("chat_threads")
          .insert({
            title: `${profile.display_name || profile.username}`,
            circle_id: circleId,
            created_by: user.id
          })
          .select()
          .single();

        if (threadError) throw threadError;

        await supabase.from("thread_members").insert([
          { thread_id: thread.id, user_id: user.id },
          { thread_id: thread.id, user_id: profile.id }
        ]);

        navigate(`/circle/${circleId}/chat?threadId=${thread.id}`);
      } else {
        toast.error("You need to be in a circle together to start a chat");
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Failed to start chat");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation hideBackButton={true} />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card>
          <ProfileHeader
            userId={profile.id}
            displayName={profile.display_name}
            username={profile.username}
            avatarUrl={profile.avatar_url}
            coverUrl={profile.cover_url}
            status={profile.status}
            lastSeenAt={profile.last_seen_at}
            isOwnProfile={isOwnProfile}
            onViewPublicProfile={() => navigate(`/u/${username}`)}
          />
        </Card>

        {/* Actions */}
        {!isOwnProfile && user && (
          <div className="flex gap-2 my-4">
            <Button onClick={handleStartChat} className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Message
            </Button>
          </div>
        )}

        {/* About */}
        {((profile.tagline_public && profile.tagline) || 
          (profile.bio_public && profile.bio) || 
          (profile.location_public && profile.location) || 
          (profile.pronouns_public && profile.pronouns) ||
          isOwnProfile) && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(profile.tagline_public || isOwnProfile) && profile.tagline && (
                <p className="text-lg font-medium">{profile.tagline}</p>
              )}
              {(profile.bio_public || isOwnProfile) && profile.bio && (
                <p className="text-muted-foreground">{profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm">
                {(profile.location_public || isOwnProfile) && profile.location && (
                  <span className="text-muted-foreground">📍 {profile.location}</span>
                )}
                {(profile.pronouns_public || isOwnProfile) && profile.pronouns && (
                  <span className="text-muted-foreground">{profile.pronouns}</span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interests */}
        {interests.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <InterestTags interests={interests} />
            </CardContent>
          </Card>
        )}

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Connect</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {socialLinks.map(link => (
                  <SocialLinkIcon
                    key={link.id}
                    platform={link.platform}
                    handleOrUrl={link.handle_or_url}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mutual Circles */}
        {mutualCircles.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {isOwnProfile ? "Your Circles" : "Mutual Circles"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {mutualCircles.map(circle => (
                  <Badge key={circle.id} variant="secondary">
                    {circle.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
