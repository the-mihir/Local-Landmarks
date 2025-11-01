// Storage interface for the landmarks app
// Since we're fetching data from Wikipedia API, we don't need persistent storage

export interface IStorage {
  // Add storage methods here if needed for caching or user preferences
}

export class MemStorage implements IStorage {
  constructor() {
    // Initialize if needed
  }
}

export const storage = new MemStorage();
