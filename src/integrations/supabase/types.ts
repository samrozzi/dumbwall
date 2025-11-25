export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          body: string
          created_at: string
          gif_title: string | null
          gif_url: string | null
          id: string
          image_caption: string | null
          image_url: string | null
          message_type: string | null
          reply_to_id: string | null
          sender_id: string
          thread_id: string
          voice_duration: number | null
          voice_url: string | null
        }
        Insert: {
          body: string
          created_at?: string
          gif_title?: string | null
          gif_url?: string | null
          id?: string
          image_caption?: string | null
          image_url?: string | null
          message_type?: string | null
          reply_to_id?: string | null
          sender_id: string
          thread_id: string
          voice_duration?: number | null
          voice_url?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          gif_title?: string | null
          gif_url?: string | null
          id?: string
          image_caption?: string | null
          image_url?: string | null
          message_type?: string | null
          reply_to_id?: string | null
          sender_id?: string
          thread_id?: string
          voice_duration?: number | null
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          circle_id: string
          created_at: string
          created_by: string
          id: string
          linked_wall_item_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          created_by: string
          id?: string
          linked_wall_item_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          created_by?: string
          id?: string
          linked_wall_item_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_threads_linked_wall_item_id_fkey"
            columns: ["linked_wall_item_id"]
            isOneToOne: false
            referencedRelation: "wall_items"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_invites: {
        Row: {
          circle_id: string
          created_at: string
          id: string
          invite_type: Database["public"]["Enums"]["invite_type"]
          invited_by: string
          invited_email: string
          status: Database["public"]["Enums"]["invite_status"]
          updated_at: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          id?: string
          invite_type?: Database["public"]["Enums"]["invite_type"]
          invited_by: string
          invited_email: string
          status?: Database["public"]["Enums"]["invite_status"]
          updated_at?: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          id?: string
          invite_type?: Database["public"]["Enums"]["invite_type"]
          invited_by?: string
          invited_email?: string
          status?: Database["public"]["Enums"]["invite_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_invites_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_members: {
        Row: {
          circle_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["member_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["member_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["member_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_profiles: {
        Row: {
          avatar_override_url: string | null
          circle_id: string
          created_at: string | null
          id: string
          nickname: string | null
          tagline_override: string | null
          updated_at: string | null
          user_id: string
          visibility: Json | null
        }
        Insert: {
          avatar_override_url?: string | null
          circle_id: string
          created_at?: string | null
          id?: string
          nickname?: string | null
          tagline_override?: string | null
          updated_at?: string | null
          user_id: string
          visibility?: Json | null
        }
        Update: {
          avatar_override_url?: string | null
          circle_id?: string
          created_at?: string | null
          id?: string
          nickname?: string | null
          tagline_override?: string | null
          updated_at?: string | null
          user_id?: string
          visibility?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "circle_profiles_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_settings: {
        Row: {
          circle_id: string
          created_at: string
          invite_permission: Database["public"]["Enums"]["invite_permission"]
          updated_at: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          invite_permission?: Database["public"]["Enums"]["invite_permission"]
          updated_at?: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          invite_permission?: Database["public"]["Enums"]["invite_permission"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_settings_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: true
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circles: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_events: {
        Row: {
          created_at: string
          event_type: string
          game_id: string
          id: number
          payload: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          game_id: string
          id?: number
          payload: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          game_id?: string
          id?: number
          payload?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_invites: {
        Row: {
          created_at: string
          game_id: string
          id: string
          invited_by: string
          invited_user_id: string
          status: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          invited_by: string
          invited_user_id: string
          status?: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          invited_by?: string
          invited_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_invites_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_participants: {
        Row: {
          game_id: string
          id: number
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          game_id: string
          id?: number
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          game_id?: string
          id?: number
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_participants_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          circle_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          metadata: Json
          status: Database["public"]["Enums"]["game_status"]
          title: string | null
          type: Database["public"]["Enums"]["game_type"]
          updated_at: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          metadata?: Json
          status?: Database["public"]["Enums"]["game_status"]
          title?: string | null
          type: Database["public"]["Enums"]["game_type"]
          updated_at?: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          metadata?: Json
          status?: Database["public"]["Enums"]["game_status"]
          title?: string | null
          type?: Database["public"]["Enums"]["game_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_read_receipts: {
        Row: {
          created_at: string
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_interests: {
        Row: {
          created_at: string | null
          id: string
          interest: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interest?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          id: string
          profile_user_id: string
          viewed_at: string | null
          viewer_user_id: string | null
        }
        Insert: {
          id?: string
          profile_user_id: string
          viewed_at?: string | null
          viewer_user_id?: string | null
        }
        Update: {
          id?: string
          profile_user_id?: string
          viewed_at?: string | null
          viewer_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_profile_user_id_fkey"
            columns: ["profile_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_viewer_user_id_fkey"
            columns: ["viewer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          bio_public: boolean | null
          cover_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          interests_public: boolean | null
          last_active_at: string | null
          last_seen_at: string | null
          last_username_change_at: string | null
          location: string | null
          location_public: boolean | null
          pronouns: string | null
          pronouns_public: boolean | null
          show_presence: boolean | null
          social_links_public: boolean | null
          status: Database["public"]["Enums"]["user_status"] | null
          status_mode: string | null
          tagline: string | null
          tagline_public: boolean | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          bio_public?: boolean | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          interests_public?: boolean | null
          last_active_at?: string | null
          last_seen_at?: string | null
          last_username_change_at?: string | null
          location?: string | null
          location_public?: boolean | null
          pronouns?: string | null
          pronouns_public?: boolean | null
          show_presence?: boolean | null
          social_links_public?: boolean | null
          status?: Database["public"]["Enums"]["user_status"] | null
          status_mode?: string | null
          tagline?: string | null
          tagline_public?: boolean | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          bio_public?: boolean | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          interests_public?: boolean | null
          last_active_at?: string | null
          last_seen_at?: string | null
          last_username_change_at?: string | null
          location?: string | null
          location_public?: boolean | null
          pronouns?: string | null
          pronouns_public?: boolean | null
          show_presence?: boolean | null
          social_links_public?: boolean | null
          status?: Database["public"]["Enums"]["user_status"] | null
          status_mode?: string | null
          tagline?: string | null
          tagline_public?: boolean | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string | null
          display_order: number | null
          handle_or_url: string
          id: string
          is_public: boolean | null
          platform: Database["public"]["Enums"]["social_platform"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          handle_or_url: string
          id?: string
          is_public?: boolean | null
          platform: Database["public"]["Enums"]["social_platform"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          handle_or_url?: string
          id?: string
          is_public?: boolean | null
          platform?: Database["public"]["Enums"]["social_platform"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_members: {
        Row: {
          id: string
          joined_at: string
          thread_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          thread_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_members_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_read_status: {
        Row: {
          created_at: string | null
          id: string
          last_read_at: string | null
          last_read_message_id: string | null
          thread_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          last_read_message_id?: string | null
          thread_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          last_read_message_id?: string | null
          thread_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_read_status_last_read_message_id_fkey"
            columns: ["last_read_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_read_status_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      typing_indicators: {
        Row: {
          expires_at: string
          id: string
          started_at: string
          thread_id: string
          user_id: string
        }
        Insert: {
          expires_at: string
          id?: string
          started_at?: string
          thread_id: string
          user_id: string
        }
        Update: {
          expires_at?: string
          id?: string
          started_at?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      wall_item_comments: {
        Row: {
          comment_text: string
          created_at: string | null
          id: string
          user_id: string
          wall_item_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string | null
          id?: string
          user_id: string
          wall_item_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string | null
          id?: string
          user_id?: string
          wall_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wall_item_comments_wall_item_id_fkey"
            columns: ["wall_item_id"]
            isOneToOne: false
            referencedRelation: "wall_items"
            referencedColumns: ["id"]
          },
        ]
      }
      wall_item_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          user_id: string
          wall_item_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          user_id: string
          wall_item_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          user_id?: string
          wall_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wall_item_reactions_wall_item_id_fkey"
            columns: ["wall_item_id"]
            isOneToOne: false
            referencedRelation: "wall_items"
            referencedColumns: ["id"]
          },
        ]
      }
      wall_item_votes: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          vote_type: string
          wall_item_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          vote_type: string
          wall_item_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          vote_type?: string
          wall_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wall_item_votes_wall_item_id_fkey"
            columns: ["wall_item_id"]
            isOneToOne: false
            referencedRelation: "wall_items"
            referencedColumns: ["id"]
          },
        ]
      }
      wall_items: {
        Row: {
          circle_id: string
          content: Json
          created_at: string
          created_by: string
          id: string
          type: Database["public"]["Enums"]["wall_item_type"]
          updated_at: string
          x: number
          y: number
          z_index: number
        }
        Insert: {
          circle_id: string
          content?: Json
          created_at?: string
          created_by: string
          id?: string
          type: Database["public"]["Enums"]["wall_item_type"]
          updated_at?: string
          x?: number
          y?: number
          z_index?: number
        }
        Update: {
          circle_id?: string
          content?: Json
          created_at?: string
          created_by?: string
          id?: string
          type?: Database["public"]["Enums"]["wall_item_type"]
          updated_at?: string
          x?: number
          y?: number
          z_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "wall_items_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_invite_to_circle: {
        Args: { circle_uuid: string; user_uuid: string }
        Returns: boolean
      }
      create_notification: {
        Args: {
          notif_link?: string
          notif_message: string
          notif_metadata?: Json
          notif_title: string
          notif_type: string
          target_user_id: string
        }
        Returns: string
      }
      get_current_user_email: { Args: never; Returns: string }
      get_user_email_by_id: { Args: { user_uuid: string }; Returns: string }
      get_user_id_by_email: { Args: { user_email: string }; Returns: string }
      is_circle_member: {
        Args: { circle_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_thread_creator: {
        Args: { _thread_id: string; _user_id: string }
        Returns: boolean
      }
      search_users_by_username_or_email: {
        Args: { search_term: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
          username: string
        }[]
      }
    }
    Enums: {
      game_status: "waiting" | "in_progress" | "finished" | "cancelled"
      game_type:
        | "tic_tac_toe"
        | "poll"
        | "would_you_rather"
        | "question_of_the_day"
        | "story_chain"
        | "rate_this"
      invite_permission: "anyone" | "owner_only"
      invite_status: "pending" | "accepted" | "rejected" | "cancelled"
      invite_type: "direct" | "pending_approval"
      member_role: "owner" | "member"
      social_platform:
        | "instagram"
        | "tiktok"
        | "x"
        | "discord"
        | "steam"
        | "spotify"
        | "twitch"
        | "youtube"
        | "website"
        | "other"
      user_status: "available" | "busy" | "away" | "offline"
      wall_item_type:
        | "note"
        | "image"
        | "thread"
        | "game_tictactoe"
        | "announcement"
        | "poll"
        | "audio"
        | "doodle"
        | "music"
        | "challenge"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      game_status: ["waiting", "in_progress", "finished", "cancelled"],
      game_type: [
        "tic_tac_toe",
        "poll",
        "would_you_rather",
        "question_of_the_day",
        "story_chain",
        "rate_this",
      ],
      invite_permission: ["anyone", "owner_only"],
      invite_status: ["pending", "accepted", "rejected", "cancelled"],
      invite_type: ["direct", "pending_approval"],
      member_role: ["owner", "member"],
      social_platform: [
        "instagram",
        "tiktok",
        "x",
        "discord",
        "steam",
        "spotify",
        "twitch",
        "youtube",
        "website",
        "other",
      ],
      user_status: ["available", "busy", "away", "offline"],
      wall_item_type: [
        "note",
        "image",
        "thread",
        "game_tictactoe",
        "announcement",
        "poll",
        "audio",
        "doodle",
        "music",
        "challenge",
      ],
    },
  },
} as const
