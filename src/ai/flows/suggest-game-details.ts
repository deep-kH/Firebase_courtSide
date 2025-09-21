'use server';

/**
 * @fileOverview A flow to suggest compelling details for an Interest Hub post when creating a booking for a multiplayer sport.
 *
 * - suggestGameDetails - A function that suggests details to include in the Interest Hub post.
 * - SuggestGameDetailsInput - The input type for the suggestGameDetails function.
 * - SuggestGameDetailsOutput - The return type for the suggestGameDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestGameDetailsInputSchema = z.object({
  sport: z.string().describe('The name of the sport being played.'),
  time: z.string().describe('The time the game is scheduled for.'),
  facility: z.string().describe('The name of the facility where the game will be played.'),
});
export type SuggestGameDetailsInput = z.infer<typeof SuggestGameDetailsInputSchema>;

const SuggestGameDetailsOutputSchema = z.object({
  description: z.string().describe('A suggested description for the Interest Hub post.'),
  suggestedSkillLevel: z.string().describe('A suggested skill level for the game.'),
  gameRules: z.string().describe('Suggested game rules to include in the post.'),
});
export type SuggestGameDetailsOutput = z.infer<typeof SuggestGameDetailsOutputSchema>;

export async function suggestGameDetails(input: SuggestGameDetailsInput): Promise<SuggestGameDetailsOutput> {
  return suggestGameDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestGameDetailsPrompt',
  input: {schema: SuggestGameDetailsInputSchema},
  output: {schema: SuggestGameDetailsOutputSchema},
  prompt: `You are an assistant that helps users create compelling Interest Hub posts for multiplayer sports games.

  Given the sport, time, and facility, suggest a description, skill level, and game rules to include in the post to attract other players.

  Sport: {{{sport}}}
  Time: {{{time}}}
  Facility: {{{facility}}}

  Description: 
  Suggested Skill Level:
  Game Rules:`,
});

const suggestGameDetailsFlow = ai.defineFlow(
  {
    name: 'suggestGameDetailsFlow',
    inputSchema: SuggestGameDetailsInputSchema,
    outputSchema: SuggestGameDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
