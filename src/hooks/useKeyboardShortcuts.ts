import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  callback: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[], enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlOrMeta = shortcut.ctrlKey || shortcut.metaKey;
        const matchesModifier =
          (!ctrlOrMeta || (e.ctrlKey || e.metaKey)) &&
          (!shortcut.shiftKey || e.shiftKey);

        if (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          matchesModifier
        ) {
          e.preventDefault();
          shortcut.callback();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
};

// Common shortcuts for chat
export const CHAT_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'k',
    ctrlKey: true,
    callback: () => {}, // Will be overridden
    description: 'Search messages'
  },
  {
    key: 'Escape',
    callback: () => {}, // Will be overridden
    description: 'Cancel reply/edit'
  },
  {
    key: 'ArrowUp',
    callback: () => {}, // Will be overridden
    description: 'Edit last message'
  }
];
