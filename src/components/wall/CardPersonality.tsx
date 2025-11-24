import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardPersonalityProps {
  children: ReactNode;
  type: "note" | "image" | "thread" | "announcement" | "poll" | "audio" | "doodle" | "music" | "challenge" | "game";
  className?: string;
}

export const CardPersonality = ({ children, type, className }: CardPersonalityProps) => {
  const personalityStyles = {
    note: "before:absolute before:top-2 before:left-2 before:w-12 before:h-6 before:bg-gradient-to-br before:from-yellow-200/60 before:to-yellow-300/60 before:rotate-[-5deg] before:rounded-sm before:shadow-sm before:content-['']",
    image: "", // No extra styling - use same card style as notes
    thread: "before:absolute before:bottom-4 before:left-[-8px] before:w-0 before:h-0 before:border-t-[8px] before:border-t-transparent before:border-r-[12px] before:border-r-card before:border-b-[8px] before:border-b-transparent before:content-['']",
    announcement: "", // Already has Windows 98 style
    poll: "before:absolute before:top-[-8px] before:left-[20%] before:right-[20%] before:h-2 before:bg-gradient-to-r before:from-zinc-400 before:via-zinc-300 before:to-zinc-400 before:rounded-t-sm before:shadow-sm before:content-['']",
    music: "after:absolute after:top-2 after:right-2 after:w-8 after:h-8 after:bg-gradient-to-br after:from-purple-500/20 after:to-pink-500/20 after:rounded-full after:content-[''] after:backdrop-blur-sm",
    audio: "before:absolute before:top-0 before:left-0 before:right-0 before:h-4 before:bg-gradient-to-r before:from-orange-300/40 before:via-orange-400/40 before:to-orange-300/40 before:rounded-t-lg before:content-['']",
    doodle: "clip-path-torn border-0",
    challenge: "before:absolute before:top-2 before:right-[-6px] before:w-16 before:h-8 before:bg-gradient-to-r before:from-rose-400 before:to-rose-500 before:text-white before:text-[10px] before:flex before:items-center before:justify-center before:rotate-[5deg] before:shadow-md before:content-['CHALLENGE'] before:font-bold",
    game: "after:absolute after:top-2 after:left-2 after:w-6 after:h-6 after:bg-green-400/30 after:rounded-full after:content-[''] after:backdrop-blur-sm",
  };

  return (
    <div className={cn(
      "relative",
      personalityStyles[type],
      className
    )}>
      {children}
    </div>
  );
};
