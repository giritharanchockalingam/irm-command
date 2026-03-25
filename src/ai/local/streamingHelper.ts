// Simulates typewriter-style streaming of text
// Uses setTimeout with chunked character delivery
// Returns a controller object to start/stop/pause streaming

export interface StreamController {
  start: () => void;
  stop: () => void;
  isComplete: boolean;
}

export function createStreamingSimulation(
  text: string,
  onChunk: (partial: string) => void,
  onComplete: () => void,
  charDelay: number = 12 // default 12ms for realistic typing speed
): StreamController {
  let currentIndex = 0;
  let isRunning = false;
  let isComplete = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const controller: StreamController = {
    start: () => {
      if (isRunning || isComplete) return;
      isRunning = true;
      streamNextChunk();
    },
    stop: () => {
      isRunning = false;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
    get isComplete() {
      return isComplete;
    },
  };

  function streamNextChunk() {
    if (!isRunning || currentIndex >= text.length) {
      if (currentIndex >= text.length && isRunning) {
        isRunning = false;
        isComplete = true;
        onComplete();
      }
      return;
    }

    // Chunk size: 1-3 characters for natural typing effect
    const chunkSize = Math.random() < 0.1 ? 3 : Math.random() < 0.3 ? 2 : 1;
    const nextIndex = Math.min(currentIndex + chunkSize, text.length);
    const chunk = text.substring(currentIndex, nextIndex);

    onChunk(chunk);
    currentIndex = nextIndex;

    // Add slight variance to delay for human-like feel
    const variance = Math.random() * 8 - 4; // ±4ms
    const effectiveDelay = Math.max(4, charDelay + variance);

    timeoutId = setTimeout(streamNextChunk, effectiveDelay);
  }

  return controller;
}

// React hook for streaming text display
export function useStreamingText(text: string | null): {
  displayText: string;
  isStreaming: boolean;
  isComplete: boolean;
  reset: () => void;
} {
  const [displayText, setDisplayText] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [isComplete, setIsComplete] = React.useState(false);
  const controllerRef = React.useRef<StreamController | null>(null);

  React.useEffect(() => {
    // Reset state when text changes
    if (text === null) {
      setDisplayText("");
      setIsStreaming(false);
      setIsComplete(false);
      controllerRef.current?.stop();
      controllerRef.current = null;
      return;
    }

    // Create new streaming controller
    let accumulated = "";
    controllerRef.current = createStreamingSimulation(
      text,
      (chunk) => {
        accumulated += chunk;
        setDisplayText(accumulated);
        setIsStreaming(true);
      },
      () => {
        setIsStreaming(false);
        setIsComplete(true);
      }
    );

    // Auto-start streaming
    controllerRef.current.start();

    // Cleanup on unmount
    return () => {
      controllerRef.current?.stop();
    };
  }, [text]);

  const reset = React.useCallback(() => {
    setDisplayText("");
    setIsStreaming(false);
    setIsComplete(false);
    controllerRef.current?.stop();
    controllerRef.current = null;
  }, []);

  return {
    displayText,
    isStreaming,
    isComplete,
    reset,
  };
}

// Add React import at module level
import * as React from "react";
