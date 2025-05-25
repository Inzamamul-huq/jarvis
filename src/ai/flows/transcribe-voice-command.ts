// src/ai/flows/transcribe-voice-command.ts
'use server';

/**
 * @fileOverview Transcribes voice commands using offline speech recognition. 
 *
 * - transcribeVoiceCommand - A function that transcribes voice commands.
 * - TranscribeVoiceCommandInput - The input type for the transcribeVoiceCommand function.
 * - TranscribeVoiceCommandOutput - The return type for the transcribeVoiceCommand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribeVoiceCommandInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio data of the voice command, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeVoiceCommandInput = z.infer<typeof TranscribeVoiceCommandInputSchema>;

const TranscribeVoiceCommandOutputSchema = z.object({
  transcription: z
    .string()
    .describe('The transcribed text from the voice command.'),
});
export type TranscribeVoiceCommandOutput = z.infer<typeof TranscribeVoiceCommandOutputSchema>;

export async function transcribeVoiceCommand(
  input: TranscribeVoiceCommandInput
): Promise<TranscribeVoiceCommandOutput> {
  return transcribeVoiceCommandFlow(input);
}

const transcribeVoiceCommandPrompt = ai.definePrompt({
  name: 'transcribeVoiceCommandPrompt',
  input: {schema: TranscribeVoiceCommandInputSchema},
  output: {schema: TranscribeVoiceCommandOutputSchema},
  prompt: `Transcribe the following voice command.  The audio data is provided as a data URI: {{media url=audioDataUri}}`,
});

const transcribeVoiceCommandFlow = ai.defineFlow(
  {
    name: 'transcribeVoiceCommandFlow',
    inputSchema: TranscribeVoiceCommandInputSchema,
    outputSchema: TranscribeVoiceCommandOutputSchema,
  },
  async input => {
    const {output} = await transcribeVoiceCommandPrompt(input);
    return output!;
  }
);
