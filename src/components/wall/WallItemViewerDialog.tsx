import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Minus } from "lucide-react";
import StickyNote from "./StickyNote";
import ImageCard from "./ImageCard";
import ThreadBubble from "./ThreadBubble";
import TicTacToe from "./TicTacToe";
import AnnouncementBubble from "./AnnouncementBubble";
import { QuickPoll } from "./QuickPoll";
import { AudioClip } from "./AudioClip";
import { DoodleCanvas } from "./DoodleCanvas";
import { MusicDrop } from "./MusicDrop";
import { ChallengeCard } from "./ChallengeCard";

interface WallItem {
  id: string;
  type: string;
  content: any;
  created_by: string;
  x: number;
  y: number;
  z_index: number;
  created_at: string;
  updated_at: string;
  circle_id: string;
}

interface WallItemViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: WallItem | null;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, content: any) => void;
  isCreator: boolean;
  creatorAvatar?: string;
  creatorUsername?: string;
}

export const WallItemViewerDialog = ({
  isOpen,
  onClose,
  item,
  onDelete,
  onUpdate,
  isCreator,
  creatorAvatar,
  creatorUsername,
}: WallItemViewerDialogProps) => {
  if (!item) return null;

  const getItemTitle = () => {
    switch (item.type) {
      case "note":
        return "Sticky Note";
      case "image":
        return item.content.caption || "Image";
      case "thread":
        return item.content.title || "Thread";
      case "game_tictactoe":
        return "Tic Tac Toe";
      case "announcement":
        return "Announcement";
      case "poll":
        return item.content.question || "Poll";
      case "audio":
        return "Audio Clip";
      case "doodle":
        return "Doodle";
      case "music":
        return item.content.title || "Music Drop";
      case "challenge":
        return item.content.title || "Challenge";
      default:
        return "Wall Item";
    }
  };

  const renderItem = () => {
    switch (item.type) {
      case "note":
        return (
          <StickyNote
            content={item.content}
            onDelete={isCreator && onDelete ? () => onDelete(item.id) : undefined}
            onUpdate={(content) => onUpdate?.(item.id, content)}
            creatorAvatar={creatorAvatar}
            creatorUsername={creatorUsername}
          />
        );

      case "image":
        return (
          <ImageCard
            id={item.id}
            content={item.content}
            onDelete={isCreator && onDelete ? () => onDelete(item.id) : undefined}
            creatorAvatar={creatorAvatar}
            creatorUsername={creatorUsername}
          />
        );

      case "thread":
        return (
          <ThreadBubble
            content={item.content}
            onDelete={isCreator && onDelete ? () => onDelete(item.id) : undefined}
          />
        );

      case "game_tictactoe":
        return (
          <TicTacToe
            content={item.content}
            onDelete={isCreator && onDelete ? () => onDelete(item.id) : undefined}
            onUpdate={(newState, newTurn, winner, winningLine) => {
              const updatedContent = {
                state: newState,
                turn: newTurn,
                winner,
                winningLine,
              };
              onUpdate?.(item.id, updatedContent);
            }}
          />
        );

      case "announcement":
        return (
          <AnnouncementBubble
            content={item.content}
            onDelete={isCreator && onDelete ? () => onDelete(item.id) : undefined}
            creatorAvatar={creatorAvatar}
            creatorUsername={creatorUsername}
          />
        );

      case "poll":
        return (
          <QuickPoll
            content={item.content}
            itemId={item.id}
            onDelete={isCreator && onDelete ? () => onDelete(item.id) : undefined}
            isCreator={isCreator}
          />
        );

      case "audio":
        return (
          <AudioClip
            content={item.content}
            onDelete={isCreator && onDelete ? () => onDelete(item.id) : undefined}
            isCreator={isCreator}
          />
        );

      case "doodle":
        return (
          <DoodleCanvas
            content={item.content}
            onDelete={isCreator && onDelete ? () => onDelete(item.id) : undefined}
            isCreator={isCreator}
          />
        );

      case "music":
        return (
          <MusicDrop
            content={item.content}
            onDelete={isCreator && onDelete ? () => onDelete(item.id) : undefined}
            isCreator={isCreator}
          />
        );

      case "challenge":
        return (
          <ChallengeCard
            content={item.content}
            itemId={item.id}
            onDelete={isCreator && onDelete ? () => onDelete(item.id) : undefined}
            isCreator={isCreator}
          />
        );

      default:
        return <div className="text-muted-foreground">Unsupported item type</div>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 gap-0 bg-transparent border-none shadow-none max-w-fit max-h-[95vh] overflow-visible [&>button]:hidden">
        <DialogClose asChild>
          <button
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-[10002] rounded-full bg-yellow-500 hover:bg-yellow-600 text-black p-2 shadow-lg transition-all hover:scale-110"
            aria-label="Minimize"
          >
            <Minus className="h-4 w-4" />
          </button>
        </DialogClose>
        
        {renderItem()}
      </DialogContent>
    </Dialog>
  );
};
