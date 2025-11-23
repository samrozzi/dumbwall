import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  inviteId: string;
  invitedEmail: string;
  circleName: string;
  inviterName: string;
  type: 'new_user' | 'existing_user' | 'approval_request';
  ownerId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { inviteId, invitedEmail, circleName, inviterName, type, ownerId }: InviteEmailRequest = await req.json();

    let emailResponse;
    const siteUrl = Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '') || "https://yourdomain.com";

    if (type === 'new_user') {
      // New user signup invitation
      emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
        from: "The Wall <onboarding@resend.dev>",
        to: [invitedEmail],
        subject: `You've been invited to join "${circleName}" on The Wall!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Welcome to The Wall!</h1>
            <p>Hi there!</p>
            <p><strong>${inviterName}</strong> has invited you to join the circle <strong>"${circleName}"</strong>.</p>
            <p>The Wall is a collaborative space where you can share notes, images, and chat with your circle members.</p>
            <div style="margin: 30px 0;">
              <a href="${siteUrl}/auth?invite=${inviteId}" 
                 style="background-color: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Sign Up & Join Circle
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">This invitation link will take you to the signup page. After creating your account, you'll automatically be added to the circle!</p>
          </div>
        `,
        }),
      });
    } else if (type === 'existing_user') {
      // Existing user notification
      emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
        from: "The Wall <onboarding@resend.dev>",
        to: [invitedEmail],
        subject: `You've been invited to join "${circleName}"`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">New Circle Invitation</h1>
            <p>Hi!</p>
            <p><strong>${inviterName}</strong> has invited you to join <strong>"${circleName}"</strong>.</p>
            <div style="margin: 30px 0;">
              <a href="${siteUrl}/circles" 
                 style="background-color: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Pending Invites
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Log in to The Wall to see your pending invitation and choose to accept or decline.</p>
          </div>
        `,
        }),
      });
    } else if (type === 'approval_request' && ownerId) {
      // Get owner's email from auth.users (server-side only)
      const { data: ownerData, error: ownerError } = await supabase.auth.admin.getUserById(ownerId);
      
      if (ownerError || !ownerData?.user?.email) {
        throw new Error("Failed to get owner email");
      }

      // Owner approval request
      emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
        from: "The Wall <onboarding@resend.dev>",
        to: [ownerData.user.email],
        subject: `Approval needed: Member wants to invite someone to "${circleName}"`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Invitation Approval Needed</h1>
            <p>Hi!</p>
            <p><strong>${inviterName}</strong> wants to invite <strong>${invitedEmail}</strong> to your circle <strong>"${circleName}"</strong>.</p>
            <p>Since your circle is set to "Owner Only" for invitations, this requires your approval.</p>
            <div style="margin: 30px 0;">
              <a href="${siteUrl}/settings" 
                 style="background-color: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Review Request
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Go to Settings > Circles to approve or deny this invitation request.</p>
          </div>
        `,
        }),
      });
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invite-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
