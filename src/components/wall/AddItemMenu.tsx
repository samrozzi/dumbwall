import { useState } from "react";
import { Plus, StickyNote, ImageIcon, MessageSquare, Gamepad2, Grid3x3, Megaphone, ArrowLeft } from "lucide-react";
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
  const [showSubmenu, setShowSubmenu] = useState(false);

  const menuItems = [
    { icon: StickyNote, label: "Note", color: "bg-yellow-400 hover:bg-yellow-500", action: () => { onAddNote(); setIsOpen(false); } },
    { icon: ImageIcon, label: "Image", color: "bg-blue-400 hover:bg-blue-500", action: () => { onAddImage(); setIsOpen(false); } },
    { icon: MessageSquare, label: "Thread", color: "bg-purple-400 hover:bg-purple-500", action: () => { onAddThread(); setIsOpen(false); } },
    { icon: Gamepad2, label: "Games", color: "bg-green-400 hover:bg-green-500", action: () => { setShowSubmenu(true); } },
    { icon: Megaphone, label: "Announcement", color: "bg-red-400 hover:bg-red-500", action: () => { onAddAnnouncement(); setIsOpen(false); } },
  ];

  const gameOptions = [
    { icon: Grid3x3, label: "Tic Tac Toe", action: () => { onAddGame("tictactoe"); setShowSubmenu(false); setIsOpen(false); } },
  ];

  const handleBack = () => {
    setShowSubmenu(false);
  };

  return (
    <TooltipProvider>
      <div className="fixed bottom-8 right-8 z-[9999]">
        {/* Menu Items */}
        {isOpen && !showSubmenu && (
          <div className="absolute bottom-20 right-1/2 translate-x-1/2 flex flex-col-reverse gap-3 items-center">
            {menuItems.map((item, index) => (
              <TooltipProvider key={item.label}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={item.action}
                      className={`${item.color} text-white w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-all duration-150 ease-in-out flex items-center justify-center animate-in fade-in slide-in-from-bottom-3`}
                      style={{
                        animationDelay: `${index * 25}ms`,
                        animationFillMode: 'backwards'
                      }}
                    >
                      <item.icon className="w-6 h-6" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}

        {/* Games Submenu */}
        {isOpen && showSubmenu && (
          <div className="absolute bottom-20 right-1/2 translate-x-1/2 flex flex-col-reverse gap-3 items-center">
            {/* Back Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleBack}
                    className="bg-gray-400 hover:bg-gray-500 text-white w-12 h-12 rounded-full shadow-lg hover:scale-110 transition-all duration-150 ease-in-out flex items-center justify-center animate-in fade-in slide-in-from-bottom-3"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Back</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Game Options */}
            {gameOptions.map((game, index) => (
              <TooltipProvider key={game.label}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={game.action}
                      className="bg-green-300 hover:bg-green-400 text-white w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-all duration-150 ease-in-out flex items-center justify-center animate-in fade-in slide-in-from-bottom-3"
                      style={{
                        animationDelay: `${(index + 1) * 25}ms`,
                        animationFillMode: 'backwards'
                      }}
                    >
                      <game.icon className="w-6 h-6" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>{game.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}

            {/* Games Header */}
            <div className="bg-green-400 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center animate-in fade-in slide-in-from-bottom-3">
              <Gamepad2 className="w-6 h-6" />
            </div>
          </div>
        )}

        {/* Main Toggle Button */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setShowSubmenu(false);
          }}
          className={`bg-primary hover:bg-primary/90 text-primary-foreground p-5 rounded-full shadow-2xl transition-all duration-150 ease-in-out hover:scale-110 ${
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
