import React, { useEffect, useState } from 'react';
import { useThemeStore } from '../../store/themeStore';

interface StreamingTextProps {
  text: string;
  onComplete?: () => void;
  className?: string;
  speed?: number;
}

export function StreamingText({ text, onComplete, className = '', speed = 30 }: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const isDark = useThemeStore((state) => state.isDark);

  useEffect(() => {
    if (displayedText.length >= text.length) {
      setIsComplete(true);
      onComplete?.();
      return;
    }

    const timeout = setTimeout(() => {
      setDisplayedText(text.slice(0, displayedText.length + 1));
    }, speed);

    return () => clearTimeout(timeout);
  }, [displayedText, text, speed, onComplete]);

  return (
    <div className={className}>
      <div className="flex items-center">
        <span>{displayedText}</span>
        {!isComplete && <span className="streaming-cursor" />}
      </div>
      {!isComplete && <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'} mt-2`}>Generating...</div>}
    </div>
  );
}
