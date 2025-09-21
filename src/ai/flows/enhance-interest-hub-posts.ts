'use server';

/**
 * @fileOverview A flow to enhance Interest Hub posts by summarizing the key details of the post using GenAI.
 *
 * - enhanceInterestHubPost - A function that enhances the Interest Hub post.
 * - EnhanceInterestHubPostInput - The input type for the enhanceInterestHubPost function.
 * - EnhanceInterestHubPostOutput - The return type for the enhanceInterestHubPost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceInterestHubPostInputSchema = z.object({
  postContent: z.string().describe('The content of the Interest Hub post.'),
});
export type EnhanceInterestHubPostInput = z.infer<typeof EnhanceInterestHubPostInputSchema>;

const EnhanceInterestHubPostOutputSchema = z.object({
  summary: z.string().describe('A summarized version of the Interest Hub post content.'),
});
export type EnhanceInterestHubPostOutput = z.infer<typeof EnhanceInterestHubPostOutputSchema>;

export async function enhanceInterestHubPost(input: EnhanceInterestHubPostInput): Promise<EnhanceInterestHubPostOutput> {
  return enhanceInterestHubPostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceInterestHubPostPrompt',
  input: {schema: EnhanceInterestHubPostInputSchema},
  output: {schema: EnhanceInterestHubPostOutputSchema},
  prompt: `You are an AI assistant designed to summarize Interest Hub posts.

  Given the content of the Interest Hub post, provide a concise summary of the key details, including the sport, time, facility, and any other relevant information.

  Post Content: {{{postContent}}}

  Summary: `,
});

const enhanceInterestHubPostFlow = ai.defineFlow(
  {
    name: 'enhanceInterestHubPostFlow',
    inputSchema: EnhanceInterestHubPostInputSchema,
    outputSchema: EnhanceInterestHubPostOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
