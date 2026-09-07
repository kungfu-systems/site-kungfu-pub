import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const tutorials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tutorials' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    minutes: z.number(),
    updated: z.string(),
    tags: z.array(z.string()),
    status: z.literal('draft'),
    period: z.string(),
    theme: z.string(),
    doc_type: z.string(),
    source_level: z.string(),
    confidence: z.string(),
    sensitivity: z.string(),
    evidence_grade: z.string(),
    review_state: z.string(),
    last_reviewed: z.string(),
  }),
});
export const collections = { tutorials };
