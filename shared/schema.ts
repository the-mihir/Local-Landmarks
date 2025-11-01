import { z } from "zod";

export const landmarkSchema = z.object({
  pageid: z.number(),
  title: z.string(),
  lat: z.number(),
  lon: z.number(),
  dist: z.number().optional(),
  primary: z.string().optional(),
});

export const landmarkDetailSchema = landmarkSchema.extend({
  extract: z.string().optional(),
  thumbnail: z.object({
    source: z.string(),
    width: z.number(),
    height: z.number(),
  }).optional(),
  url: z.string().optional(),
});

export const landmarkSearchRequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  radius: z.number().min(10).max(10000).default(5000),
});

export type Landmark = z.infer<typeof landmarkSchema>;
export type LandmarkDetail = z.infer<typeof landmarkDetailSchema>;
export type LandmarkSearchRequest = z.infer<typeof landmarkSearchRequestSchema>;
