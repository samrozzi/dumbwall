import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, StickyNote, Image, MessageCircle, Grid3x3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddItemMenuProps {
  onAddNote: () => void;
  onAddImage: () => void;
  onAddThread: () => void;
  onAddGame: () => void;
}

const AddItemMenu = ({
  onAddNote,
  onAddImage,
  onAddThread,
  onAddGame,
}: AddItemMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: StickyNote, label: "Sticky Note", action: onAddNote, color: "bg-note-yellow" },
    { icon: Image, label: "Image", action: onAddImage, color: "bg-note-pink" },
    { icon: MessageCircle, label: "Thread", action: onAddThread, color: "bg-accent" },
    { icon: Grid3x3, label: "Tic-Tac-Toe", action: onAddGame, color: "bg-secondary" },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div
        className={cn(
          "flex flex-col-reverse gap-3 mb-3 transition-all duration-300",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-0"
        )}
      >
        {menuItems.map((item, index) => (
          <Button
            key={index}
            onClick={() => {
              item.action();
              setIsOpen(false);
            }}
            className={cn(
              "w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center",
              item.color,
              "hover:scale-110"
            )}
            style={{
              transitionDelay: `${index * 50}ms`,
            }}
          >
            <item.icon className="w-6 h-6" />
          </Button>
        ))}
      </div>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full shadow-2xl transition-all duration-300 bg-primary text-primary-foreground hover:bg-primary/90",
          isOpen && "rotate-45"
        )}
      >
        <Plus className="w-8 h-8" />
      </Button>
    </div>
  );
};

export default AddItemMenu;
