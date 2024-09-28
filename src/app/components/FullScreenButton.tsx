// src/app/components/FullScreenButton.tsx
import React from 'react';

interface FullScreenButtonProps {
  isFullScreen: boolean;
  toggleFullScreen: () => void;
}

const FullScreenButton: React.FC<FullScreenButtonProps> = ({
  isFullScreen,
  toggleFullScreen,
}) => {
  return (
    <button
      onClick={toggleFullScreen}
      className="absolute top-4 right-4 p-2 bg-secondary rounded-full hover:bg-accent transition-colors"
      aria-label={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
      title={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
    >
      {isFullScreen ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 9V4.5M9 9H4.5M15 9H19.5M15 9V4.5M15 20.25V15M15 20.25H19.5M9 20.25H4.5M9 20.25V15"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
          />
        </svg>
      )}
    </button>
  );
};

export default FullScreenButton;
