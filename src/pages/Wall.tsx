import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Database } from "@/integrations/supabase/types";
import Navigation from "@/components/Navigation";
import { NotificationCenter } from "@/components/NotificationCenter";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import StickyNote from "@/components/wall/StickyNote";
import ImageCard from "@/components/wall/ImageCard";
import ThreadBubble from "@/components/wall/ThreadBubble";
import TicTacToe from "@/components/wall/TicTacToe";
import AnnouncementBubble from "@/components/wall/AnnouncementBubble";
import AddItemMenu from "@/components/wall/AddItemMenu";
import CameraCapture from "@/components/wall/CameraCapture";
import { notify } from "@/components/ui/custom-notification";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Camera } from "lucide-react";
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

const Wall = () => {
  const { circleId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
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

  // Handle window resize to keep items in bounds
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || items.length === 0) return;
      
      const canvas = canvasRef.current;
      const canvasWidth = canvas.offsetWidth;
      const canvasHeight = canvas.offsetHeight;
      
      items.forEach(item => {
        // Estimate item dimensions (add padding for safety)
        const itemWidth = 280;
        const itemHeight = 280;
        const padding = 20;
        
        let newX = item.x;
        let newY = item.y;
        let needsUpdate = false;
        
        // Check if item is out of bounds
        if (item.x + itemWidth > canvasWidth) {
          newX = Math.max(0, canvasWidth - itemWidth - padding);
          needsUpdate = true;
        }
        
        if (item.y + itemHeight > canvasHeight) {
          newY = Math.max(0, canvasHeight - itemHeight - padding);
          needsUpdate = true;
        }
        
        // Update if position changed
        if (needsUpdate && (newX !== item.x || newY !== item.y)) {
          updateItem(item.id, { x: newX, y: newY });
        }
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
          creator_avatar_url: profile?.avatar_url,
          creator_username: profile?.username
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
    // Use actual canvas dimensions if available
    const canvasWidth = canvasRef.current?.offsetWidth || 1200;
    const canvasHeight = canvasRef.current?.offsetHeight || 800;
    const itemWidth = 280;
    const itemHeight = 280;
    const padding = 40;
    
    let x = 100;
    let y = 100;
    let attempts = 0;
    
    while (attempts < 10) {
      const hasOverlap = items.some(item => {
        const distX = Math.abs(item.x - x);
        const distY = Math.abs(item.y - y);
        return distX < 200 && distY < 200;
      });
      
      if (!hasOverlap) break;
      
      x += 80;
      y += 80;
      
      // Wrap to next row if exceeding canvas width
      if (x + itemWidth > canvasWidth - padding) {
        x = 100;
        y += 300;
      }
      
      attempts++;
    }
    
    // Ensure position is within bounds
    x = Math.min(x, canvasWidth - itemWidth - padding);
    y = Math.min(y, canvasHeight - itemHeight - padding);
    
    return { x, y };
  };

  const createItem = async (type: WallItemType, content: any, x?: number, y?: number) => {
    try {
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
      notify(error.message, "error");
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
    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvas.offsetHeight;
    
    // Estimate item dimensions
    const itemWidth = 280;
    const itemHeight = 280;
    const padding = 20;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Clamp to boundaries
    const maxX = canvasWidth - itemWidth - padding;
    const maxY = canvasHeight - itemHeight - padding;
    
    const clampedX = Math.max(0, Math.min(maxX, newX));
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
            creatorAvatar={itemWithCreator.creator_avatar_url}
            creatorUsername={itemWithCreator.creator_username}
          />
        );
      case "image":
        return (
          <ImageCard
            content={content}
            onDelete={() => deleteItem(item.id)}
            creatorAvatar={itemWithCreator.creator_avatar_url}
            creatorUsername={itemWithCreator.creator_username}
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
      case "game_tictactoe":
        return (
          <TicTacToe
            content={content}
            onUpdate={(state, turn, winner, winningLine) =>
              updateItem(item.id, {
                content: { state, turn, winner, winningLine } as any,
              })
            }
            onDelete={() => deleteItem(item.id)}
          />
        );
      case "announcement":
        return (
          <AnnouncementBubble
            content={content}
            onDelete={() => deleteItem(item.id)}
            creatorAvatar={itemWithCreator.creator_avatar_url}
            creatorUsername={itemWithCreator.creator_username}
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
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation circleId={circleId} />

      <div className="pl-24 pr-8 pt-8">
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

        {viewMode === "wall" ? (
          <div
            ref={canvasRef}
            className="relative w-full max-w-full min-h-[calc(100vh-120px)] bg-gradient-to-br from-background to-muted/20 rounded-lg border border-border overflow-hidden"
            style={{
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
                className="absolute cursor-move select-none"
                style={{
                  left: item.x,
                  top: item.y,
                  zIndex: item.z_index,
                }}
                onMouseDown={(e) => handleMouseDown(e, item.id)}
              >
                {renderItem(item)}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const content = item.content as any;
              return (
                <div
                  key={item.id}
                  className="p-4 bg-card border border-border rounded-lg flex items-center gap-4 hover:bg-muted/50 cursor-pointer"
                >
                  <span className="text-2xl">{item.type === "note" ? "📝" : item.type === "image" ? "🖼️" : item.type === "thread" ? "💬" : "🎮"}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {content?.title || "Untitled"}
                    </h3>
                    <p className="text-sm text-muted-foreground">{item.type}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                  onClick={() => {
                    setViewMode("wall");
                    setTimeout(() => {
                      const el = document.querySelector(`[style*="left: ${item.x}"]`);
                      el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 100);
                  }}
                  >
                    View
                  </Button>
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
              onCapture={async (file) => {
                setImageFile(file);
                setShowCamera(false);
                setUploading(true);
                
                // Automatically upload the captured photo
                const fileExt = file.name.split(".").pop();
                const fileName = `${user!.id}-${Date.now()}.${fileExt}`;
                const filePath = `${user!.id}/${circleId}_${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                  .from("avatars")
                  .upload(filePath, file, {
                    contentType: file.type,
                    upsert: false,
                  });

                if (uploadError) {
                  notify(uploadError.message, "error");
                  setUploading(false);
                  return;
                }

                const { data: { publicUrl } } = supabase.storage
                  .from("avatars")
                  .getPublicUrl(filePath);

                createItem("image", { url: publicUrl, caption: imageCaption });
                setImageUrl("");
                setImageCaption("");
                setImageFile(null);
                setImageDialog(false);
                setUploading(false);
              }}
              onClose={() => setShowCamera(false)}
            />
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
    </div>
  );
};

export default Wall;
