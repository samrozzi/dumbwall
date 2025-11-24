import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Database } from "@/integrations/supabase/types";
import { z } from "zod";
import Navigation from "@/components/Navigation";
import { NotificationCenter } from "@/components/NotificationCenter";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import StickyNote from "@/components/wall/StickyNote";
import ImageCard from "@/components/wall/ImageCard";
import ThreadBubble from "@/components/wall/ThreadBubble";
import TicTacToe from "@/components/wall/TicTacToe";
import AnnouncementBubble from "@/components/wall/AnnouncementBubble";
import { QuickPoll } from "@/components/wall/QuickPoll";
import { AudioClip } from "@/components/wall/AudioClip";
import { DoodleCanvas } from "@/components/wall/DoodleCanvas";
import { MusicDrop } from "@/components/wall/MusicDrop";
import { ChallengeCard } from "@/components/wall/ChallengeCard";
import AddItemMenu from "@/components/wall/AddItemMenu";
import CameraCapture from "@/components/wall/CameraCapture";
import { CreatePollDialog } from "@/components/wall/CreatePollDialog";
import { CreateAudioDialog } from "@/components/wall/CreateAudioDialog";
import { CreateDoodleDialog } from "@/components/wall/CreateDoodleDialog";
import { CreateMusicDialog } from "@/components/wall/CreateMusicDialog";
import { CreateChallengeDialog } from "@/components/wall/CreateChallengeDialog";
import { notify } from "@/components/ui/custom-notification";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Camera } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type WallItemType = Database["public"]["Enums"]["wall_item_type"] | "announcement";
type WallItemRow = Database["public"]["Tables"]["wall_items"]["Row"];

interface WallItem extends Omit<WallItemRow, "type"> {
  type: WallItemType;
}

const GRID_SIZE = 20;
const COLORS = ["yellow", "pink", "blue", "orange", "green", "purple", "cream"];

// Helper to get meaningful display title for list view
const getItemDisplayTitle = (item: WallItem) => {
  const content = item.content as any;
  switch (item.type) {
    case "note":
      return content.title || content.body?.substring(0, 30) || "Untitled Note";
    case "image":
      return content.caption || "Image";
    case "thread":
      return content.title || "Chat Thread";
    case "poll":
      return content.question || "Poll";
    case "challenge":
      return content.title || content.prompt?.substring(0, 40) || "Challenge";
    case "announcement":
      return content.text?.substring(0, 40) || "Announcement";
    case "music":
      return content.songTitle ? `${content.songTitle}${content.artist ? ` - ${content.artist}` : ''}` : "Music";
    case "audio":
      return content.caption || content.title || "Audio Clip";
    case "doodle":
      return "Doodle";
    case "game_tictactoe":
      return "Tic-Tac-Toe";
    default:
      return "Unknown Item";
  }
};

// Helper to get appropriate icon for each item type
const getItemIcon = (type: WallItemType) => {
  switch (type) {
    case "note": return "📝";
    case "image": return "🖼️";
    case "thread": return "💬";
    case "poll": return "📊";
    case "challenge": return "🎯";
    case "announcement": return "📢";
    case "music": return "🎵";
    case "audio": return "🎤";
    case "doodle": return "🎨";
    case "game_tictactoe": return "❌⭕";
    default: return "📄";
  }
};

