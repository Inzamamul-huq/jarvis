// src/components/voice-command-button.tsx
"use client";

import type React from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceCommandButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function VoiceCommandButton({
  isListening,
  isProcessing,
  onClick,
  disabled = false,
}: VoiceCommandButtonProps) {
  let IconComponent = Mic;
  let ariaLabel = "Start voice command";
  let pulseClass = "";

  if (isProcessing) {
    IconComponent = Loader2;
    ariaLabel = "Processing voice command";
  } else if (isListening) {
    IconComponent = Mic; // Or Square if you prefer stop icon
    ariaLabel = "Stop voice command";
    pulseClass = "animate-pulse";
  }

  return (
    <Button
      onClick={onClick}
      disabled={disabled || isProcessing}
      className={cn(
        'w-24 h-24 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transform transition-transform active:scale-95 focus:ring-4 focus:ring-accent/50',
        pulseClass
      )}
      aria-label={ariaLabel}
    >
      <IconComponent className={cn('w-10 h-10', isProcessing && 'animate-spin')} />
    </Button>
  );
}
