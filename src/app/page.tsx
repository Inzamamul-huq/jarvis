// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { VoiceCommandButton } from '@/components/voice-command-button';
import { useMicrophone } from '@/hooks/use-microphone';
import { transcribeVoiceCommandAction, analyzeSpeechForActionAction } from './actions';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

type ActionOutput = {
  action: string;
  parameters: Record<string, string>;
} | null;

export default function HomePage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [actionOutput, setActionOutput] = useState<ActionOutput>(null);
  const [currentStatus, setCurrentStatus] = useState<string>("Ready to listen");
  const { toast } = useToast();

  const handleRecordingStop = useCallback(async (audioDataUri: string) => {
    if (!audioDataUri) return;

    setIsProcessing(true);
    setTranscribedText(null);
    setActionOutput(null);
    setCurrentStatus("Transcribing audio...");

    try {
      const transcriptionResult = await transcribeVoiceCommandAction({ audioDataUri });
      setTranscribedText(transcriptionResult.transcription);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastTranscription', transcriptionResult.transcription);
      }
      setCurrentStatus("Analyzing command...");
      toast({ title: "Transcription Successful", description: "Audio transcribed.",variant: "default" });

      const analysisResult = await analyzeSpeechForActionAction({ recognizedSpeech: transcriptionResult.transcription });
      
      let parsedParameters: Record<string, string> = {};
      if (analysisResult.parameters && analysisResult.parameters.trim() !== "") {
        try {
          parsedParameters = JSON.parse(analysisResult.parameters);
        } catch (e) {
          console.error("Failed to parse action parameters JSON:", e);
          toast({
            title: "Parameter Parsing Error",
            description: "Could not understand the parameters for the command. Proceeding without parameters.",
            variant: "destructive",
          });
          setCurrentStatus("Error understanding parameters.");
        }
      }
      
      const currentActionOutput = { action: analysisResult.action, parameters: parsedParameters };
      setActionOutput(currentActionOutput);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastAction', JSON.stringify(currentActionOutput));
      }
      setCurrentStatus("Executing action...");
      executeAction(analysisResult.action, parsedParameters);
      
    } catch (error) {
      console.error("Error processing voice command:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Processing Error",
        description: errorMessage,
        variant: "destructive",
      });
      setCurrentStatus(`Error: ${errorMessage.substring(0,50)}...`);
    } finally {
      setIsProcessing(false);
      // Reset status after a short delay if no error, or keep error message
      // setTimeout(() => {
      //   if (!currentStatus.toLowerCase().startsWith("error") && !currentStatus.toLowerCase().startsWith("failed")) {
      //     setCurrentStatus("Ready to listen");
      //   }
      // }, 3000); // Delay kept from original logic, adjust if needed
    }
  }, [toast, currentStatus]); // Added currentStatus to dependencies due to its check in finally block logic

  const { isRecording, error: micError, startRecording, stopRecording } = useMicrophone({
    onRecordingStop: handleRecordingStop,
  });

  useEffect(() => {
    if (micError) {
      toast({
        title: "Microphone Error",
        description: micError,
        variant: "destructive",
      });
      setCurrentStatus(`Mic Error: ${micError}`);
    }
  }, [micError, toast]);

  const handleVoiceButtonClick = () => {
    if (isRecording) {
      stopRecording();
      setCurrentStatus("Processing...");
    } else {
      startRecording();
      setCurrentStatus("Listening...");
      setTranscribedText(null);
      setActionOutput(null);
    }
  };
  
  const executeAction = (action: string, parameters: Record<string, string>) => {
    const actionLower = action.toLowerCase();
    let executed = false;
    let executionMessage = "";

    try {
        if (actionLower.includes("whatsapp")) {
            const contact = parameters?.contact || parameters?.number || '';
            const message = parameters?.message || '';
            let url = 'https://wa.me/';
            if (contact) {
                // Basic phone number cleanup - adapt as needed
                const phoneNumber = contact.replace(/[^0-9]/g, '');
                url += phoneNumber;
            }
            if (message) {
                url += `?text=${encodeURIComponent(message)}`;
            }
            window.open(url, '_blank');
            executed = true;
            executionMessage = `Opening WhatsApp${contact ? ` for ${contact}` : ''}...`;
        } else if (actionLower.includes("call") || actionLower.includes("phone")) {
            const contact = parameters?.contact || parameters?.number;
            if (contact) {
                // Basic phone number cleanup
                const phoneNumber = contact.replace(/[^0-9+\\s()-]/g, '');
                window.open(`tel:${phoneNumber}`, '_self');
                executed = true;
                executionMessage = `Calling ${contact}...`;
            } else {
                 executionMessage = "No contact specified for call.";
            }
        } else {
            executionMessage = `Action "${action}" not recognized or supported.`;
        }
    } catch (e) {
        console.error("Error executing action:", e);
        executionMessage = "Failed to execute action due to a browser or system error.";
        if (e instanceof Error) {
          executionMessage = e.message;
        }
    }

    if (executed) {
      toast({ title: "Action Executed", description: executionMessage });
      setCurrentStatus(executionMessage);
    } else {
      toast({ title: "Action Failed", description: executionMessage, variant: "destructive" });
      setCurrentStatus(`Failed: ${executionMessage}`);
    }
    // Set ready status after a delay
     setTimeout(() => setCurrentStatus("Ready to listen"), 5000);
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8 bg-background text-foreground">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-primary">Offline Voice Assistant</h1>
        <p className="text-muted-foreground">{currentStatus}</p>
      </header>

      <VoiceCommandButton
        isListening={isRecording}
        isProcessing={isProcessing}
        onClick={handleVoiceButtonClick}
        disabled={isProcessing}
      />

      <div className="w-full max-w-md space-y-4">
        {transcribedText && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
                Transcription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{transcribedText}</p>
            </CardContent>
          </Card>
        )}

        {actionOutput && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                 { actionOutput.action.toLowerCase().includes("not recognized") || actionOutput.action.toLowerCase().includes("failed") ?
                    <AlertCircle className="w-5 h-5 mr-2 text-red-500" /> :
                    <CheckCircle2 className="w-5 h-5 mr-2 text-primary" /> 
                 }
                Recognized Action
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p><strong className="font-medium">Action:</strong> {actionOutput.action}</p>
              {Object.keys(actionOutput.parameters).length > 0 && (
                <div>
                  <strong className="font-medium">Parameters:</strong>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {Object.entries(actionOutput.parameters).map(([key, value]) => (
                      <li key={key}>{key}: {value}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      <footer className="absolute bottom-4 text-center text-sm text-muted-foreground">
        <p>Press the button and speak your command.</p>
        <p>Examples: "Open WhatsApp for John", "Call Mom".</p>
      </footer>
    </div>
  );
}
