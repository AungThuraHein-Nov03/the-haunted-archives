import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const documents = defineCollection({
  loader: glob({ base: './src/content/documents', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1).optional(),
    documentNumber: z.number().int().positive(),
    location: z.string().min(1),
    locality: z.string().min(1).optional(),
    region: z.string().min(1).optional(),
    period: z.string().min(1).optional(),
    pageCount: z.number().int().positive(),
    description: z.string().min(1),
    cover: z.string().regex(/^covers\/[a-z0-9-]+\.png$/),
    pdf: z.string().regex(/^documents\/[a-z0-9-]+\.pdf$/),
    featured: z.boolean(),
    order: z.number().int().positive(),
    topics: z.array(z.string().min(1)).optional(),
  }),
});

export const collections = { documents };
