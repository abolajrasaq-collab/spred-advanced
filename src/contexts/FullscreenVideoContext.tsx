import React, { useState, useEffect, createContext, useContext } from 'react';

interface FullscreenVideoContextType {
  isFullscreen: boolean;
  videoSource: any;
  enterFullscreen: (source: any) => void;
  exitFullscreen: () => void;
  togglePlayPause: () => void;
  isPaused: boolean;
}

const FullscreenVideoContext = createContext<
  FullscreenVideoContextType | undefined
>(undefined);

interface FullscreenVideoProviderProps {
  children: React.ReactNode;
}

export const FullscreenVideoProvider: React.FC<
  FullscreenVideoProviderProps
> = ({ children }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoSource, setVideoSource] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);

  const enterFullscreen = (source: any) => {
    setVideoSource(source);
    setIsFullscreen(true);
    setIsPaused(false);
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
    setVideoSource(null);
    setIsPaused(false);
  };

  const togglePlayPause = () => {
    setIsPaused(!isPaused);
  };

  const value = {
    isFullscreen,
    videoSource,
    enterFullscreen,
    exitFullscreen,
    togglePlayPause,
    isPaused,
  };

  return (
    <FullscreenVideoContext.Provider value={value}>
      {children}
    </FullscreenVideoContext.Provider>
  );
};

export const useFullscreenVideo = () => {
  const context = useContext(FullscreenVideoContext);
  if (context === undefined) {
    throw new Error(
      'useFullscreenVideo must be used within a FullscreenVideoProvider',
    );
  }
  return context;
};
