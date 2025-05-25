// src/app/actions.ts
'use server';

import { transcribeVoiceCommand as transcribeFlow, type TranscribeVoiceCommandInput, type TranscribeVoiceCommandOutput } from '@/ai/flows/transcribe-voice-command';
import { analyzeSpeechForAction as analyzeFlow, type AnalyzeSpeechForActionInput, type AnalyzeSpeechForActionOutput } from '@/ai/flows/analyze-speech-for-action';

export async function transcribeVoiceCommandAction(input: TranscribeVoiceCommandInput): Promise<TranscribeVoiceCommandOutput> {
  try {
    return await transcribeFlow(input);
  } catch (error) {
    console.error('Error in transcribeVoiceCommandAction:', error);
    throw new Error('Failed to transcribe voice command.');
  }
}

export async function analyzeSpeechForActionAction(input: AnalyzeSpeechForActionInput): Promise<AnalyzeSpeechForActionOutput> {
  try {
    return await analyzeFlow(input);
  } catch (error) {
    console.error('Error in analyzeSpeechForActionAction:', error);
    throw new Error('Failed to analyze speech for action.');
  }
}
