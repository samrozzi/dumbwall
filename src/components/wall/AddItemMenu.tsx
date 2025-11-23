import { useState } from "react";
import { Plus, StickyNote, Image, MessageCircle, Gamepad2, Megaphone } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AddItemMenuProps {
  onAddNote: () => void;
  onAddImage: () => void;
  onAddThread: () => void;
  onAddGame: (gameType: string) => void;
  onAddAnnouncement: () => void;
}

const AddItemMenu = ({ onAddNote, onAddImage, onAddThread, onAddGame, onAddAnnouncement }: AddItemMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const menuItems = [
    { icon: StickyNote, label: "Note", onClick: onAddNote, color: "bg-yellow-500 hover:bg-yellow-600" },
    { icon: Image, label: "Image", onClick: onAddImage, color: "bg-blue-500 hover:bg-blue-600" },
    { icon: MessageCircle, label: "Thread", onClick: onAddThread, color: "bg-purple-500 hover:bg-purple-600" },
    { icon: Megaphone, label: "Announcement", onClick: onAddAnnouncement, color: "bg-pink-500 hover:bg-pink-600" },
    { 
      icon: Gamepad2, 
      label: "Games", 
      onClick: () => setActiveCategory(activeCategory === "Games" ? null : "Games"), 
      color: "bg-green-500 hover:bg-green-600",
      isSubmenu: true
    },
  ];

  const gameItems = [
    { label: "Tic-Tac-Toe", onClick: () => onAddGame("tictactoe") },
  ];

  const activeCategoryItem = activeCategory ? menuItems.find(item => item.label === activeCategory) : null;
  const otherItems = activeCategory ? menuItems.filter(item => item.label !== activeCategory) : menuItems;

  return (
    <TooltipProvider>
      <div className="fixed bottom-8 right-8 z-40">
        {/* Menu Items */}
        {isOpen && (
          <div className="absolute bottom-20 right-0 flex flex-col gap-2 mb-2">
            {/* Active Category at Top (if any) */}
            {activeCategoryItem && (
              <div className="flex flex-col gap-2 animate-in slide-in-from-bottom duration-300">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => activeCategoryItem.onClick()}
                      className={`${activeCategoryItem.color} text-white w-12 h-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center`}
                    >
                      <activeCategoryItem.icon className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>{activeCategoryItem.label}</p>
                  </TooltipContent>
                </Tooltip>
                
                {/* Submenu Items */}
                {activeCategory === "Games" && (
                  <div className="flex flex-col gap-2 ml-2">
                    {gameItems.map((game, index) => (
                      <button
                        key={game.label}
                        onClick={() => {
                          game.onClick();
                          setActiveCategory(null);
                          setIsOpen(false);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-300 hover:scale-105 text-sm whitespace-nowrap animate-in slide-in-from-right"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {game.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Other Menu Items */}
            {otherItems.map((item, index) => (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      if (item.isSubmenu) {
                        item.onClick();
                      } else {
                        item.onClick();
                        setIsOpen(false);
                        setActiveCategory(null);
                      }
                    }}
                    className={`${item.color} text-white w-12 h-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center animate-in slide-in-from-bottom`}
                    style={{ animationDelay: `${(activeCategoryItem ? index + 1 : index) * 50}ms` }}
                  >
                    <item.icon className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}

        {/* Main Toggle Button */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setActiveCategory(null);
          }}
          className={`bg-primary hover:bg-primary/90 text-primary-foreground p-5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 ${
            isOpen ? "rotate-45" : "rotate-0"
          }`}
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>
    </TooltipProvider>
  );
};

export default AddItemMenu;
