import { useState, useEffect } from "react";
import { Plus, StickyNote, ImageIcon, MessageSquare, Gamepad2, Grid3x3, Megaphone, ArrowLeft, BarChart3, Mic, Music, Zap, FileText, Pencil } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

interface AddItemMenuProps {
  onAddNote: () => void;
  onAddImage: () => void;
  onAddThread: () => void;
  onAddGame: (gameType: string) => void;
  onAddAnnouncement: () => void;
  onAddPoll: () => void;
  onAddAudio: () => void;
  onAddDoodle: () => void;
  onAddMusic: () => void;
  onAddChallenge: () => void;
}

const AddItemMenu = ({ onAddNote, onAddImage, onAddThread, onAddGame, onAddAnnouncement, onAddPoll, onAddAudio, onAddDoodle, onAddMusic, onAddChallenge }: AddItemMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [showPostSubmenu, setShowPostSubmenu] = useState(false);
  const [showImageSubmenu, setShowImageSubmenu] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const isMobile = useIsMobile();

  // Scroll hide/show behavior
  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false); // Scrolling down
      } else {
        setIsVisible(true); // Scrolling up
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, lastScrollY]);

  const menuItems = [
    { icon: FileText, label: "Post", color: "bg-yellow-400 hover:bg-yellow-500", action: () => { setShowPostSubmenu(true); } },
    { icon: ImageIcon, label: "Image/Doodle", color: "bg-blue-400 hover:bg-blue-500", action: () => { setShowImageSubmenu(true); } },
    { icon: BarChart3, label: "Poll", color: "bg-pink-400 hover:bg-pink-500", action: () => { onAddPoll(); setIsOpen(false); } },
    { icon: Mic, label: "Audio", color: "bg-orange-400 hover:bg-orange-500", action: () => { onAddAudio(); setIsOpen(false); } },
    { icon: Music, label: "Music", color: "bg-indigo-400 hover:bg-indigo-500", action: () => { onAddMusic(); setIsOpen(false); } },
    { icon: Zap, label: "Challenge", color: "bg-rose-400 hover:bg-rose-500", action: () => { onAddChallenge(); setIsOpen(false); } },
    { icon: Gamepad2, label: "Games", color: "bg-green-400 hover:bg-green-500", action: () => { setShowSubmenu(true); } },
  ];

  const postOptions = [
    { icon: StickyNote, label: "Sticky Note", color: "bg-yellow-400 hover:bg-yellow-500", action: () => { onAddNote(); setShowPostSubmenu(false); setIsOpen(false); } },
    { icon: Megaphone, label: "Announcement", color: "bg-red-400 hover:bg-red-500", action: () => { onAddAnnouncement(); setShowPostSubmenu(false); setIsOpen(false); } },
    { icon: MessageSquare, label: "Start Thread", color: "bg-purple-400 hover:bg-purple-500", action: () => { onAddThread(); setShowPostSubmenu(false); setIsOpen(false); } },
  ];

  const imageOptions = [
    { icon: ImageIcon, label: "Upload Image", color: "bg-blue-400 hover:bg-blue-500", action: () => { onAddImage(); setShowImageSubmenu(false); setIsOpen(false); } },
    { icon: Pencil, label: "Draw Doodle", color: "bg-teal-400 hover:bg-teal-500", action: () => { onAddDoodle(); setShowImageSubmenu(false); setIsOpen(false); } },
  ];

  const gameOptions = [
    { icon: Grid3x3, label: "Tic Tac Toe", action: () => { onAddGame("tictactoe"); setShowSubmenu(false); setIsOpen(false); } },
  ];

  const handleBack = () => {
    if (showPostSubmenu) {
      setShowPostSubmenu(false);
    } else if (showImageSubmenu) {
      setShowImageSubmenu(false);
    } else {
      setShowSubmenu(false);
    }
  };

  return (
    <TooltipProvider>
      <div className={`fixed z-[9999] transition-all duration-300 ${isMobile ? 'bottom-24 right-8' : 'bottom-8 right-8'} ${!isVisible && isMobile ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}`}>
        {/* Menu Items */}
        {isOpen && !showSubmenu && !showPostSubmenu && !showImageSubmenu && (
          <div className="absolute bottom-20 right-0 flex flex-col-reverse gap-3 items-center">
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

        {/* Post Submenu */}
        {isOpen && showPostSubmenu && (
          <div className="absolute bottom-20 right-0 flex flex-col-reverse gap-3 items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleBack}
                    className="bg-gray-400 hover:bg-gray-500 text-white w-12 h-12 rounded-full shadow-lg hover:scale-110 transition-all duration-150 ease-in-out flex items-center justify-center"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left"><p>Back</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {postOptions.map((opt, index) => (
              <TooltipProvider key={opt.label}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={opt.action}
                      className={`${opt.color} text-white w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-all duration-150 ease-in-out flex items-center justify-center`}
                    >
                      <opt.icon className="w-6 h-6" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left"><p>{opt.label}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}

        {/* Image/Doodle Submenu */}
        {isOpen && showImageSubmenu && (
          <div className="absolute bottom-20 right-0 flex flex-col-reverse gap-3 items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleBack}
                    className="bg-gray-400 hover:bg-gray-500 text-white w-12 h-12 rounded-full shadow-lg hover:scale-110 transition-all duration-150 ease-in-out flex items-center justify-center"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left"><p>Back</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {imageOptions.map((opt, index) => (
              <TooltipProvider key={opt.label}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={opt.action}
                      className={`${opt.color} text-white w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-all duration-150 ease-in-out flex items-center justify-center`}
                    >
                      <opt.icon className="w-6 h-6" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left"><p>{opt.label}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}

        {/* Games Submenu */}
        {isOpen && showSubmenu && (
          <div className="absolute bottom-20 right-0 flex flex-col-reverse gap-3 items-center">
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
            setShowPostSubmenu(false);
            setShowImageSubmenu(false);
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
