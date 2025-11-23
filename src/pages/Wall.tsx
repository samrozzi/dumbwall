import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Database } from "@/integrations/supabase/types";
import Navigation from "@/components/Navigation";
import StickyNote from "@/components/wall/StickyNote";
import ImageCard from "@/components/wall/ImageCard";
import ThreadBubble from "@/components/wall/ThreadBubble";
import TicTacToe from "@/components/wall/TicTacToe";
import AddItemMenu from "@/components/wall/AddItemMenu";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type WallItemType = Database["public"]["Enums"]["wall_item_type"];
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
  
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteColor, setNoteColor] = useState("yellow");
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [threadTitle, setThreadTitle] = useState("");

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

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from("wall_items")
        .select("*")
        .eq("circle_id", circleId)
        .order("z_index", { ascending: true });

      if (error) throw error;
      setItems(data || []);
      const maxZ = Math.max(...(data || []).map((item) => item.z_index), 0);
      setMaxZIndex(maxZ);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const createItem = async (type: WallItemType, content: any, x: number = 300, y: number = 300) => {
    try {
      const { error } = await supabase.from("wall_items").insert({
        circle_id: circleId!,
        created_by: user?.id!,
        type,
        content,
        x,
        y,
        z_index: maxZIndex + 1,
      });

      if (error) throw error;
      toast.success("Item added!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateItem = async (id: string, updates: Partial<Omit<WallItem, "id" | "circle_id" | "created_by" | "created_at">>) => {
    try {
      const { error } = await supabase
        .from("wall_items")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from("wall_items").delete().eq("id", id);
      if (error) throw error;
      toast.success("Item deleted");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
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
    if (!draggedItem) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    setItems((prev) =>
      prev.map((item) =>
        item.id === draggedItem ? { ...item, x: newX, y: newY } : item
      )
    );
  };

  const handleMouseUp = () => {
    if (!draggedItem) return;

    const item = items.find((i) => i.id === draggedItem);
    if (!item) return;

    const snappedX = Math.round(item.x / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(item.y / GRID_SIZE) * GRID_SIZE;

    updateItem(draggedItem, { x: snappedX, y: snappedY });
    setDraggedItem(null);
  };

  const renderItem = (item: WallItem) => {
    const content = item.content as any;
    
    switch (item.type) {
      case "note":
        return (
          <StickyNote
            content={content}
            onDelete={() => deleteItem(item.id)}
          />
        );
      case "image":
        return (
          <ImageCard
            content={content}
            onDelete={() => deleteItem(item.id)}
          />
        );
      case "thread":
        return (
          <ThreadBubble
            content={content}
            onDelete={() => deleteItem(item.id)}
          />
        );
      case "game_tictactoe":
        return (
          <TicTacToe
            content={content}
            onUpdate={(state, turn) =>
              updateItem(item.id, {
                content: { state, turn } as any,
              })
            }
            onDelete={() => deleteItem(item.id)}
          />
        );
      default:
        return null;
    }
  };

  const handleAddNote = () => {
    if (!noteTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }
    createItem("note", { title: noteTitle, body: noteBody, color: noteColor });
    setNoteTitle("");
    setNoteBody("");
    setNoteColor("yellow");
    setNoteDialog(false);
  };

  const handleAddImage = () => {
    if (!imageUrl.trim()) {
      toast.error("Please enter an image URL");
      return;
    }
    createItem("image", { url: imageUrl, caption: imageCaption });
    setImageUrl("");
    setImageCaption("");
    setImageDialog(false);
  };

  const handleAddThread = () => {
    if (!threadTitle.trim()) {
      toast.error("Please enter a thread title");
      return;
    }
    createItem("thread", { title: threadTitle });
    setThreadTitle("");
    setThreadDialog(false);
  };

  const handleAddGame = () => {
    createItem("game_tictactoe", {
      state: Array(9).fill(""),
      turn: "X",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation circleId={circleId} />

      <div className="pl-24 pr-8 pt-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">The Wall</h1>
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

        {viewMode === "wall" ? (
          <div
            ref={canvasRef}
            className="relative w-full min-h-[calc(100vh-120px)] bg-gradient-to-br from-background to-muted/20 rounded-lg border border-border overflow-hidden"
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
                className="absolute cursor-move"
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
      <Dialog open={imageDialog} onOpenChange={setImageDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Image URL</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Caption (optional)</Label>
              <Input
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Add a caption"
              />
            </div>
            <Button onClick={handleAddImage} className="w-full">
              Add Image
            </Button>
          </div>
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
    </div>
  );
};

export default Wall;
