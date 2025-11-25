import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { z } from "zod";
import { getRelativeTimeString } from "@/lib/dateUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navigation from "@/components/Navigation";
import { NotificationCenter } from "@/components/NotificationCenter";
import { toast } from "sonner";
import { MessageSquare, Plus, Send, UserPlus, ArrowLeft, Camera, Search as SearchIcon, Sparkles, Mic, Loader2, Trash2, Pin, X, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MemberPicker from "@/components/chat/MemberPicker";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThreadAvatarStack } from "@/components/chat/ThreadAvatarStack";
import { ChatMessage } from "@/components/chat/ChatMessage";
import ChatMessageWithImage from "@/components/chat/ChatMessageWithImage";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { ReplyPreview } from "@/components/chat/ReplyPreview";
import ChatPhotoUpload from "@/components/chat/ChatPhotoUpload";
import { compressImage } from "@/lib/imageCompression";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { SwipeableMessage } from "@/components/chat/SwipeableMessage";
import { GifPicker } from "@/components/chat/GifPicker";
import { VoiceRecorder } from "@/components/chat/VoiceRecorder";
import { AttachmentMenu } from "@/components/chat/AttachmentMenu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { MessageSearch } from "@/components/chat/MessageSearch";
import { DateSeparator } from "@/components/chat/DateSeparator";
import { UnreadJumpButton } from "@/components/chat/UnreadJumpButton";
import { MessageAnimations } from "@/components/chat/MessageAnimations";
import { isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ChatThread {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  linked_wall_item_id: string | null;
}

interface ThreadMember {
  id: string;
  avatar_url: string | null;
  username: string | null;
  display_name: string | null;
}

interface ThreadWithMembers extends ChatThread {
  members: ThreadMember[];
  unreadCount: number;
  lastMessageAt: string;
}

interface ChatMessageType {
  id: string;
  body: string;
  image_url?: string | null;
  image_caption?: string | null;
  gif_url?: string | null;
  gif_title?: string | null;
  voice_url?: string | null;
  voice_duration?: number | null;
  message_type?: string | null;
  created_at: string;
  sender_id: string;
  reply_to_id?: string | null;
  profiles?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  replied_message?: {
    body: string;
    sender_name: string;
  } | null;
}

const Chat = () => {
  const { circleId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const threadId = searchParams.get("threadId");
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [threads, setThreads] = useState<ThreadWithMembers[]>([]);
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [threadPhoto, setThreadPhoto] = useState<{ url: string; caption?: string } | null>(null);
  const [filter, setFilter] = useState<"all" | "wall" | "convos">("all");
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addMembersDialogOpen, setAddMembersDialogOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<ChatMessageType | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [sidebarSize, setSidebarSize] = useState<number>(() => {
    const saved = localStorage.getItem('chat-sidebar-width');
    return saved ? parseFloat(saved) : 40;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // New feature states
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [messageEffect, setMessageEffect] = useState<{ type: 'confetti' | 'hearts' | 'lasers' | 'fireworks' | 'balloons' } | null>(null);
  const [showUnreadButton, setShowUnreadButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [editingMessage, setEditingMessage] = useState<ChatMessageType | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [deleteThreadId, setDeleteThreadId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pinnedThreadIds, setPinnedThreadIds] = useState<Set<string>>(new Set());
  const [selectedFilter, setSelectedFilter] = useState<"all" | "wall" | "convos">("all");

  // Typing indicators
  const { typingUsers, handleTyping, stopTypingIndicator } = useTypingIndicator(threadId, user?.id);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlKey: true,
      callback: () => setSearchDialogOpen(true),
      description: 'Search messages'
    },
    {
      key: 'Escape',
      callback: () => {
        setReplyingTo(null);
        setEditingMessage(null);
      },
      description: 'Cancel reply/edit'
    }
  ], !searchDialogOpen);

  useEffect(() => {
    if (circleId && user) {
      loadThreads();
      loadPinnedThreads();
    }
  }, [circleId, user]);
  
  // Subscribe to thread updates for real-time re-ordering
  useEffect(() => {
    if (!circleId || !user) return;
    
    const channel = supabase
      .channel('threads-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_threads',
        filter: `circle_id=eq.${circleId}`
      }, () => {
        loadThreads();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [circleId, user]);

  useEffect(() => {
    const urlThreadId = searchParams.get("thread");
    if (urlThreadId && threads.length > 0) {
      navigate(`/circle/${circleId}/chat?threadId=${urlThreadId}`);
    } else if (threadId && user) {
      // Clear old messages immediately when switching threads
      setMessages([]);
      setCurrentThread(null);
      setIsLoadingMessages(true);
      
      loadThread();
      loadMessages();
      subscribeToMessages();
      markThreadAsRead();
    }
  }, [threadId, searchParams, threads, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Refresh threads when returning to thread list on mobile
  useEffect(() => {
    if (isMobile && !threadId && circleId && user) {
      loadThreads();
    }
  }, [threadId, isMobile, circleId, user]);

  const loadPinnedThreads = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('pinned_threads')
      .select('thread_id')
      .eq('user_id', user.id);
    
    if (!error && data) {
      setPinnedThreadIds(new Set(data.map(p => p.thread_id)));
    }
  };

  const loadThreads = async () => {
    if (!user) return;
    
    let threadsQuery = supabase
      .from("chat_threads")
      .select("*")
      .eq("circle_id", circleId!)
      .order("updated_at", { ascending: false });

    // Apply filter
    if (filter === 'wall') {
      threadsQuery = threadsQuery.not('linked_wall_item_id', 'is', null);
    } else if (filter === 'convos') {
      threadsQuery = threadsQuery.is('linked_wall_item_id', null);
    }

    const { data: threadsData, error } = await threadsQuery;

    if (error) {
      toast.error("Error loading threads");
      return;
    }

    if (!threadsData || threadsData.length === 0) {
      setThreads([]);
      return;
    }

    // Fetch thread members and their profiles
    const threadIds = threadsData.map(t => t.id);
    const { data: membersData } = await supabase
      .from("thread_members")
      .select("thread_id, user_id")
      .in("thread_id", threadIds);

    const userIds = [...new Set(membersData?.map(m => m.user_id) || [])];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, avatar_url, username, display_name")
      .in("id", userIds);

    // Fetch read status for current user
    const { data: readStatusData } = await supabase
      .from("thread_read_status")
      .select("thread_id, last_read_at")
      .eq("user_id", user.id)
      .in("thread_id", threadIds);

    // Calculate unread counts and get last message timestamp for each thread
    const threadsWithUnread = await Promise.all(
      threadsData.map(async (thread) => {
        const readStatus = readStatusData?.find(rs => rs.thread_id === thread.id);
        const lastReadAt = readStatus?.last_read_at || "1970-01-01";
        
        const { count } = await supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("thread_id", thread.id)
          .gt("created_at", lastReadAt)
          .neq("sender_id", user.id);
        
        // Get the last message timestamp for sorting
        const { data: lastMessage } = await supabase
          .from('chat_messages')
          .select('created_at')
          .eq('thread_id', thread.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        return {
          thread,
          unreadCount: count || 0,
          lastMessageAt: lastMessage?.created_at || thread.created_at
        };
      })
    );

    // Combine all data
    const threadsWithMembers = threadsWithUnread.map(({ thread, unreadCount, lastMessageAt }) => {
      const threadMembers = membersData?.filter(m => m.thread_id === thread.id) || [];
      const members = threadMembers
        .map(tm => profilesData?.find(p => p.id === tm.user_id))
        .filter(Boolean) as ThreadMember[];
      
      return {
        ...thread,
        members,
        unreadCount,
        lastMessageAt
      };
    });

    // Sort threads: unread first, then by last message activity
    const sortedThreads = threadsWithMembers.sort((a, b) => {
      // First, sort by unread status (unread threads first)
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      
      // Then sort by most recent message activity
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    setThreads(sortedThreads);
  };

  const loadThread = async () => {
    const { data, error } = await supabase
      .from("chat_threads")
      .select("*")
      .eq("id", threadId!)
      .single();

    if (error) {
      toast.error("Error loading thread");
      return;
    }
    
    setCurrentThread(data);

    // If this is a photo thread, load the photo
    if (data?.linked_wall_item_id) {
      const { data: wallItem } = await supabase
        .from('wall_items')
        .select('content, created_by, type')
        .eq('id', data.linked_wall_item_id)
        .single();
      
      // Only set threadPhoto if this is actually an image wall item
      if (wallItem && wallItem.type === 'image') {
        const content = wallItem.content as { url: string; caption?: string };
        setThreadPhoto(content);
        
        // If caption exists but no messages yet, add it as first message
        if (content.caption) {
          const { data: messages, count } = await supabase
            .from('chat_messages')
            .select('id', { count: 'exact' })
            .eq('thread_id', data.id)
            .limit(1);
          
          if (count === 0) {
            await supabase
              .from('chat_messages')
              .insert({
                thread_id: data.id,
                sender_id: wallItem.created_by,
                body: content.caption,
              });
          }
        }
      } else {
        setThreadPhoto(null);
      }
    } else {
      setThreadPhoto(null);
    }
  };

  const markThreadAsRead = async () => {
    if (!user || !threadId) return;
    
    try {
      await supabase
        .from('thread_read_status')
        .upsert({
          thread_id: threadId,
          user_id: user.id,
          last_read_at: new Date().toISOString()
        }, {
          onConflict: 'thread_id,user_id'
        });
    } catch (error) {
      console.error("Error marking thread as read:", error);
    }
  };

  const loadMessages = async () => {
    if (!user || !threadId) return;
    
    setIsLoadingMessages(true);
    
    try {
      // Get messages excluding those deleted by current user
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", threadId!)
        .order("created_at", { ascending: true });

    if (error) {
      toast.error("Error loading messages");
      return;
    }

    // Get deleted messages for current user
    const { data: deletedData } = await supabase
      .from("deleted_messages")
      .select("message_id")
      .eq("user_id", user.id);
    
    const deletedMessageIds = new Set(deletedData?.map(d => d.message_id) || []);

    // Filter out deleted messages
    const filteredData = data?.filter(m => !deletedMessageIds.has(m.id)) || [];

    // Fetch profiles for all senders
    const senderIds = [...new Set(filteredData.map((m) => m.sender_id) || [])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url")
      .in("id", senderIds);

    // Fetch replied messages
    const replyToIds = filteredData.filter(m => m.reply_to_id).map(m => m.reply_to_id).filter(Boolean) || [];
    let repliedMessages: any[] = [];
    if (replyToIds.length > 0) {
      const { data: repliedData } = await supabase
        .from("chat_messages")
        .select("id, body, sender_id")
        .in("id", replyToIds);
      repliedMessages = repliedData || [];
    }

    const messagesWithProfiles = filteredData.map((msg) => {
      const profile = profiles?.find((p) => p.id === msg.sender_id);
      let replied_message = null;
      
      if (msg.reply_to_id) {
        const repliedMsg = repliedMessages.find(rm => rm.id === msg.reply_to_id);
        if (repliedMsg) {
          const repliedProfile = profiles?.find(p => p.id === repliedMsg.sender_id);
          replied_message = {
            body: repliedMsg.body,
            sender_name: repliedProfile?.display_name || repliedProfile?.username || "Unknown"
          };
        }
      }

      return {
        ...msg,
        profiles: profile || { display_name: null, username: null, avatar_url: null },
        replied_message
      };
    });

    setMessages(messagesWithProfiles as ChatMessageType[]);
    
    // Mark thread as read
    await supabase
      .from("thread_read_status")
      .upsert({
        thread_id: threadId,
        user_id: user.id,
        last_read_at: new Date().toISOString()
      }, {
        onConflict: "thread_id,user_id"
      });
    
      // Only refresh thread list on mobile (desktop shows both views simultaneously)
      if (isMobile) {
        loadThreads();
      }
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const subscribeToMessages = () => {
    if (!user || !threadId) return;
    
    const channel = supabase
      .channel(`chat:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, username, avatar_url")
            .eq("id", payload.new.sender_id)
            .single();

          // Fetch replied message if exists
          let replied_message = null;
          if (payload.new.reply_to_id) {
            const { data: repliedMsg } = await supabase
              .from("chat_messages")
              .select("body, sender_id")
              .eq("id", payload.new.reply_to_id)
              .single();
            
            if (repliedMsg) {
              const { data: repliedProfile } = await supabase
                .from("profiles")
                .select("display_name, username")
                .eq("id", repliedMsg.sender_id)
                .single();
              
              replied_message = {
                body: repliedMsg.body,
                sender_name: repliedProfile?.display_name || repliedProfile?.username || "Unknown"
              };
            }
          }

          setMessages((prev) => {
            // Remove any temp/optimistic messages when real message arrives
            const withoutTemp = prev.filter(m => !m.id.startsWith('temp-'));
            return [...withoutTemp, { 
              ...payload.new, 
              profiles: profile,
              replied_message 
            } as ChatMessageType];
          });
          
          // Auto-mark as read when viewing thread
          await supabase
            .from("thread_read_status")
            .upsert({
              thread_id: threadId,
              user_id: user.id,
              last_read_at: new Date().toISOString()
            }, {
              onConflict: "thread_id,user_id"
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentThread || !user) return;

    // Stop typing indicator
    stopTypingIndicator();

    // Validate message
    const MessageSchema = z.object({
      body: z.string()
        .min(1, 'Message cannot be empty')
        .max(5000, 'Message too long (max 5000 characters)')
        .trim()
    });

    try {
      const validated = MessageSchema.parse({ body: newMessage });

      const tempId = `temp-${Date.now()}`;
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("display_name, username, avatar_url")
        .eq("id", user.id)
        .single();

      // Optimistic UI update
      const optimisticMessage: ChatMessageType = {
        id: tempId,
        body: validated.body,
        created_at: new Date().toISOString(),
        sender_id: user.id,
        reply_to_id: replyingTo?.id || null,
        profiles: userProfile || { display_name: null, username: null, avatar_url: null },
        replied_message: replyingTo ? {
          body: replyingTo.body,
          sender_name: replyingTo.profiles?.display_name || replyingTo.profiles?.username || "Unknown"
        } : null
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage("");
      const replyToId = replyingTo?.id;
      setReplyingTo(null);

      const { error } = await supabase.from("chat_messages").insert({
        thread_id: currentThread.id,
        body: validated.body,
        sender_id: user.id,
        reply_to_id: replyToId || null,
      });

      if (error) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error("Failed to send message");
        setNewMessage(validated.body);
        if (replyToId) {
          const originalMsg = messages.find(m => m.id === replyToId);
          if (originalMsg) setReplyingTo(originalMsg);
        }
        return;
      }

      await supabase
        .from("chat_threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", currentThread.id);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      } else {
        toast.error("Failed to send message");
      }
    }
  };

  const handleVoiceMessage = async (audioFile: File, duration: number) => {
    if (!currentThread || !user || !threadId) return;

    try {
      console.log('Uploading voice message...');
      const fileName = `${threadId}/${user.id}/${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, audioFile);

      if (uploadError) {
        console.error('Voice upload error:', uploadError);
        throw uploadError;
      }
      
      console.log('Voice upload successful:', uploadData);

      const { data: { publicUrl } } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(fileName);

      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: threadId,
          sender_id: user.id,
          body: '[Voice Message]',
          voice_url: publicUrl,
          voice_duration: duration,
          message_type: 'voice',
          reply_to_id: replyingTo?.id
        });

      if (messageError) {
        console.error('Voice message insert error:', messageError);
        throw messageError;
      }

      setReplyingTo(null);
      setIsRecordingVoice(false);
      toast.success('Voice message sent!');
    } catch (error: any) {
      console.error('Error sending voice message:', error);
      setIsRecordingVoice(false);
      toast.error(`Failed to send voice message: ${error.message || 'Unknown error'}`);
    }
  };

  const handleTogglePin = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const isPinned = pinnedThreadIds.has(threadId);
    
    try {
      if (isPinned) {
        const { error } = await supabase
          .from('pinned_threads')
          .delete()
          .eq('thread_id', threadId)
          .eq('user_id', user!.id);
        
        if (error) throw error;
        
        setPinnedThreadIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(threadId);
          return newSet;
        });
        
        toast.success("Thread unpinned");
      } else {
        const { error } = await supabase
          .from('pinned_threads')
          .insert({
            thread_id: threadId,
            user_id: user!.id
          });
        
        if (error) throw error;
        
        setPinnedThreadIds(prev => new Set(prev).add(threadId));
        toast.success("Thread pinned");
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error("Failed to update pin");
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      const { error } = await supabase
        .from('chat_threads')
        .delete()
        .eq('id', threadId);

      if (error) throw error;

      toast.success("Thread deleted successfully");
      setThreads(threads.filter(t => t.id !== threadId));
      
      if (currentThread?.id === threadId) {
        setCurrentThread(null);
        setMessages([]);
        navigate(`/circle/${circleId}/chat`);
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast.error("Failed to delete thread");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteThreadId(null);
    }
  };

  const handleGifMessage = async (gifUrl: string, gifTitle: string) => {
    if (!currentThread || !user || !threadId) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: threadId,
          sender_id: user.id,
          body: gifTitle || '[GIF]',
          gif_url: gifUrl,
          gif_title: gifTitle,
          message_type: 'gif',
          reply_to_id: replyingTo?.id
        });

      if (error) throw error;

      setReplyingTo(null);
      toast.success('GIF sent!');

      // Trigger confetti animation
      setMessageEffect({ type: 'confetti' });
    } catch (error) {
      console.error('Error sending GIF:', error);
      toast.error('Failed to send GIF');
    }
  };

  const handleDeleteForMe = async (messageId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('deleted_messages')
        .insert({
          message_id: messageId,
          user_id: user.id
        });
      
      if (error) throw error;
      
      // Remove from local state
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleDeleteForEveryone = async (messageId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);
      
      if (error) throw error;
      
      // Remove from local state (realtime will update for others)
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success('Message deleted for everyone');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };


  const handleMessageSearch = (threadId: string, messageId: string) => {
    navigate(`/circle/${circleId}/chat?threadId=${threadId}`);
    // Scroll to message after navigation
    setTimeout(() => {
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageElement.classList.add('highlight-message');
        setTimeout(() => {
          messageElement.classList.remove('highlight-message');
        }, 2000);
      }
    }, 500);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowUnreadButton(false);
  };

  const handleCreateThread = async () => {
    if (!newThreadTitle.trim() || !user || !circleId) return;
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    const { data, error } = await supabase
      .from("chat_threads")
      .insert({
        circle_id: circleId,
        created_by: user.id,
        title: newThreadTitle,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create thread");
      return;
    }

    // Add creator and selected members to thread_members
    const membersToAdd = [...new Set([user.id, ...selectedMembers])];
    const { error: membersError } = await supabase
      .from("thread_members")
      .insert(
        membersToAdd.map((userId) => ({
          thread_id: data.id,
          user_id: userId,
        }))
      );

    if (membersError) {
      toast.error("Failed to add members to thread");
      return;
    }

    setCreateDialogOpen(false);
    setNewThreadTitle("");
    setSelectedMembers([]);
    loadThreads();
    toast.success(`Thread created with ${membersToAdd.length} member${membersToAdd.length > 1 ? 's' : ''}`);
    navigate(`/circle/${circleId}/chat?threadId=${data.id}`);
  };

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddMembers = async () => {
    if (!threadId || selectedMembers.length === 0) return;

    const { error } = await supabase
      .from("thread_members")
      .insert(
        selectedMembers.map((userId) => ({
          thread_id: threadId,
          user_id: userId,
        }))
      );

    if (error) {
      toast.error("Failed to add members");
      return;
    }

    setAddMembersDialogOpen(false);
    setSelectedMembers([]);
    toast.success(`Added ${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''} to thread`);
  };

  const sortedFilteredThreads = useMemo(() => {
    const filtered = threads.filter((thread) => {
      if (selectedFilter === "all") return true;
      if (selectedFilter === "wall") return thread.linked_wall_item_id !== null;
      if (selectedFilter === "convos") return thread.linked_wall_item_id === null;
      return true;
    });

    return filtered.sort((a, b) => {
      const aIsPinned = pinnedThreadIds.has(a.id);
      const bIsPinned = pinnedThreadIds.has(b.id);
      
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      
      const aTime = a.lastMessageAt || a.updated_at;
      const bTime = b.lastMessageAt || b.updated_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [threads, selectedFilter, pinnedThreadIds]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation circleId={circleId} />
      <div className={`${isMobile ? 'pt-4 pb-20' : 'pl-24 pr-8 pt-8'} ${isMobile ? 'h-screen pb-20' : 'h-[calc(100vh-80px)]'}`}>
        {isMobile ? (
          /* Mobile: Show either thread list OR chat view */
          <>
            {!threadId ? (
              /* Thread List View */
              <div className="flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between mb-4 px-4">
                  <h2 className="text-2xl font-bold">Threads</h2>
                  <div className="flex items-center gap-2">
                    <NotificationCenter />
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="default">
                          <Plus className="w-4 h-4 mr-2" />
                          New
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Create New Thread</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Thread title..."
                            value={newThreadTitle}
                            onChange={(e) => setNewThreadTitle(e.target.value)}
                          />
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Add Members ({selectedMembers.length} selected)
                            </label>
                            <MemberPicker
                              circleId={circleId!}
                              selectedMembers={selectedMembers}
                              onMemberToggle={handleMemberToggle}
                              excludeUserIds={[user?.id || ""]}
                            />
                          </div>
                          <Button 
                            onClick={handleCreateThread} 
                            className="w-full"
                            disabled={!newThreadTitle.trim() || selectedMembers.length === 0}
                          >
                            Create Thread with {selectedMembers.length + 1} member{selectedMembers.length + 1 > 1 ? 's' : ''}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                  <TabsList className="w-full">
                    <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                    <TabsTrigger value="wall" className="flex-1">Wall</TabsTrigger>
                    <TabsTrigger value="convos" className="flex-1">Convos</TabsTrigger>
                  </TabsList>
                </Tabs>
                
            <ScrollArea className="flex-1 h-0">
                  <div className="space-y-1">
                    {sortedFilteredThreads.map((thread) => {
                      const isPinned = pinnedThreadIds.has(thread.id);
                      return (
                      <div key={thread.id} className="relative group flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/circle/${circleId}/chat?threadId=${thread.id}`)}
                          className={`flex-1 text-left p-3 rounded-lg transition-all hover:bg-card flex items-center gap-3 ${
                            thread.unreadCount > 0 ? 'bg-accent border-l-4 border-primary' : 'bg-card/40'
                          }`}
                        >
                        {thread.unreadCount > 0 && (
                          <div className="flex-shrink-0 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {thread.unreadCount > 9 ? "9+" : thread.unreadCount}
                          </div>
                        )}
                        <ThreadAvatarStack 
                          members={thread.members} 
                          currentUserId={user?.id || ""} 
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`truncate ${thread.unreadCount > 0 ? 'font-bold' : 'font-medium'}`}>
                            {thread.title}
                          </div>
                          <div className={`text-xs mt-1 ${thread.unreadCount > 0 ? 'text-white font-medium' : 'text-muted-foreground'}`}>
                            {getRelativeTimeString(thread.lastMessageAt)}
                          </div>
                        </div>
                        {thread.linked_wall_item_id && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded flex-shrink-0">
                            Wall
                          </span>
                        )}
                        </button>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleTogglePin(thread.id, e)}
                          >
                            <Pin className={cn("h-4 w-4", isPinned ? "text-primary fill-primary" : "text-muted-foreground")} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteThreadId(thread.id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              /* Chat View - Fixed mobile layout */
              <div className="fixed inset-0 flex flex-col bg-background md:relative md:h-full md:border md:rounded-lg md:overflow-hidden">
                {/* Fixed Header */}
                <div className="flex-shrink-0 px-4 py-3 border-b bg-card flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => navigate(`/circle/${circleId}/chat`)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <h3 className="text-xl font-bold flex-1 truncate">{currentThread?.title}</h3>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSearchDialogOpen(true)}
                    title="Search messages (Ctrl+K)"
                  >
                    <SearchIcon className="w-4 h-4" />
                  </Button>
                  <Dialog open={addMembersDialogOpen} onOpenChange={setAddMembersDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setSelectedMembers([])}>
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Members to Thread</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <MemberPicker
                          circleId={circleId!}
                          selectedMembers={selectedMembers}
                          onMemberToggle={handleMemberToggle}
                        />
                        <Button 
                          onClick={handleAddMembers} 
                          className="w-full"
                          disabled={selectedMembers.length === 0}
                        >
                          Add {selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Scrollable Messages Area - Account for fixed input bar */}
                <ScrollArea className="flex-1 p-4 pb-32 overflow-y-auto md:pb-4">
                  {threadPhoto && (
                    <div className="mb-4 rounded-lg overflow-hidden border-2 border-primary bg-black">
                      <img 
                        src={threadPhoto.url} 
                        alt={threadPhoto.caption || 'Photo'} 
                        className="w-full max-h-64 object-contain"
                      />
                      {threadPhoto.caption && (
                        <div className="p-3 bg-muted border-t-2 border-amber-500">
                          <p className="text-sm font-semibold">{threadPhoto.caption}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {messages.map((message) => {
                    // GIF Message
                    if (message.gif_url && message.message_type === 'gif') {
                      return (
                        <div key={message.id} className={`flex gap-3 mb-4 ${message.sender_id === user?.id ? 'flex-row-reverse' : ''}`}>
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage src={message.profiles?.avatar_url || undefined} />
                            <AvatarFallback>{(message.profiles?.display_name || message.profiles?.username || "U")[0]}</AvatarFallback>
                          </Avatar>
                          <div className={`flex flex-col gap-1 max-w-[70%] ${message.sender_id === user?.id ? 'items-end' : ''}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{message.profiles?.display_name || message.profiles?.username}</span>
                              <span className="text-xs text-muted-foreground">{format(new Date(message.created_at), 'p')}</span>
                            </div>
                             <div className="rounded-lg overflow-hidden">
                              <img src={message.gif_url} alt={message.gif_title || 'GIF'} className="max-w-full h-auto" />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Voice Message
                    if (message.voice_url && message.message_type === 'voice') {
                      return (
                        <div key={message.id} className={`flex gap-3 mb-4 ${message.sender_id === user?.id ? 'flex-row-reverse' : ''}`}>
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage src={message.profiles?.avatar_url || undefined} />
                            <AvatarFallback>{(message.profiles?.display_name || message.profiles?.username || "U")[0]}</AvatarFallback>
                          </Avatar>
                          <div className={`flex flex-col gap-1 max-w-[70%] ${message.sender_id === user?.id ? 'items-end' : ''}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{message.profiles?.display_name || message.profiles?.username}</span>
                              <span className="text-xs text-muted-foreground">{format(new Date(message.created_at), 'p')}</span>
                            </div>
                            <div className={`rounded-lg p-3 ${message.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                              <audio controls src={message.voice_url} className="max-w-full" />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Image Message
                    if (message.image_url) {
                      return (
                        <ChatMessageWithImage
                          key={message.id}
                          id={message.id}
                          body={message.body}
                          image_url={message.image_url}
                          created_at={message.created_at}
                          sender={{
                            id: message.sender_id,
                            username: message.profiles?.username || "Unknown",
                            display_name: message.profiles?.display_name,
                            avatar_url: message.profiles?.avatar_url,
                          }}
                          isOwn={message.sender_id === user?.id}
                          onReply={() => setReplyingTo(message)}
                          onReaction={() => {}}
                          replyTo={message.replied_message}
                        />
                      );
                    }
                    
                    // Text Message
                    return (
                      <SwipeableMessage
                        key={message.id}
                        onSwipeReply={() => setReplyingTo(message)}
                        onSwipeDelete={() => handleDeleteForMe(message.id)}
                      >
                        <ChatMessage
                          id={message.id}
                          body={message.body}
                          created_at={message.created_at}
                          sender_id={message.sender_id}
                          sender_name={message.profiles?.display_name || message.profiles?.username || "Unknown"}
                          sender_avatar={message.profiles?.avatar_url || undefined}
                          reply_to_id={message.reply_to_id}
                          replied_message={message.replied_message}
                          currentUserId={user?.id}
                          isOwn={message.sender_id === user?.id}
                          onReply={() => setReplyingTo(message)}
                          onDeleteForMe={() => handleDeleteForMe(message.id)}
                          onDeleteForEveryone={() => handleDeleteForEveryone(message.id)}
                        />
                      </SwipeableMessage>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Fixed Input Bar - Positioned above mobile browser UI */}
                <div className="fixed bottom-0 left-0 right-0 p-4 pb-20 border-t bg-card md:relative md:bottom-auto md:pb-4">
                  {replyingTo && (
                    <ReplyPreview
                      username={replyingTo.profiles?.display_name || replyingTo.profiles?.username || "Unknown"}
                      message={replyingTo.body}
                      onCancel={() => setReplyingTo(null)}
                    />
                  )}

                  {/* Typing Indicators */}
                  <TypingIndicator typingUsers={typingUsers} />

                  <div className="flex gap-2 items-center">
                    {!isRecordingVoice && (
                      <AttachmentMenu
                        onPhotoSelect={async (files) => {
                          if (!user || !threadId) return;
                          const file = files[0];
                          if (!file) return;

                          try {
                            console.log('Uploading photo to chat-images...');
                            const fileName = `${threadId}/${user.id}/${Date.now()}.jpg`;
                            const { data: uploadData, error: uploadError } = await supabase.storage
                              .from('chat-images')
                              .upload(fileName, file);

                            if (uploadError) {
                              console.error('Photo upload error:', uploadError);
                              throw uploadError;
                            }

                            const { data: { publicUrl } } = supabase.storage
                              .from('chat-images')
                              .getPublicUrl(fileName);

                            const { error: messageError } = await supabase
                              .from('chat_messages')
                              .insert({
                                thread_id: threadId,
                                sender_id: user.id,
                                body: '',
                                image_url: publicUrl,
                                message_type: 'image',
                                reply_to_id: replyingTo?.id,
                              });

                            if (messageError) {
                              console.error('Message insert error:', messageError);
                              throw messageError;
                            }

                            setReplyingTo(null);
                            toast.success('Photo sent!');
                          } catch (error) {
                            console.error('Error uploading photo:', error);
                            toast.error('Failed to send photo');
                          }
                        }}
                        onVoiceStart={() => setIsRecordingVoice(true)}
                        onEmojiSelect={(emoji) => setNewMessage(prev => prev + emoji)}
                        onGifSelect={handleGifMessage}
                        disabled={!threadId}
                      />
                    )}

                    {isRecordingVoice ? (
                    <VoiceRecorder
                      threadId={threadId!}
                      userId={user!.id}
                      onVoiceRecorded={handleVoiceMessage}
                      onCancel={() => setIsRecordingVoice(false)}
                    />
                    ) : (
                      <>
                        <Input
                          placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                          }}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          className="flex-1"
                        />
                        
                        <Button onClick={handleSendMessage} size="icon" disabled={!newMessage.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Desktop: Show threads sidebar and chat area with resizable panels */
          <ResizablePanelGroup 
            direction="horizontal"
            onLayout={(sizes) => {
              if (sizes[0]) {
                localStorage.setItem('chat-sidebar-width', sizes[0].toString());
              }
            }}
          >
            {/* Threads Sidebar Panel */}
            <ResizablePanel defaultSize={sidebarSize} minSize={25} maxSize={50}>
              <div className="flex flex-col gap-4 h-full pr-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Threads</h2>
                  <div className="flex items-center gap-2">
                    <NotificationCenter />
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="default">
                          <Plus className="w-4 h-4 mr-2" />
                          New
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Create New Thread</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Thread title..."
                            value={newThreadTitle}
                            onChange={(e) => setNewThreadTitle(e.target.value)}
                          />
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Add Members ({selectedMembers.length} selected)
                            </label>
                            <MemberPicker
                              circleId={circleId!}
                              selectedMembers={selectedMembers}
                              onMemberToggle={handleMemberToggle}
                              excludeUserIds={[user?.id || ""]}
                            />
                          </div>
                          <Button 
                            onClick={handleCreateThread} 
                            className="w-full"
                            disabled={!newThreadTitle.trim() || selectedMembers.length === 0}
                          >
                            Create Thread with {selectedMembers.length + 1} member{selectedMembers.length + 1 > 1 ? 's' : ''}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                  <TabsList className="w-full">
                    <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                    <TabsTrigger value="wall" className="flex-1">Wall Threads</TabsTrigger>
                    <TabsTrigger value="convos" className="flex-1">Convos</TabsTrigger>
                  </TabsList>
                </Tabs>

                <ScrollArea className="flex-1 border rounded-lg bg-card/50 backdrop-blur">
                  <div className="p-2 space-y-2">
                    {sortedFilteredThreads.map((thread) => {
                      const isPinned = pinnedThreadIds.has(thread.id);
                      return (
                      <div key={thread.id} className="relative group flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/circle/${circleId}/chat?threadId=${thread.id}`)}
                          className={`flex-1 text-left p-3 rounded-lg transition-all hover:bg-card flex items-center gap-3 ${
                            threadId === thread.id 
                              ? "bg-card shadow-md" 
                              : thread.unreadCount > 0 
                                ? "bg-accent border-l-4 border-primary" 
                                : "bg-card/40"
                          }`}
                        >
                          {isPinned && <Pin className="h-3.5 w-3.5 text-primary fill-primary flex-shrink-0" />}
                          {thread.unreadCount > 0 && (
                            <div className="flex-shrink-0 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                              {thread.unreadCount > 9 ? "9+" : thread.unreadCount}
                            </div>
                          )}
                          <ThreadAvatarStack 
                            members={thread.members} 
                            currentUserId={user?.id || ""} 
                          />
                          <div className="flex-1 min-w-0">
                            <div className={`flex items-center gap-2 ${thread.unreadCount > 0 ? 'font-bold' : 'font-medium'}`}>
                              {thread.linked_wall_item_id && <span>📷</span>}
                              <span className="truncate">{thread.title}</span>
                            </div>
                            <div className={`text-xs mt-1 ${thread.unreadCount > 0 ? 'text-white font-medium' : 'text-muted-foreground'}`}>
                              {getRelativeTimeString(thread.lastMessageAt)}
                            </div>
                          </div>
                        </button>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => handleTogglePin(thread.id, e)}
                          >
                            <Pin className={cn("h-4 w-4", isPinned ? "text-primary fill-primary" : "text-muted-foreground")} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteThreadId(thread.id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>

            {/* Draggable Handle */}
            <ResizableHandle withHandle />

            {/* Chat Area Panel */}
            <ResizablePanel defaultSize={60} minSize={50}>
              <div className="flex flex-col border rounded-lg bg-card overflow-hidden h-full ml-2">
                {threadId && currentThread ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b bg-card flex items-center justify-between">
                      <h3 className="text-xl font-bold">{currentThread.title}</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setSearchDialogOpen(true)}
                          title="Search messages (Ctrl+K)"
                        >
                          <SearchIcon className="w-4 h-4" />
                        </Button>
                        <Dialog open={addMembersDialogOpen} onOpenChange={setAddMembersDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedMembers([])}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Add Members
                            </Button>
                          </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Add Members to Thread</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <MemberPicker
                              circleId={circleId!}
                              selectedMembers={selectedMembers}
                              onMemberToggle={handleMemberToggle}
                            />
                            <Button 
                              onClick={handleAddMembers} 
                              className="w-full"
                              disabled={selectedMembers.length === 0}
                            >
                              Add {selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4 pb-32 md:pb-4">
                      {threadPhoto && (
                        <div className="mb-4 rounded-lg overflow-hidden border-2 border-primary bg-black">
                          <img 
                            src={threadPhoto.url} 
                            alt={threadPhoto.caption || 'Photo'} 
                            className="w-full max-h-64 object-contain"
                          />
                          {threadPhoto.caption && (
                            <div className="p-3 bg-muted border-t-2 border-amber-500">
                              <p className="text-sm font-semibold">{threadPhoto.caption}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {messages.map((message) => {
                        // GIF Message
                        if (message.gif_url && message.message_type === 'gif') {
                          return (
                            <div key={message.id} className={`flex gap-3 mb-4 ${message.sender_id === user?.id ? 'flex-row-reverse' : ''}`}>
                              <Avatar className="w-8 h-8 flex-shrink-0">
                                <AvatarImage src={message.profiles?.avatar_url || undefined} />
                                <AvatarFallback>{(message.profiles?.display_name || message.profiles?.username || "U")[0]}</AvatarFallback>
                              </Avatar>
                              <div className={`flex flex-col gap-1 max-w-[70%] ${message.sender_id === user?.id ? 'items-end' : ''}`}>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold">{message.profiles?.display_name || message.profiles?.username}</span>
                                  <span className="text-xs text-muted-foreground">{format(new Date(message.created_at), 'p')}</span>
                                </div>
                                <div className="rounded-lg overflow-hidden">
                                  <img src={message.gif_url} alt={message.gif_title || 'GIF'} className="max-w-full h-auto" />
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        // Voice Message
                        if (message.voice_url && message.message_type === 'voice') {
                          return (
                            <div key={message.id} className={`flex gap-3 mb-4 ${message.sender_id === user?.id ? 'flex-row-reverse' : ''}`}>
                              <Avatar className="w-8 h-8 flex-shrink-0">
                                <AvatarImage src={message.profiles?.avatar_url || undefined} />
                                <AvatarFallback>{(message.profiles?.display_name || message.profiles?.username || "U")[0]}</AvatarFallback>
                              </Avatar>
                              <div className={`flex flex-col gap-1 max-w-[70%] ${message.sender_id === user?.id ? 'items-end' : ''}`}>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold">{message.profiles?.display_name || message.profiles?.username}</span>
                                  <span className="text-xs text-muted-foreground">{format(new Date(message.created_at), 'p')}</span>
                                </div>
                                <div className={`rounded-lg p-3 ${message.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                  <audio controls src={message.voice_url} className="max-w-full" />
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        // Image Message
                        if (message.image_url) {
                          return (
                            <ChatMessageWithImage
                              key={message.id}
                              id={message.id}
                              body={message.body}
                              image_url={message.image_url}
                              created_at={message.created_at}
                              sender={{
                                id: message.sender_id,
                                username: message.profiles?.username || "Unknown",
                                display_name: message.profiles?.display_name,
                                avatar_url: message.profiles?.avatar_url,
                              }}
                              isOwn={message.sender_id === user?.id}
                              onReply={() => setReplyingTo(message)}
                              onReaction={() => {}}
                              replyTo={message.replied_message}
                            />
                          );
                        }
                        
                        // Text Message
                        return (
                          <ChatMessage
                            key={message.id}
                            id={message.id}
                            body={message.body}
                            created_at={message.created_at}
                            sender_id={message.sender_id}
                            sender_name={message.profiles?.display_name || message.profiles?.username || "Unknown"}
                            sender_avatar={message.profiles?.avatar_url || undefined}
                            reply_to_id={message.reply_to_id}
                            replied_message={message.replied_message}
                            currentUserId={user?.id}
                            isOwn={message.sender_id === user?.id}
                            onReply={() => setReplyingTo(message)}
                          />
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-4 border-t bg-card">
                      {replyingTo && (
                        <ReplyPreview
                          username={replyingTo.profiles?.display_name || replyingTo.profiles?.username || "Unknown"}
                          message={replyingTo.body}
                          onCancel={() => setReplyingTo(null)}
                        />
                      )}

                      {/* Typing Indicators */}
                      <TypingIndicator typingUsers={typingUsers} />

                      <div className="flex gap-2 items-center">
                        <AttachmentMenu
                      onPhotoSelect={async (files) => {
                        if (!user || !threadId) return;
                        const file = files[0];
                        if (!file) return;

                        try {
                          const fileName = `${threadId}/${user.id}/${Date.now()}.jpg`;
                          const { data: uploadData, error: uploadError } = await supabase.storage
                            .from('chat-images')
                            .upload(fileName, file);

                          if (uploadError) throw uploadError;

                          const { data: { publicUrl } } = supabase.storage
                            .from('chat-images')
                            .getPublicUrl(fileName);

                          const { error: messageError } = await supabase
                            .from('chat_messages')
                            .insert({
                              thread_id: threadId,
                              sender_id: user.id,
                              body: '',
                              image_url: publicUrl,
                              message_type: 'image',
                              reply_to_id: replyingTo?.id,
                            });

                          if (messageError) throw messageError;

                          setReplyingTo(null);
                          toast.success('Photo sent!');
                        } catch (error) {
                          console.error('Error uploading photo:', error);
                          toast.error('Failed to send photo');
                        }
                      }}
                          onVoiceStart={() => setIsRecordingVoice(true)}
                          onEmojiSelect={(emoji) => setNewMessage(prev => prev + emoji)}
                          onGifSelect={handleGifMessage}
                          disabled={!threadId}
                        />

                        {isRecordingVoice ? (
                        <VoiceRecorder
                          threadId={threadId!}
                          userId={user!.id}
                          onVoiceRecorded={handleVoiceMessage}
                          onCancel={() => setIsRecordingVoice(false)}
                        />
                        ) : (
                          <>
                            <Input
                              placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
                              value={newMessage}
                              onChange={(e) => {
                                setNewMessage(e.target.value);
                                handleTyping();
                              }}
                              onKeyPress={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                              className="flex-1"
                            />
                            
                            <Button onClick={handleSendMessage} size="icon" disabled={!newMessage.trim()}>
                              <Send className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Select a thread to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      {/* Global Components */}
      <MessageSearch
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        circleId={circleId || ''}
        onMessageClick={handleMessageSearch}
      />

      <MessageAnimations
        effect={messageEffect}
        onComplete={() => setMessageEffect(null)}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thread?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteThreadId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteThreadId && handleDeleteThread(deleteThreadId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes highlight {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(var(--primary), 0.2); }
        }

        .highlight-message {
          animation: highlight 2s ease-in-out;
        }
      `}} />
    </div>
  );
};

export default Chat;
