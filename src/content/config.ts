import { defineCollection, z } from 'astro:content';

const songs = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    artist: z.string(),
    key: z.string().optional(),
    tempo: z.number().optional(),
    timeSig: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { songs };
