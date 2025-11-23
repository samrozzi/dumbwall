import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { notify } from "@/components/ui/custom-notification";
import wallLogo from "@/assets/wall-logo.png";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{circleName: string} | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (inviteToken) {
      loadInviteInfo();
      setIsLogin(false);
    }
  }, [inviteToken]);

  const loadInviteInfo = async () => {
    if (!inviteToken) return;

    try {
      const { data } = await supabase
        .from("circle_invites")
        .select("invited_email, circles!circle_invites_circle_id_fkey(name)")
        .eq("id", inviteToken)
        .eq("status", "pending")
        .single();

      if (data) {
        setEmail(data.invited_email);
        setInviteInfo({ circleName: (data.circles as any).name });
      }
    } catch (error) {
      console.error("Error loading invite:", error);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        notify("Welcome back!", "success");
        navigate("/");
      } else {
        // Check if username is taken
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", username)
          .single();

        if (existingUser) {
          toast.error("Username already taken");
          setLoading(false);
          return;
        }

        const { data: authData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              username: username,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;

        // Create profile with last_username_change_at
        if (authData.user) {
          await supabase
            .from("profiles")
            .update({ last_username_change_at: new Date().toISOString() })
            .eq("id", authData.user.id);
        }

        // If signing up via invite, accept it
        if (inviteToken && authData.user) {
          const { data: invite } = await supabase
            .from("circle_invites")
            .select("circle_id")
            .eq("id", inviteToken)
            .single();

          if (invite) {
            await supabase
              .from("circle_members")
              .insert({
                circle_id: invite.circle_id,
                user_id: authData.user.id,
                role: "member",
              });

            await supabase
              .from("circle_invites")
              .update({ status: "accepted" })
              .eq("id", inviteToken);
          }
        }

        toast.success("Account created! Welcome to The Wall!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 bg-card border-border">
        <div className="flex flex-col items-center justify-center mb-8">
          <img src={wallLogo} alt="The Wall" className="w-24 h-24 mb-4 object-contain" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            The Wall
          </h1>
        </div>

        {inviteInfo && (
          <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-center">
              🎉 You're signing up to join <strong>{inviteInfo.circleName}</strong>!
            </p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  required
                  className="mt-1"
                  placeholder="username (3-20 chars, alphanumeric + _)"
                  pattern="[a-zA-Z0-9_]{3,20}"
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
          </Button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isLogin
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </Card>
    </div>
  );
};

export default Auth;
