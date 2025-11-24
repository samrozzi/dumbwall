import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface MessageEffect {
  type: 'confetti' | 'hearts' | 'lasers' | 'fireworks' | 'balloons';
  duration?: number;
}

interface MessageAnimationsProps {
  effect: MessageEffect | null;
  onComplete: () => void;
}

export const MessageAnimations = ({ effect, onComplete }: MessageAnimationsProps) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; rotation: number }>>([]);

  useEffect(() => {
    if (!effect) return;

    const duration = effect.duration || 3000;

    // Generate particles
    const particleCount = 50;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 360
    }));

    setParticles(newParticles);

    // Cleanup after animation
    const timeout = setTimeout(() => {
      setParticles([]);
      onComplete();
    }, duration);

    return () => clearTimeout(timeout);
  }, [effect]);

  if (!effect || particles.length === 0) return null;

  const getParticleEmoji = () => {
    switch (effect.type) {
      case 'confetti':
        return ['🎊', '🎉', '✨', '🎈'];
      case 'hearts':
        return ['❤️', '💕', '💖', '💗', '💓'];
      case 'lasers':
        return ['⚡', '✨', '💫', '⭐'];
      case 'fireworks':
        return ['🎆', '🎇', '✨', '💥'];
      case 'balloons':
        return ['🎈', '🎈', '🎈'];
      default:
        return ['✨'];
    }
  };

  const emojis = getParticleEmoji();

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute text-4xl animate-[float_3s_ease-out_forwards]"
          style={{
            left: `${particle.x}%`,
            top: `-10%`,
            transform: `rotate(${particle.rotation}deg)`,
            animationDelay: `${Math.random() * 500}ms`,
            opacity: 0
          }}
        >
          {emojis[Math.floor(Math.random() * emojis.length)]}
        </div>
      ))}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}} />
    </div>
  );
};

// Button to trigger message effects
export const MessageEffectButton = ({ onEffectSelect }: { onEffectSelect: (effect: MessageEffect['type']) => void }) => {
  const effects: MessageEffect['type'][] = ['confetti', 'hearts', 'lasers', 'fireworks', 'balloons'];

  return (
    <div className="flex gap-1 p-2 bg-muted rounded-lg">
      {effects.map((effect) => (
        <button
          key={effect}
          onClick={() => onEffectSelect(effect)}
          className="px-3 py-1 text-sm rounded hover:bg-primary/10 transition-colors capitalize"
        >
          {effect}
        </button>
      ))}
    </div>
  );
};
