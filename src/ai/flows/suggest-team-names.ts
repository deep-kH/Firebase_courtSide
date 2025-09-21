'use server';

/**
 * @fileOverview A flow to suggest team names based on the selected sport.
 *
 * - suggestTeamNames - A function that suggests team names.
 * - SuggestTeamNamesInput - The input type for the suggestTeamNames function.
 * - SuggestTeamNamesOutput - The return type for the suggestTeamNames function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTeamNamesInputSchema = z.object({
  sport: z.string().describe('The sport for which to suggest team names.'),
});
export type SuggestTeamNamesInput = z.infer<typeof SuggestTeamNamesInputSchema>;

const SuggestTeamNamesOutputSchema = z.object({
  teamNames: z.array(z.string()).describe('An array of suggested team names.'),
});
export type SuggestTeamNamesOutput = z.infer<typeof SuggestTeamNamesOutputSchema>;

export async function suggestTeamNames(input: SuggestTeamNamesInput): Promise<SuggestTeamNamesOutput> {
  return suggestTeamNamesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTeamNamesPrompt',
  input: {schema: SuggestTeamNamesInputSchema},
  output: {schema: SuggestTeamNamesOutputSchema},
  prompt: `You are a creative assistant helping users come up with team names for their sports teams.

  Given the sport, suggest five creative and catchy team names.

  Sport: {{{sport}}}

  Team Names:`,
});

const suggestTeamNamesFlow = ai.defineFlow(
  {
    name: 'suggestTeamNamesFlow',
    inputSchema: SuggestTeamNamesInputSchema,
    outputSchema: SuggestTeamNamesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
