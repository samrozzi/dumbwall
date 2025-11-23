import { useState } from "react";
import { Plus, StickyNote, Image, MessageCircle, Gamepad2, Megaphone } from "lucide-react";

interface AddItemMenuProps {
  onAddNote: () => void;
  onAddImage: () => void;
  onAddThread: () => void;
  onAddGame: (gameType: string) => void;
  onAddAnnouncement: () => void;
}

const AddItemMenu = ({ onAddNote, onAddImage, onAddThread, onAddGame, onAddAnnouncement }: AddItemMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGamesOpen, setIsGamesOpen] = useState(false);

  const menuItems = [
    { icon: StickyNote, label: "Note", onClick: onAddNote, color: "bg-yellow-500 hover:bg-yellow-600" },
    { icon: Image, label: "Image", onClick: onAddImage, color: "bg-blue-500 hover:bg-blue-600" },
    { icon: MessageCircle, label: "Thread", onClick: onAddThread, color: "bg-purple-500 hover:bg-purple-600" },
    { icon: Megaphone, label: "Announcement", onClick: onAddAnnouncement, color: "bg-pink-500 hover:bg-pink-600" },
    { 
      icon: Gamepad2, 
      label: "Games", 
      onClick: () => setIsGamesOpen(!isGamesOpen), 
      color: "bg-green-500 hover:bg-green-600",
      isSubmenu: true
    },
  ];

  const gameItems = [
    { label: "Tic-Tac-Toe", onClick: () => onAddGame("tictactoe") },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-40">
      {/* Games Submenu */}
      {isGamesOpen && (
        <div className="absolute bottom-20 right-0 mb-2 flex flex-col gap-2">
          {gameItems.map((game, index) => (
            <button
              key={game.label}
              onClick={() => {
                game.onClick();
                setIsGamesOpen(false);
                setIsOpen(false);
              }}
              className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 whitespace-nowrap px-6 animate-in slide-in-from-right"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {game.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Menu Items */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 flex flex-col gap-3 mb-2">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={() => {
                if (!item.isSubmenu) {
                  item.onClick();
                  setIsOpen(false);
                  setIsGamesOpen(false);
                } else {
                  item.onClick();
                }
              }}
              className={`${item.color} text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center gap-2 animate-in slide-in-from-right`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <item.icon className="w-6 h-6" />
              <span className="font-medium pr-2">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Toggle Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setIsGamesOpen(false);
        }}
        className={`bg-primary hover:bg-primary/90 text-primary-foreground p-6 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 ${
          isOpen ? "rotate-45" : "rotate-0"
        }`}
      >
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
};

export default AddItemMenu;
