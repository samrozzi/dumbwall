import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Database } from "@/integrations/supabase/types";
import { z } from "zod";
import Navigation from "@/components/Navigation";
import { CircleHeader } from "@/components/CircleHeader";
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
import { WallItemViewerDialog } from "@/components/wall/WallItemViewerDialog";
import { AddMemberDialog } from "@/components/AddMemberDialog";
import { notify } from "@/components/ui/custom-notification";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LayoutGrid, List, Camera } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { format } from "date-fns";

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
  const { toast } = useToast();
  const [items, setItems] = useState<WallItem[]>([]);
  const [viewMode, setViewMode] = useState<"wall" | "list">("wall");
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [pendingDelete, setPendingDelete] = useState<{ id: string; item: WallItem } | null>(null);
  const [maxZIndex, setMaxZIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
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
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  
  // Wall item viewer dialog states
  const [viewerDialogOpen, setViewerDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WallItem | null>(null);
  
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

  // Desktop canvas height - fixed at viewport to enable scrolling
  const canvasHeight = useMemo(() => {
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight - 120 : 800;
    return viewportHeight + 'px';
  }, []);

  // Calculate content height for scroll detection
  const contentHeight = useMemo(() => {
    if (items.length === 0) return 0;
    // Find the bottommost item (y position + estimated height)
    const maxItemY = Math.max(...items.map(item => item.y + 400));
    return maxItemY + 100;
  }, [items]);

  // Check if wall content overflows vertically (for scroll indicator)
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    if (isMobile) return;

    const checkOverflow = () => {
      const viewportHeight = window.innerHeight - 120;
      const hasOverflow = contentHeight > viewportHeight;
      setShowScrollIndicator(hasOverflow && !hasScrolled);
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);

    return () => window.removeEventListener('resize', checkOverflow);
  }, [items, contentHeight, isMobile, hasScrolled]);

  // Show/hide scroll indicator based on scroll position
  useEffect(() => {
    if (!canvasRef.current || isMobile) return;

    const handleScroll = () => {
      if (canvasRef.current) {
        const scrollTop = canvasRef.current.scrollTop;
        if (scrollTop > 50) {
          setHasScrolled(true);
        } else {
          // Reappear when scrolled back to top
          setHasScrolled(false);
        }
      }
    };

    const canvas = canvasRef.current;
    canvas.addEventListener('scroll', handleScroll);

    return () => canvas.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

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
    if (!circleId || !user) return;

    const pos = x !== undefined && y !== undefined ? { x, y } : getSmartPosition();
    const newItem: Omit<WallItem, "id" | "created_at" | "updated_at"> = {
      type,
      content,
      circle_id: circleId,
      created_by: user.id,
      x: pos.x,
      y: pos.y,
      z_index: maxZIndex + 1,
    };

    const { error } = await supabase.from("wall_items").insert(newItem);

    if (error) {
      console.error("Error creating item:", error);
      toast({
        title: "Error",
        description: "Failed to create item",
        variant: "destructive",
      });
    } else {
      setMaxZIndex(maxZIndex + 1);
    }
  };

  const updateItem = async (
    id: string,
    updates: Partial<Omit<WallItem, "circle_id" | "created_at" | "created_by" | "id">>
  ) => {
    const { error } = await supabase
      .from("wall_items")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating item:", error);
    }
  };

  const deleteItem = async (id: string) => {
    const itemToDelete = items.find(item => item.id === id);
    if (!itemToDelete) return;

    // Store for potential undo
    setPendingDelete({ id, item: itemToDelete });

    // Show toast with undo option at top center
    toast({
      title: "Item deleted",
      description: "Undo to restore",
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => undoDelete()}
        >
          Undo
        </Button>
      ),
      className: "fixed top-4 left-1/2 -translate-x-1/2 z-[9999]",
    });

    // Perform actual deletion after 3 seconds
    setTimeout(async () => {
      setPendingDelete(current => {
        if (current?.id === id) {
          // Still pending, perform deletion
          supabase
            .from("wall_items")
            .delete()
            .eq("id", id)
            .then(({ error }) => {
              if (error) {
                console.error("Error deleting item:", error);
                toast({
                  title: "Error",
                  description: "Failed to delete item",
                  variant: "destructive",
                });
              }
            });
          return null;
        }
        return current;
      });
    }, 3000);
  };

  const undoDelete = () => {
    if (pendingDelete) {
      setPendingDelete(null);
      toast({
        title: "Deletion cancelled",
        description: "Item restored",
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault(); // Prevent text selection
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    setDraggedItem(itemId);
    setIsDragging(false); // Not dragging until threshold met
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (canvasRect) {
      setDragOffset({
        x: e.clientX - canvasRect.left - item.x,
        y: e.clientY - canvasRect.top - item.y,
      });
    }
    
    // Bring to front
    updateItem(itemId, { z_index: maxZIndex + 1 });
    setMaxZIndex(maxZIndex + 1);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedItem || !canvasRef.current) return;

    // Set dragging state once moved
    if (!isDragging) {
      setIsDragging(true);
    }

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(e.clientX - canvasRect.left - dragOffset.x, canvasRect.width - 280));
    const newY = Math.max(0, e.clientY - canvasRect.top - dragOffset.y);

    setItems(items.map(item =>
      item.id === draggedItem ? { ...item, x: newX, y: newY } : item
    ));
  };

  const handleMouseUp = () => {
    if (draggedItem && canvasRef.current) {
      const item = items.find(i => i.id === draggedItem);
      if (item) {
        updateItem(draggedItem, { x: item.x, y: item.y });
      }
    }
    setDraggedItem(null);
    setIsDragging(false);
  };

  const handleAddNote = () => {
    createItem("note", {
      title: noteTitle,
      body: noteBody,
      color: noteColor,
    });
    setNoteDialog(false);
    setNoteTitle("");
    setNoteBody("");
    setNoteColor("yellow");
  };

  const handleAddImage = async () => {
    if (imageFile) {
      setUploading(true);
      const fileExt = imageFile.name.split(".").pop();
      const filePath = `${user!.id}/${circleId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, imageFile);

      if (uploadError) {
        notify(uploadError.message, "error");
        setUploading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      createItem("image", { url: publicUrl, caption: imageCaption });
      setImageDialog(false);
      setImageFile(null);
      setImageUrl("");
      setImageCaption("");
      setUploading(false);
    } else if (imageUrl) {
      createItem("image", { url: imageUrl, caption: imageCaption });
      setImageDialog(false);
      setImageUrl("");
      setImageCaption("");
    }
  };

  const handleAddThread = async () => {
    const { data, error } = await supabase
      .from("chat_threads")
      .insert({
        title: threadTitle,
        circle_id: circleId!,
        created_by: user!.id,
      })
      .select()
      .single();

    if (error) {
      notify(error.message, "error");
      return;
    }

    createItem("thread", { title: threadTitle, threadId: data.id });
    setThreadDialog(false);
    setThreadTitle("");
  };

  const handleAddGame = () => {
    const initialState = Array(9).fill("");
    createItem("game_tictactoe", {
      state: initialState,
      turn: "X",
      playerX: user?.id,
      playerO: null,
    });
  };

  const handleAddAnnouncement = () => {
    createItem("announcement", { text: announcementText });
    setAnnouncementDialog(false);
    setAnnouncementText("");
  };

  const handleThreadDelete = (itemId: string, threadId: string) => {
    setThreadToDelete({ itemId, threadId });
    setDeleteThreadDialog(true);
  };

  const handleMoveToChat = async () => {
    if (!threadToDelete) return;
    
    const { error } = await supabase
      .from("wall_items")
      .delete()
      .eq("id", threadToDelete.itemId);

    if (error) {
      notify(error.message, "error");
    } else {
      notify("Thread moved to chat!", "success");
    }
    
    setDeleteThreadDialog(false);
    setThreadToDelete(null);
  };

  const handleDeleteCompletely = async () => {
    if (!threadToDelete) return;

    const { error: threadError } = await supabase
      .from("chat_threads")
      .delete()
      .eq("id", threadToDelete.threadId);

    if (threadError) {
      notify(threadError.message, "error");
      return;
    }

    const { error: itemError } = await supabase
      .from("wall_items")
      .delete()
      .eq("id", threadToDelete.itemId);

    if (itemError) {
      notify(itemError.message, "error");
    } else {
      notify("Thread deleted completely!", "success");
    }

    setConfirmDeleteDialog(false);
    setThreadToDelete(null);
  };

  const renderItem = (item: WallItem) => {
    const itemWithCreator = item as any;

    switch (item.type) {
      case "note":
        return (
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
          />
        );
      case "image":
        return (
          <ImageCard
            id={item.id}
            content={item.content as any}
            onDelete={() => deleteItem(item.id)}
            creatorAvatar={itemWithCreator.creator_profile?.avatar_url}
            creatorUsername={itemWithCreator.creator_profile?.username}
          />
        );
      case "thread":
        return (
          <ThreadBubble
            content={item.content as any}
            onDelete={() => {
              const threadId = (item.content as any).threadId;
              handleThreadDelete(item.id, threadId);
            }}
          />
        );
      case "game_tictactoe":
        return (
          <TicTacToe
            content={item.content as any}
            onDelete={() => deleteItem(item.id)}
            currentUserId={user?.id}
            onUpdate={(newState, newTurn, winner, winningLine) => {
              const updatedContent = {
                state: newState,
                turn: newTurn,
                winner,
                winningLine,
              };
              updateItem(item.id, { content: updatedContent });
            }}
          />
        );
      case "announcement":
        return (
          <AnnouncementBubble
            content={item.content as any}
            onDelete={() => deleteItem(item.id)}
            creatorAvatar={itemWithCreator.creator_profile?.avatar_url}
            creatorUsername={itemWithCreator.creator_profile?.username}
          />
        );
      case "poll":
        return (
          <QuickPoll
            content={item.content as any}
            itemId={item.id}
            currentUserId={user?.id}
            onDelete={() => deleteItem(item.id)}
            isCreator={item.created_by === user?.id}
          />
        );
      case "audio":
        return (
          <AudioClip
            content={item.content as any}
            onDelete={() => deleteItem(item.id)}
            isCreator={item.created_by === user?.id}
          />
        );
      case "doodle":
        return (
          <DoodleCanvas
            content={item.content as any}
            onDelete={() => deleteItem(item.id)}
            isCreator={item.created_by === user?.id}
          />
        );
      case "music":
        return (
          <MusicDrop
            content={item.content as any}
            onDelete={() => deleteItem(item.id)}
            isCreator={item.created_by === user?.id}
          />
        );
      case "challenge":
        return (
          <ChallengeCard
            content={item.content as any}
            itemId={item.id}
            currentUserId={user?.id}
            onDelete={() => deleteItem(item.id)}
            isCreator={item.created_by === user?.id}
          />
        );
      default:
        return null;
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
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <Navigation circleId={circleId} />

      <div className={`flex-1 flex flex-col ${isMobile ? 'px-2 pt-4' : 'pl-24 pr-8 pt-8'}`}>
        <CircleHeader
          circleId={circleId!}
          pageTitle="The Wall"
          onAddMember={() => setShowAddMemberDialog(true)}
          actions={
            <div className="flex gap-1">
              <Button
                variant={viewMode === "wall" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("wall")}
                className="px-2"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="px-2"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          }
        />

        {viewMode === "wall" && isMobile ? (
          <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
            <div className="flex flex-col gap-4 w-full px-4 py-2 pb-24">
              {items
                .filter(item => item.id !== pendingDelete?.id)
                .sort((a, b) => {
                  // Sort by desktop position: top-to-bottom (y), then left-to-right (x)
                  if (Math.abs(a.y - b.y) < 100) {
                    // If items are roughly on same row (within 100px), sort by x
                    return a.x - b.x;
                }
                // Otherwise sort by y (top to bottom)
                return a.y - b.y;
              })
              .map((item) => {
              const itemWithCreator = item as any;
              return (
                <div
                  key={item.id}
                  className="w-full flex justify-center"
                >
                  {item.type === "note" && (
                    <div className="w-full max-w-[min(320px,90vw)]">
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
                      />
                    </div>
                  )}
                  {item.type === "image" && (
                    <div className="w-full max-w-[min(420px,95vw)]">
                      <ImageCard
                        id={item.id}
                        content={item.content as any}
                        onDelete={() => deleteItem(item.id)}
                        creatorAvatar={itemWithCreator.creator_profile?.avatar_url}
                        creatorUsername={itemWithCreator.creator_profile?.username}
                        hideAvatar={true}
                        currentUserId={user?.id}
                      />
                    </div>
                  )}
                  {item.type === "thread" && (
                    <div className="w-full max-w-[min(360px,90vw)]">
                      <ThreadBubble
                        content={item.content as any}
                        onDelete={() => handleThreadDelete(item.id, (item.content as any).threadId)}
                        onClick={() => navigate(`/circle/${circleId}/chat?threadId=${(item.content as any).threadId}`)}
                        hideAvatar={true}
                      />
                    </div>
                  )}
                  {item.type === "game_tictactoe" && (
                    <div className="w-full max-w-[min(320px,90vw)]">
                      <TicTacToe
                      content={item.content as any}
                      createdBy={item.created_by}
                      currentUserId={user?.id}
                      onUpdate={(state, turn, winner, winningLine) => {
                        const currentContent = item.content as any;
                        let updatedContent = { ...currentContent };
                        
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
                    </div>
                  )}
                  {item.type === "announcement" && (
                    <div className="w-full max-w-[min(360px,90vw)]">
                      <AnnouncementBubble
                        content={item.content as any}
                        onDelete={() => deleteItem(item.id)}
                        creatorAvatar={itemWithCreator.creator_profile?.avatar_url}
                        creatorUsername={itemWithCreator.creator_profile?.username}
                        hideAvatar={true}
                      />
                    </div>
                  )}
                  {item.type === "poll" && (
                    <div className="w-full max-w-[min(360px,90vw)]">
                      <QuickPoll
                        content={item.content as any}
                        itemId={item.id}
                        currentUserId={user?.id}
                        onDelete={() => deleteItem(item.id)}
                        isCreator={item.created_by === user?.id}
                      />
                    </div>
                  )}
                  {item.type === "audio" && (
                    <div className="w-full max-w-[min(360px,90vw)]">
                      <AudioClip
                        content={item.content as any}
                        onDelete={() => deleteItem(item.id)}
                        isCreator={item.created_by === user?.id}
                      />
                    </div>
                  )}
                  {item.type === "doodle" && (
                    <div className="w-full max-w-[min(340px,90vw)]">
                      <DoodleCanvas
                        content={item.content as any}
                        onDelete={() => deleteItem(item.id)}
                        isCreator={item.created_by === user?.id}
                      />
                    </div>
                  )}
                  {item.type === "music" && (
                    <div className="w-full max-w-[min(360px,90vw)]">
                      <MusicDrop
                        content={item.content as any}
                        onDelete={() => deleteItem(item.id)}
                        isCreator={item.created_by === user?.id}
                      />
                    </div>
                  )}
                  {item.type === "challenge" && (
                    <div className="w-full max-w-[min(360px,90vw)]">
                      <ChallengeCard
                        content={item.content as any}
                        itemId={item.id}
                        currentUserId={user?.id}
                        onDelete={() => deleteItem(item.id)}
                        isCreator={item.created_by === user?.id}
                      />
                    </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : viewMode === "list" && isMobile ? (
          <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
            <div className="space-y-2 pb-24">
              {items.filter(item => item.id !== pendingDelete?.id).map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-card border border-border rounded-lg flex items-center gap-4 hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    setSelectedItem(item);
                    setViewerDialogOpen(true);
                  }}
                >
                  <span className="text-2xl">{getItemIcon(item.type)}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {getItemDisplayTitle(item)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(item.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : viewMode === "wall" ? (
          // Desktop canvas view
          <div
            ref={canvasRef}
            className="relative w-full max-w-full bg-gradient-to-br from-background to-muted/20 rounded-lg border border-border overflow-y-auto overflow-x-hidden"
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
            {/* Inner container with proper height for content */}
            <div
              className="relative w-full pb-20"
              style={{
                minHeight: '100%',
                height: contentHeight > 0 ? `${contentHeight}px` : '100%'
              }}
            >
              {/* Scroll indicator - neon style */}
              {showScrollIndicator && (
                <div
                  className="fixed bottom-8 left-8 z-[9999] pointer-events-none"
                  style={{
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }}
                >
                  <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)]">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      style={{
                        filter: 'drop-shadow(0 0 8px hsl(var(--primary)))'
                      }}
                    >
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span
                      className="text-sm text-primary font-bold whitespace-nowrap"
                      style={{
                        textShadow: '0 0 8px hsl(var(--primary))'
                      }}
                    >
                      More Below
                    </span>
                  </div>
                </div>
              )}
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
        </div>
        ) : (
          <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
            <div className="space-y-2 pb-24">
              {items.filter(item => item.id !== pendingDelete?.id).map((item) => {
                return (
                  <div
                    key={item.id}
                    className="p-4 bg-card border border-border rounded-lg flex items-center gap-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      setSelectedItem(item);
                      setViewerDialogOpen(true);
                    }}
                  >
                    <span className="text-2xl">{getItemIcon(item.type)}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {getItemDisplayTitle(item)}
                      </h3>
                      <p className="text-sm text-muted-foreground capitalize">{item.type.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
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

      <WallItemViewerDialog
        isOpen={viewerDialogOpen}
        onClose={() => {
          setViewerDialogOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onDelete={(id) => {
          deleteItem(id);
          setViewerDialogOpen(false);
          setSelectedItem(null);
        }}
        onUpdate={(id, content) => {
          const updated: Partial<Omit<WallItem, "circle_id" | "created_at" | "created_by" | "id">> = {
            content,
          };
          updateItem(id, updated);
        }}
        isCreator={selectedItem?.created_by === user?.id}
        creatorAvatar={(selectedItem as any)?.creator_profile?.avatar_url}
        creatorUsername={(selectedItem as any)?.creator_profile?.username}
      />

      <AddMemberDialog
        open={showAddMemberDialog}
        onOpenChange={setShowAddMemberDialog}
        circleId={circleId!}
        circleName="Circle"
        isOwner={true}
        invitePermission="anyone"
        onSuccess={() => {}}
      />
    </div>
  );
};

export default Wall;
