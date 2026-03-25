import { useState, useCallback, useEffect, useRef } from 'react';
import { orchestrate, OrchestratorResponse } from '../ai/orchestrator';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    toolsUsed?: string[];
    domain?: string[];
    provider?: string;
    ragUsed?: boolean;
    ragSources?: string[];
    complexity?: string;
  };
}

export interface UseAIAssistantOptions {
  currentPage?: string;
  selectedEntityId?: string;
  selectedEntityType?: string;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export function useAIAssistant(options?: UseAIAssistantOptions) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize Speech Recognition on mount
  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          sendMessage(transcript);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: AIMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response: OrchestratorResponse = await orchestrate({
          message: content,
          context: {
            currentPage: options?.currentPage,
            selectedEntityId: options?.selectedEntityId,
            selectedEntityType: options?.selectedEntityType,
          },
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });

        const assistantMessage: AIMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          metadata: {
            toolsUsed: response.toolsUsed,
            domain: response.domain,
            provider: response.provider,
            ragUsed: response.ragUsed,
            ragSources: response.ragSources,
            complexity: response.complexity,
          },
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage: AIMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content:
            'Sorry, I encountered an error processing your request. Please try again.',
          timestamp: new Date(),
          metadata: {
            provider: 'error',
          },
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, options]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    isListening,
    startListening,
    stopListening,
  };
}
