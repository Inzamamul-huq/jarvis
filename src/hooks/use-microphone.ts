// src/hooks/use-microphone.ts
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseMicrophoneOptions {
  onRecordingStop?: (audioDataUri: string) => void;
  silenceTimeout?: number; // ms
  maxRecordingDuration?: number; // ms
}

const DEFAULT_SILENCE_TIMEOUT = 3000; // 3 seconds
const DEFAULT_MAX_RECORDING_DURATION = 15000; // 15 seconds

export function useMicrophone(options?: UseMicrophoneOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const onRecordingStopCallback = options?.onRecordingStop;
  const silenceTimeout = options?.silenceTimeout ?? DEFAULT_SILENCE_TIMEOUT;
  const maxRecordingDuration = options?.maxRecordingDuration ?? DEFAULT_MAX_RECORDING_DURATION;

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
  }, []);
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    clearTimers();
    setIsRecording(false);
  }, [clearTimers]);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      stopRecording();
    }, silenceTimeout);
  }, [stopRecording, silenceTimeout]);

  const startRecording = async () => {
    setError(null);
    if (isRecording) {
      stopRecording();
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Media Devices API not supported.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          resetSilenceTimer(); // Reset silence timer on new data
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Using webm, adjust if needed
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          if (onRecordingStopCallback) {
            onRecordingStopCallback(base64String);
          }
        };
        reader.readAsDataURL(audioBlob);
        
        // Clean up stream tracks
        stream.getTracks().forEach(track => track.stop());
        clearTimers();
      };
      
      mediaRecorderRef.current.onerror = (event) => {
        setError('MediaRecorder error: ' + (event as any).error?.name);
        setIsRecording(false);
        clearTimers();
         stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      resetSilenceTimer(); // Start silence timer
      
      // Start max duration timer
      maxDurationTimerRef.current = setTimeout(() => {
        stopRecording();
      }, maxRecordingDuration);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError("Microphone permission denied.");
        } else {
          setError(`Error accessing microphone: ${err.message}`);
        }
      } else {
        setError("An unknown error occurred while accessing the microphone.");
      }
      setIsRecording(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
         mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [clearTimers]);

  return { isRecording, error, startRecording, stopRecording };
}
