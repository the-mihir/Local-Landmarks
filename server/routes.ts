import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { landmarkSearchRequestSchema } from "@shared/schema";
import { z } from "zod";

// Simple rate limiting implementation
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute

function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const clientIp = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  
  const clientData = requestCounts.get(clientIp);
  
  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize the counter
    requestCounts.set(clientIp, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    next();
  } else if (clientData.count < MAX_REQUESTS_PER_WINDOW) {
    // Increment the counter
    clientData.count++;
    next();
  } else {
    // Rate limit exceeded
    res.status(429).json({
      error: "Too many requests",
      message: "Please wait before making more requests",
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
    });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting to Wikipedia API proxy endpoints
  app.use("/api/landmarks", rateLimitMiddleware);

  // Landmark search endpoint - searches for landmarks within a radius of a coordinate
  app.get("/api/landmarks/search", async (req, res) => {
    try {
      // Parse and validate query parameters
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      const radius = req.query.radius 
        ? parseFloat(req.query.radius as string) 
        : 5000;

      // Validate using Zod schema
      const validatedParams = landmarkSearchRequestSchema.parse({ lat, lon, radius });

      // Call Wikipedia GeoSearch API
      const wikipediaUrl = new URL("https://en.wikipedia.org/w/api.php");
      wikipediaUrl.searchParams.set("action", "query");
      wikipediaUrl.searchParams.set("list", "geosearch");
      wikipediaUrl.searchParams.set("gscoord", `${validatedParams.lat}|${validatedParams.lon}`);
      wikipediaUrl.searchParams.set("gsradius", validatedParams.radius.toString());
      wikipediaUrl.searchParams.set("gslimit", "50");
      wikipediaUrl.searchParams.set("format", "json");
      wikipediaUrl.searchParams.set("origin", "*");

      const response = await fetch(wikipediaUrl.toString());
      
      if (!response.ok) {
        throw new Error(`Wikipedia API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform Wikipedia response to our landmark schema
      const landmarks = (data.query?.geosearch || []).map((item: any) => ({
        pageid: item.pageid,
        title: item.title,
        lat: item.lat,
        lon: item.lon,
        dist: item.dist,
        primary: item.primary,
      }));

      res.json({ landmarks });
    } catch (error) {
      console.error("Error fetching landmarks:", error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid parameters", 
          details: error.errors 
        });
      } else {
        res.status(500).json({ 
          error: "Failed to fetch landmarks",
          message: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });

  // Landmark detail endpoint - fetches detailed information about a specific landmark
  app.get("/api/landmarks/:pageid", async (req, res) => {
    try {
      const pageid = req.params.pageid;

      if (!pageid || isNaN(parseInt(pageid))) {
        res.status(400).json({ error: "Invalid page ID" });
        return;
      }

      // Call Wikipedia API for page details
      const wikipediaUrl = new URL("https://en.wikipedia.org/w/api.php");
      wikipediaUrl.searchParams.set("action", "query");
      wikipediaUrl.searchParams.set("pageids", pageid);
      wikipediaUrl.searchParams.set("prop", "extracts|pageimages|info");
      wikipediaUrl.searchParams.set("exintro", "1");
      wikipediaUrl.searchParams.set("explaintext", "1");
      wikipediaUrl.searchParams.set("piprop", "thumbnail");
      wikipediaUrl.searchParams.set("pithumbsize", "400");
      wikipediaUrl.searchParams.set("inprop", "url");
      wikipediaUrl.searchParams.set("format", "json");
      wikipediaUrl.searchParams.set("origin", "*");

      const response = await fetch(wikipediaUrl.toString());
      
      if (!response.ok) {
        throw new Error(`Wikipedia API error: ${response.statusText}`);
      }

      const data = await response.json();
      const page = data.query?.pages?.[pageid];

      if (!page || page.missing) {
        res.status(404).json({ error: "Landmark not found" });
        return;
      }

      // Transform Wikipedia response to our landmark detail schema
      const landmarkDetail = {
        pageid: page.pageid,
        title: page.title,
        extract: page.extract,
        thumbnail: page.thumbnail ? {
          source: page.thumbnail.source,
          width: page.thumbnail.width,
          height: page.thumbnail.height,
        } : undefined,
        url: page.fullurl,
      };

      res.json(landmarkDetail);
    } catch (error) {
      console.error("Error fetching landmark details:", error);
      res.status(500).json({ 
        error: "Failed to fetch landmark details",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