const Wall = () => {
  const { circleId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [items, setItems] = useState<WallItem[]>([]);
  const [viewMode, setViewMode] = useState<"wall" | "list">("wall");
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [maxZIndex, setMaxZIndex] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Dialog states
  const [noteDialog, setNoteDialog] = useState(false);
  const [imageDialog, setImageDialog] = useState(false);
  const [threadDialog, setThreadDialog] = useState(false);
  const [announcementDialog, setAnnouncementDialog] = useState(false);
  const [pollDialog, setPollDialog] = useState(false);
  const [audioDialog, setAudioDialog] = useState(false);
  const [doodleDialog, setDoodleDialog] = useState(false);
  const [musicDialog, setMusicDialog] = useState(false);
  const [challengeDialog, setChallengeDialog] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  
  // Thread deletion states
  const [deleteThreadDialog, setDeleteThreadDialog] = useState(false);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<{ itemId: string; threadId: string } | null>(null);
  
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteColor, setNoteColor] = useState("yellow");
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [threadTitle, setThreadTitle] = useState("");
  const [announcementText, setAnnouncementText] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!circleId) return;
    loadItems();

    const channel = supabase
      .channel(`wall_items_${circleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wall_items",
          filter: `circle_id=eq.${circleId}`,
        },
        () => {
          loadItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, circleId, navigate]);

  // Calculate dynamic canvas height based on items
  const canvasHeight = useMemo(() => {
    if (items.length === 0) return 'calc(100vh - 120px)';
    
    // Find the bottommost item (y position + estimated height)
    const maxItemY = Math.max(...items.map(item => item.y + 400)); // +400 for item height
    const minHeight = typeof window !== 'undefined' ? window.innerHeight - 120 : 800;
    
    return Math.max(minHeight, maxItemY + 100) + 'px';
  }, [items]);

  const loadItems = async () => {
    try {
      // Step 1: Get wall items
      const { data, error } = await supabase
        .from("wall_items")
        .select("*")
        .eq("circle_id", circleId)
        .order("z_index", { ascending: true });

      if (error) throw error;

      // Step 2: Get unique creator IDs
      const creatorIds = [...new Set(data?.map(item => item.created_by) || [])];

      if (creatorIds.length === 0) {
        setItems([]);
        return;
      }

      // Step 3: Fetch all creator profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, avatar_url, username")
        .in("id", creatorIds);

      if (profilesError) throw profilesError;

      // Step 4: Merge data
      const itemsWithCreators = (data || []).map(item => {
        const profile = profiles?.find(p => p.id === item.created_by);
        return {
          ...item,
          creator_profile: profile ? {
            avatar_url: profile.avatar_url,
            username: profile.username
          } : null
        };
      });

      setItems(itemsWithCreators as any);
      const maxZ = Math.max(...itemsWithCreators.map(item => item.z_index), 0);
      setMaxZIndex(maxZ);
    } catch (error: any) {
      notify(error.message, "error");
    }
  };

  const getSmartPosition = () => {
    const canvasWidth = canvasRef.current?.offsetWidth || 1200;
    const itemWidth = 280;
    const itemHeight = 320;
    const padding = 40;
    // Use dynamic maxY based on current canvas height or items
    const maxItemY = items.length > 0 ? Math.max(...items.map(item => item.y)) : 0;
    const maxY = Math.max(600, maxItemY + 400); // Grow with content, min 600
    
    // Random starting position with some variation
    let x = 60 + Math.floor(Math.random() * 200);
    let y = 60 + Math.floor(Math.random() * 150);
    let attempts = 0;
    
    while (attempts < 25) {
      const hasOverlap = items.some(item => {
        const distX = Math.abs(item.x - x);
        const distY = Math.abs(item.y - y);
        return distX < 200 && distY < 200;
      });
      
      if (!hasOverlap) break;
      
      // Move to next position
      x += 90;
      
      // Wrap x if needed
      if (x + itemWidth > canvasWidth - padding) {
        x = 60 + Math.floor(Math.random() * 100);
        y += 100;
      }
      
      // CRITICAL: Wrap y back to top if too far down
      if (y > maxY) {
        y = 60 + Math.floor(Math.random() * 100);
        x += 150; // Shift right when wrapping back up
      }
      
      attempts++;
    }
    
    // Final bounds check
    x = Math.max(padding, Math.min(x, canvasWidth - itemWidth - padding));
    y = Math.max(padding, Math.min(y, maxY));
    
    return { x, y };
  };

  const createItem = async (type: WallItemType, content: any, x?: number, y?: number) => {
    try {
      // Validate content based on type
      const StickyNoteSchema = z.object({
        title: z.string().max(100, 'Title too long'),
        body: z.string().max(500, 'Note too long'),
        color: z.string().regex(/^[a-z]+$/)
      });

      const ImageContentSchema = z.object({
        url: z.string().url('Invalid image URL'),
        caption: z.string().max(200, 'Caption too long').optional()
      });

      const ThreadContentSchema = z.object({
        title: z.string().max(100, 'Title too long'),
        threadId: z.string().uuid('Invalid thread ID')
      });

      const AnnouncementSchema = z.object({
        text: z.string().max(500, 'Announcement too long')
      });

      // Validate based on type
      if (type === 'note') {
        StickyNoteSchema.parse(content);
      } else if (type === 'image') {
        ImageContentSchema.parse(content);
      } else if (type === 'thread') {
        ThreadContentSchema.parse(content);
      } else if (type === 'announcement') {
        AnnouncementSchema.parse(content);
      }

      const position = (x !== undefined && y !== undefined) ? { x, y } : getSmartPosition();
      
      const { error } = await supabase.from("wall_items").insert({
        circle_id: circleId!,
        created_by: user?.id!,
        type: type as any,
        content,
        x: position.x,
        y: position.y,
        z_index: maxZIndex + 1,
      });

      if (error) throw error;
      setMaxZIndex(prev => prev + 1);
      notify("Item added!", "success");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        notify(error.issues[0].message, "error");
      } else {
        notify(error.message, "error");
      }
    }
  };

  const updateItem = async (id: string, updates: Partial<Omit<WallItem, "id" | "circle_id" | "created_by" | "created_at">>) => {
    try {
      const { error } = await supabase
        .from("wall_items")
        .update(updates as any)
        .eq("id", id);

      if (error) throw error;
    } catch (error: any) {
      notify(error.message, "error");
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from("wall_items").delete().eq("id", id);
      if (error) throw error;
      
      // Immediately update local state to remove the item
      setItems((prev) => prev.filter((item) => item.id !== id));
      
      notify("Item deleted", "info");
    } catch (error: any) {
      notify(error.message, "error");
    }
  };

  const handleThreadDelete = (itemId: string, threadId: string) => {
    setThreadToDelete({ itemId, threadId });
    setDeleteThreadDialog(true);
  };

  const handleMoveToChat = async () => {
    if (!threadToDelete) return;
    
    try {
      // Remove the link from the thread to the wall item
      const { error: unlinkError } = await supabase
        .from("chat_threads")
        .update({ linked_wall_item_id: null })
        .eq("id", threadToDelete.threadId);

      if (unlinkError) throw unlinkError;

      // Delete the wall item
      const { error } = await supabase
        .from("wall_items")
        .delete()
        .eq("id", threadToDelete.itemId);

      if (error) throw error;
      notify("Thread moved to chat only", "success");
      setDeleteThreadDialog(false);
      setThreadToDelete(null);
    } catch (error: any) {
      notify(error.message, "error");
    }
  };

  const handleDeleteCompletely = async () => {
    if (!threadToDelete) return;
    
    try {
      // Delete all messages first
      const { error: messagesError } = await supabase
        .from("chat_messages")
        .delete()
        .eq("thread_id", threadToDelete.threadId);

      if (messagesError) throw messagesError;

      // Delete the thread
      const { error: threadError } = await supabase
        .from("chat_threads")
        .delete()
        .eq("id", threadToDelete.threadId);

      if (threadError) throw threadError;

      // Delete the wall item
      const { error: wallError } = await supabase
        .from("wall_items")
        .delete()
        .eq("id", threadToDelete.itemId);

      if (wallError) throw wallError;

      notify("Thread deleted completely", "info");
      setConfirmDeleteDialog(false);
      setDeleteThreadDialog(false);
      setThreadToDelete(null);
    } catch (error: any) {
      notify(error.message, "error");
    }
  };

  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault(); // Prevent text selection
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    setDraggedItem(itemId);
    setDragOffset({
      x: e.clientX - item.x,
      y: e.clientY - item.y,
    });

    updateItem(itemId, { z_index: maxZIndex + 1 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedItem || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasRect = canvas.getBoundingClientRect();
    const actualCanvasHeight = canvasRect.height;
    const actualCanvasWidth = canvasRect.width;
    
    // Get the actual dragged element to measure its real dimensions
    const draggedElement = document.querySelector(`[data-item-id="${draggedItem}"]`);
    const itemWidth = draggedElement?.getBoundingClientRect().width || 280;
    const itemHeight = draggedElement?.getBoundingClientRect().height || 280;
    
    const padding = 20;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Clamp horizontally
    const maxX = actualCanvasWidth - itemWidth - padding;
    const clampedX = Math.max(0, Math.min(maxX, newX));
    
    // Clamp vertically - allow items to reach bottom edge with minimal padding
    const bottomPadding = 4;
    const maxY = actualCanvasHeight - itemHeight - bottomPadding;
    const clampedY = Math.max(0, Math.min(maxY, newY));

    // Snap to grid
    const snappedX = Math.round(clampedX / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(clampedY / GRID_SIZE) * GRID_SIZE;

    setItems((prev) =>
      prev.map((item) =>
        item.id === draggedItem ? { ...item, x: snappedX, y: snappedY } : item
      )
    );
  };

  const handleMouseUp = () => {
    if (!draggedItem) return;

    const item = items.find((i) => i.id === draggedItem);
    if (!item) return;

    updateItem(draggedItem, { x: item.x, y: item.y });
    
    setDraggedItem(null);
  };

  const renderItem = (item: WallItem) => {
    const content = item.content as any;
    const itemWithCreator = item as any;
    const isCreator = user?.id === item.created_by;
    
    switch (item.type) {
      case "note":
        return (
          <StickyNote
            content={content}
            onDelete={() => deleteItem(item.id)}
            onUpdate={(newContent) => updateItem(item.id, { content: newContent as any })}
            isCreator={isCreator}
            creatorAvatar={itemWithCreator.creator_profile?.avatar_url}
            creatorUsername={itemWithCreator.creator_profile?.username}
          />
        );
      case "image":
        return (
          <ImageCard
            id={item.id}
            content={content}
            onDelete={() => deleteItem(item.id)}
            creatorAvatar={itemWithCreator.creator_profile?.avatar_url}
            creatorUsername={itemWithCreator.creator_profile?.username}
            currentUserId={user?.id}
          />
        );
      case "thread":
        const threadContent = content as { title: string; threadId?: string };
        if (!threadContent.threadId) {
          return (
            <ThreadBubble
              content={{ title: threadContent.title, threadId: "" }}
              onDelete={() => deleteItem(item.id)}
              onClick={() => notify("Thread data is missing", "error")}
            />
          );
        }
        return (
          <ThreadBubble
            content={{ title: threadContent.title, threadId: threadContent.threadId }}
            onDelete={() => handleThreadDelete(item.id, threadContent.threadId)}
            onClick={() => navigate(`/circle/${circleId}/chat?threadId=${threadContent.threadId}`)}
          />
        );
      case "poll":
        return (
          <QuickPoll
            content={content}
            itemId={item.id}
            currentUserId={user?.id}
            onDelete={() => deleteItem(item.id)}
            isCreator={isCreator}
          />
        );
      case "audio":
        return (
          <AudioClip
            content={content}
            onDelete={() => deleteItem(item.id)}
            isCreator={isCreator}
          />
        );
      case "doodle":
        return (
          <DoodleCanvas
            content={content}
            onDelete={() => deleteItem(item.id)}
            isCreator={isCreator}
          />
        );
      case "music":
        return (
          <MusicDrop
            content={content}
            onDelete={() => deleteItem(item.id)}
            isCreator={isCreator}
          />
        );
      case "challenge":
        return (
          <ChallengeCard
            content={content}
            itemId={item.id}
            currentUserId={user?.id}
            onDelete={() => deleteItem(item.id)}
            isCreator={isCreator}
          />
        );
      case "game_tictactoe":
        return (
          <TicTacToe
            content={content}
            createdBy={item.created_by}
            currentUserId={user?.id}
            onUpdate={(state, turn, winner, winningLine) => {
              const currentContent = content as any;
              let updatedContent = { ...currentContent };
              
              // Assign playerO on first O move
              if (!currentContent.playerO && state.includes('O')) {
                updatedContent.playerO = user?.id;
              }
              
              updatedContent = {
                ...updatedContent,
                state,
                turn,
                winner,
                winningLine,
              };
              
              updateItem(item.id, { content: updatedContent as any });
            }}
            onDelete={() => deleteItem(item.id)}
          />
        );
      case "announcement":
        return (
          <AnnouncementBubble
            content={content}
            onDelete={() => deleteItem(item.id)}
            creatorAvatar={itemWithCreator.creator_profile?.avatar_url}
            creatorUsername={itemWithCreator.creator_profile?.username}
          />
        );
      default:
        return null;
    }
  };

  const handleAddNote = () => {
    if (!noteTitle.trim()) {
      notify("Please enter a title", "error");
      return;
    }
    createItem("note", { title: noteTitle, body: noteBody, color: noteColor });
    setNoteTitle("");
    setNoteBody("");
    setNoteColor("yellow");
    setNoteDialog(false);
  };

  const handleImageUpload = async () => {
    if (!imageFile) return "";

    try {
      setUploading(true);
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${circleId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("wall-images")
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("wall-images")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      notify(error.message, "error");
      return "";
    } finally {
      setUploading(false);
    }
  };

  const handleAddImage = async () => {
    let finalUrl = imageUrl;

    if (imageFile) {
      finalUrl = await handleImageUpload();
      if (!finalUrl) return;
    }

    if (!finalUrl.trim()) {
      notify("Please enter an image URL or upload a file", "error");
      return;
    }
    
    createItem("image", { url: finalUrl, caption: imageCaption });
    setImageUrl("");
    setImageCaption("");
    setImageFile(null);
    setImageDialog(false);
    setShowCamera(false);
  };

  const handleAddThread = async () => {
    if (!threadTitle.trim()) {
      notify("Please enter a thread title", "error");
      return;
    }

    try {
      // Create the chat thread first
      const { data: threadData, error: threadError } = await supabase
        .from("chat_threads")
        .insert({
          circle_id: circleId!,
          created_by: user!.id,
          title: threadTitle,
        })
        .select()
        .single();

      if (threadError) throw threadError;

      // Add the creator as a thread member
      const { error: memberError } = await supabase
        .from("thread_members")
        .insert({
          thread_id: threadData.id,
          user_id: user!.id,
        });

      if (memberError) throw memberError;

      // Create the wall item with the thread ID
      const position = getSmartPosition();
      const { data: wallItem, error: wallError } = await supabase
        .from("wall_items")
        .insert({
          circle_id: circleId!,
          created_by: user!.id,
          type: "thread",
          content: { title: threadTitle, threadId: threadData.id },
          x: position.x,
          y: position.y,
          z_index: maxZIndex + 1,
        })
        .select()
        .single();

      if (wallError) throw wallError;

      // Link the thread to the wall item
      await supabase
        .from("chat_threads")
        .update({ linked_wall_item_id: wallItem.id })
        .eq("id", threadData.id);

      setMaxZIndex(prev => prev + 1);
      notify("Thread added!", "success");
      setThreadTitle("");
      setThreadDialog(false);
    } catch (error: any) {
      notify(error.message, "error");
    }
  };

  const handleAddAnnouncement = () => {
    if (!announcementText.trim()) {
      notify("Please enter announcement text", "error");
      return;
    }
    createItem("announcement", { text: announcementText });
    setAnnouncementText("");
    setAnnouncementDialog(false);
  };

  const handleAddGame = (gameType: string) => {
    if (gameType === "tictactoe") {
      createItem("game_tictactoe", {
        state: Array(9).fill(""),
        turn: "X",
        winner: null,
        winningLine: null,
        playerX: user?.id,
        playerO: null,
      });
    }
  };

  const handleCreatePoll = (question: string, options: string[]) => {
    createItem("poll", {
      question,
      options: options.map((text, i) => ({
        id: `option-${i}`,
        text,
        votes: [],
      })),
    });
  };

  const handleCreateAudio = async (audioBlob: Blob, duration: number, caption: string) => {
    try {
      setUploading(true);
      const fileName = `${Math.random().toString(36).substring(2)}.webm`;
      const filePath = `${circleId}/${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("wall-audio")
        .upload(filePath, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("wall-audio")
        .getPublicUrl(filePath);

      createItem("audio", { audioUrl: publicUrl, duration, caption });
      notify("Audio posted!", "success");
    } catch (error: any) {
      notify(error.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateDoodle = async (imageBlob: Blob) => {
    try {
      setUploading(true);
      const fileName = `${Math.random().toString(36).substring(2)}.png`;
      const filePath = `${circleId}/${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("wall-doodles")
        .upload(filePath, imageBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("wall-doodles")
        .getPublicUrl(filePath);

      createItem("doodle", { imageUrl: publicUrl });
      // Notification is already shown in createItem function, so removed duplicate here
    } catch (error: any) {
      notify(error.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateMusic = (songTitle: string, artist: string, musicUrl: string, albumArt?: string) => {
    const content: any = { songTitle, artist };
    
    if (musicUrl.includes("spotify.com")) {
      content.spotifyUrl = musicUrl;
    } else if (musicUrl.includes("youtube.com") || musicUrl.includes("youtu.be")) {
      content.youtubeUrl = musicUrl;
    } else if (musicUrl.includes("apple.com")) {
      content.appleUrl = musicUrl;
    }

    if (albumArt) {
      content.albumArt = albumArt;
    }

    createItem("music", content);
  };

  const handleCreateChallenge = (prompt: string, category: "photo" | "text" | "activity") => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    createItem("challenge", {
      prompt,
      category,
      responses: [],
      expiresAt: expiresAt.toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation circleId={circleId} />

      <div className={`${isMobile ? 'px-4 pt-4 pb-24' : 'pl-24 pr-8 pt-8'}`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">The Wall</h1>
          <div className="flex gap-3 items-center">
            <NotificationCenter />
            <div className="flex gap-2">
              <Button
                variant={viewMode === "wall" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("wall")}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Wall
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>
          </div>
        </div>

        {viewMode === "wall" && isMobile ? (
          <div className="space-y-4 pb-24 flex flex-col items-center max-h-[calc(100vh-200px)] overflow-y-auto overflow-x-hidden">
            {items.map((item) => {
              const itemWithCreator = item as any;
              return (
                <div key={item.id} className="w-full max-w-full">
                  {item.type === "note" && (
                    <StickyNote
                      content={item.content as any}
                      onDelete={() => deleteItem(item.id)}
                      onUpdate={(newContent) => {
                        const updated: Partial<Omit<WallItem, "circle_id" | "created_at" | "created_by" | "id">> = {
                          content: newContent,
                        };
                        updateItem(item.id, updated);
                      }}
                      isCreator={item.created_by === user?.id}
                      creatorAvatar={itemWithCreator.creator_profile?.avatar_url}
                      creatorUsername={itemWithCreator.creator_profile?.username}
                      hideAvatar={true}
                      fullWidth={true}
                    />
                  )}
                  {item.type === "image" && (
                    <ImageCard
                      id={item.id}
                      content={item.content as any}
                      onDelete={() => deleteItem(item.id)}
                      creatorAvatar={itemWithCreator.creator_profile?.avatar_url}
                      creatorUsername={itemWithCreator.creator_profile?.username}
                      hideAvatar={true}
                      fullWidth={true}
                      currentUserId={user?.id}
                    />
                  )}
                  {item.type === "thread" && (
                    <ThreadBubble
                      content={item.content as any}
                      onDelete={() => handleThreadDelete(item.id, (item.content as any).threadId)}
                      onClick={() => navigate(`/circle/${circleId}/chat?threadId=${(item.content as any).threadId}`)}
                      hideAvatar={true}
                      fullWidth={true}
                    />
                  )}
                  {item.type === "game_tictactoe" && (
                    <TicTacToe 
                      content={item.content as any}
                      createdBy={item.created_by}
                      currentUserId={user?.id}
                      onUpdate={(state, turn, winner, winningLine) => {
                        const currentContent = item.content as any;
                        let updatedContent = { ...currentContent };
                        
                        // Assign playerO on first O move
                        if (!currentContent.playerO && state.includes('O')) {
                          updatedContent.playerO = user?.id;
                        }
                        
                        updatedContent = {
                          ...updatedContent,
                          state,
                          turn,
                          winner,
                          winningLine,
                        };
                        
                        updateItem(item.id, { content: updatedContent as any });
                      }}
                      onDelete={() => deleteItem(item.id)} 
                    />
                  )}
                  {item.type === "announcement" && (
                    <AnnouncementBubble
                      content={item.content as any}
                      onDelete={() => deleteItem(item.id)}
                      creatorAvatar={itemWithCreator.creator_profile?.avatar_url}
                      creatorUsername={itemWithCreator.creator_profile?.username}
                      hideAvatar={true}
                      fullWidth={true}
                    />
                  )}
                  {item.type === "poll" && (
                    <QuickPoll
                      content={item.content as any}
                      itemId={item.id}
                      currentUserId={user?.id}
                      onDelete={() => deleteItem(item.id)}
                      isCreator={item.created_by === user?.id}
                      fullWidth={true}
                    />
                  )}
                  {item.type === "audio" && (
                    <AudioClip 
                      content={item.content as any}
                      onDelete={() => deleteItem(item.id)}
                      isCreator={item.created_by === user?.id}
                      fullWidth={true}
                    />
                  )}
                  {item.type === "doodle" && (
                    <DoodleCanvas 
                      content={item.content as any}
                      onDelete={() => deleteItem(item.id)}
                      isCreator={item.created_by === user?.id}
                      fullWidth={true}
                    />
                  )}
                  {item.type === "music" && (
                    <MusicDrop 
                      content={item.content as any}
                      onDelete={() => deleteItem(item.id)}
                      isCreator={item.created_by === user?.id}
                      fullWidth={true}
                    />
                  )}
                  {item.type === "challenge" && (
                    <ChallengeCard
                      content={item.content as any}
                      itemId={item.id}
                      currentUserId={user?.id}
                      onDelete={() => deleteItem(item.id)}
                      isCreator={item.created_by === user?.id}
                      fullWidth={true}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : viewMode === "wall" ? (
          // Desktop canvas view
          <div
            ref={canvasRef}
            className="relative w-full max-w-full bg-gradient-to-br from-background to-muted/20 rounded-lg border border-border overflow-hidden pb-20"
            style={{
              height: canvasHeight,
              backgroundImage: `
                linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {items.map((item) => (
              <div
                key={item.id}
                data-item-id={item.id}
                className="absolute cursor-move select-none"
                style={{
                  left: item.x,
                  top: item.y,
                  zIndex: item.z_index,
                }}
                onMouseDown={(e) => {
                  // Don't start dragging if clicking on interactive elements
                  const target = e.target as HTMLElement;
                  if (
                    target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.tagName === 'BUTTON' ||
                    target.closest('input') ||
                    target.closest('textarea') ||
                    target.closest('button')
                  ) {
                    return;
                  }
                  handleMouseDown(e, item.id);
                }}
              >
                {renderItem(item)}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              return (
                <div
                  key={item.id}
                  className="p-4 bg-card border border-border rounded-lg flex items-center gap-4 hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    setViewMode("wall");
                    if (isMobile) {
                      // On mobile, switch to wall view and scroll to item in the vertical list
                      setTimeout(() => {
                        const el = document.querySelector(`[data-item-id="${item.id}"]`);
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "center" });
                        }
                      }, 100);
                    } else {
                      // Desktop: switch to wall and highlight
                      setTimeout(() => {
                        const el = document.querySelector(`[data-item-id="${item.id}"]`);
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "center" });
                          el.classList.add('ring-4', 'ring-primary', 'ring-offset-2');
                          setTimeout(() => {
                            el.classList.remove('ring-4', 'ring-primary', 'ring-offset-2');
                          }, 2000);
                        }
                      }, 100);
                    }
                  }}
                >
                  <span className="text-2xl">{getItemIcon(item.type)}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {getItemDisplayTitle(item)}
                    </h3>
                    <p className="text-sm text-muted-foreground capitalize">{item.type.replace(/_/g, ' ')}</p>
                  </div>
                  {!isMobile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewMode("wall");
                        setTimeout(() => {
                          const el = document.querySelector(`[data-item-id="${item.id}"]`);
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "center" });
                            el.classList.add('ring-4', 'ring-primary', 'ring-offset-2');
                            setTimeout(() => {
                              el.classList.remove('ring-4', 'ring-primary', 'ring-offset-2');
                            }, 2000);
                          }
                        }, 100);
                      }}
                    >
                      View
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddItemMenu
        onAddNote={() => setNoteDialog(true)}
        onAddImage={() => setImageDialog(true)}
        onAddThread={() => setThreadDialog(true)}
        onAddGame={handleAddGame}
        onAddAnnouncement={() => setAnnouncementDialog(true)}
        onAddPoll={() => setPollDialog(true)}
        onAddAudio={() => setAudioDialog(true)}
        onAddDoodle={() => setDoodleDialog(true)}
        onAddMusic={() => setMusicDialog(true)}
        onAddChallenge={() => setChallengeDialog(true)}
      />

      {/* Note Dialog */}
      <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create Sticky Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note title"
              />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Note content"
                rows={4}
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNoteColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      noteColor === color ? "border-foreground scale-110" : "border-transparent"
                    } bg-note-${color} transition-all`}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleAddNote} className="w-full">
              Add Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialog} onOpenChange={(open) => {
        setImageDialog(open);
        if (!open) setShowCamera(false);
      }}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
          </DialogHeader>
          {showCamera ? (
            <CameraCapture
              onCapture={(file) => {
                setCapturedPhoto(file);
                setPhotoPreview(URL.createObjectURL(file));
                setShowCamera(false);
              }}
              onClose={() => {
                setShowCamera(false);
                setImageDialog(false);
              }}
            />
          ) : capturedPhoto && photoPreview ? (
            <div className="space-y-4">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full rounded-lg object-contain max-h-96"
              />
              
              <div>
                <Label htmlFor="photo-caption">Caption (optional)</Label>
                <Input
                  id="photo-caption"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Add a caption..."
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCapturedPhoto(null);
                    setPhotoPreview("");
                    setImageCaption("");
                    setShowCamera(true);
                  }}
                  disabled={uploading}
                >
                  Retake
                </Button>
                <Button
                  onClick={async () => {
                    if (!capturedPhoto) return;
                    
                    setUploading(true);
                    const fileExt = capturedPhoto.name.split(".").pop();
                    const filePath = `${user!.id}/${circleId}_${Date.now()}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                      .from("avatars")
                      .upload(filePath, capturedPhoto);

                    if (uploadError) {
                      notify(uploadError.message, "error");
                      setUploading(false);
                      return;
                    }

                    const {
                      data: { publicUrl },
                    } = supabase.storage.from("avatars").getPublicUrl(filePath);

                    createItem("image", { url: publicUrl, caption: imageCaption });
                    
                    setCapturedPhoto(null);
                    setPhotoPreview("");
                    setImageCaption("");
                    setImageDialog(false);
                    setUploading(false);
                  }}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload Photo"}
                </Button>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="camera">
                  <Camera className="w-4 h-4 mr-2" />
                  Camera
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="url" className="space-y-4">
                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div>
                  <Label htmlFor="imageCaption">Caption (optional)</Label>
                  <Input
                    id="imageCaption"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="Add a caption..."
                  />
                </div>
                <Button onClick={handleAddImage} className="w-full" disabled={!imageUrl}>
                  Add Image
                </Button>
              </TabsContent>
              
              <TabsContent value="upload" className="space-y-4">
                <div>
                  <Label htmlFor="imageFile">Select Image</Label>
                  <Input
                    id="imageFile"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        setImageUrl("");
                      }
                    }}
                  />
                  {imageFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {imageFile.name}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="uploadCaption">Caption (optional)</Label>
                  <Input
                    id="uploadCaption"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="Add a caption..."
                  />
                </div>
                <Button onClick={handleAddImage} className="w-full" disabled={!imageFile || uploading}>
                  {uploading ? "Uploading..." : "Upload Image"}
                </Button>
              </TabsContent>
              
              <TabsContent value="camera" className="space-y-4">
                <div className="text-center py-8">
                  <Button
                    onClick={() => setShowCamera(true)}
                    size="lg"
                    className="w-full"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Open Camera
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Thread Dialog */}
      <Dialog open={threadDialog} onOpenChange={setThreadDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create Thread Bubble</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Thread Title</Label>
              <Input
                value={threadTitle}
                onChange={(e) => setThreadTitle(e.target.value)}
                placeholder="What's this thread about?"
              />
            </div>
            <Button onClick={handleAddThread} className="w-full">
              Create Thread
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Announcement Dialog */}
      <Dialog open={announcementDialog} onOpenChange={setAnnouncementDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Announcement Text</Label>
              <Textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="What do you want to announce?"
                rows={4}
                maxLength={280}
              />
              <p className="text-sm text-muted-foreground text-right mt-1">
                {announcementText.length}/280 characters
              </p>
            </div>
            <Button onClick={handleAddAnnouncement} className="w-full">
              Create Announcement
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Thread Deletion Dialog */}
      <AlertDialog open={deleteThreadDialog} onOpenChange={setDeleteThreadDialog}>
        <AlertDialogContent className="z-[10000]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thread?</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to delete this thread from the wall only and keep it in chat conversations?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteThreadDialog(false);
              setConfirmDeleteDialog(true);
            }}>
              No
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleMoveToChat}>
              Yes, Move to Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Complete Deletion Dialog */}
      <AlertDialog open={confirmDeleteDialog} onOpenChange={setConfirmDeleteDialog}>
        <AlertDialogContent className="z-[10000]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Removing this will delete all history of this chat. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setConfirmDeleteDialog(false);
              setThreadToDelete(null);
            }}>
              Never mind
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCompletely} className="bg-destructive hover:bg-destructive/90">
              Delete Completely
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Feature Dialogs */}
      <CreatePollDialog
        open={pollDialog}
        onOpenChange={setPollDialog}
        onCreate={handleCreatePoll}
      />

      <CreateAudioDialog
        open={audioDialog}
        onOpenChange={setAudioDialog}
        onCreate={handleCreateAudio}
      />

      <CreateDoodleDialog
        open={doodleDialog}
        onOpenChange={setDoodleDialog}
        onCreate={handleCreateDoodle}
      />

      <CreateMusicDialog
        open={musicDialog}
        onOpenChange={setMusicDialog}
        onCreate={handleCreateMusic}
      />

      <CreateChallengeDialog
        open={challengeDialog}
        onOpenChange={setChallengeDialog}
        onCreate={handleCreateChallenge}
      />
    </div>
  );
};

export default Wall;
