'use client';

import { createContext, useContext, useMemo, useState } from 'react';

type FloatingChannel = {
  handle: string;
  name: string;
  videoId: string;
};

type WindowPosition = {
  x: number;
  y: number;
};

type WindowSize = {
  width: number;
  height: number;
};

type FloatingChannelWindowContextValue = {
  activeChannel: FloatingChannel | null;
  isMinimized: boolean;
  position: WindowPosition;
  size: WindowSize;
  closeWindow: () => void;
  minimizeWindow: () => void;
  openWindow: (channel: FloatingChannel) => void;
  restoreWindow: () => void;
  setPosition: (position: WindowPosition) => void;
  setSize: (size: WindowSize) => void;
};

const DEFAULT_POSITION = { x: 24, y: 96 };
const DEFAULT_SIZE = { width: 420, height: 260 };

const FloatingChannelWindowContext = createContext<FloatingChannelWindowContextValue | null>(null);

function getDefaultPosition(size: WindowSize): WindowPosition {
  if (typeof window === 'undefined') return DEFAULT_POSITION;

  return {
    x: Math.max(16, window.innerWidth - size.width - 24),
    y: Math.max(72, window.innerHeight - size.height - 40),
  };
}

export function FloatingChannelWindowProvider({ children }: { children: React.ReactNode }) {
  const [activeChannel, setActiveChannel] = useState<FloatingChannel | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [size, setSize] = useState(DEFAULT_SIZE);

  const value = useMemo<FloatingChannelWindowContextValue>(() => ({
    activeChannel,
    isMinimized,
    position,
    size,
    closeWindow() {
      setActiveChannel(null);
      setIsMinimized(false);
    },
    minimizeWindow() {
      setIsMinimized(true);
    },
    openWindow(channel) {
      setPosition(getDefaultPosition(size));
      setActiveChannel(channel);
      setIsMinimized(false);
    },
    restoreWindow() {
      setIsMinimized(false);
    },
    setPosition,
    setSize,
  }), [activeChannel, isMinimized, position, size]);

  return (
    <FloatingChannelWindowContext.Provider value={value}>
      {children}
    </FloatingChannelWindowContext.Provider>
  );
}

export function useFloatingChannelWindow() {
  const value = useContext(FloatingChannelWindowContext);
  if (!value) {
    throw new Error('useFloatingChannelWindow must be used within FloatingChannelWindowProvider');
  }
  return value;
}
