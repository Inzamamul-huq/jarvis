// use server'
'use server';

/**
 * @fileOverview Analyzes speech to determine the desired action.
 *
 * - analyzeSpeechForAction - A function that analyzes the speech.
 * - AnalyzeSpeechForActionInput - The input type for the analyzeSpeechForAction function.
 * - AnalyzeSpeechForActionOutput - The return type for the analyzeSpeechForAction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSpeechForActionInputSchema = z.object({
  recognizedSpeech: z.string().describe('The speech recognized from the user.'),
});
export type AnalyzeSpeechForActionInput = z.infer<typeof AnalyzeSpeechForActionInputSchema>;

const AnalyzeSpeechForActionOutputSchema = z.object({
  action: z.string().describe('The action to be performed (e.g., open WhatsApp, call John).'),
  parameters: z.string().describe('A JSON string representing parameters for the action as key-value pairs. Example: "{\\"contact\\": \\"Jane Doe\\", \\"message\\": \\"Hi there!\\"}" or an empty JSON object string "{}" if no parameters are found.'),
});
export type AnalyzeSpeechForActionOutput = z.infer<typeof AnalyzeSpeechForActionOutputSchema>;

export async function analyzeSpeechForAction(input: AnalyzeSpeechForActionInput): Promise<AnalyzeSpeechForActionOutput> {
  return analyzeSpeechForActionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSpeechForActionPrompt',
  input: {schema: AnalyzeSpeechForActionInputSchema},
  output: {schema: AnalyzeSpeechForActionOutputSchema},
  prompt: `You are a voice assistant that analyzes user speech to determine the desired action and parameters.

  Analyze the following speech and extract the action and any parameters required to perform the action.
  Ensure the parameters are returned as a JSON string, conforming to the output schema.

  Speech: {{{recognizedSpeech}}}
  `,
});

const analyzeSpeechForActionFlow = ai.defineFlow(
  {
    name: 'analyzeSpeechForActionFlow',
    inputSchema: AnalyzeSpeechForActionInputSchema,
    outputSchema: AnalyzeSpeechForActionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
