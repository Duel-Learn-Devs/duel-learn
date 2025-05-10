import { io } from "socket.io-client";

class CacheService {
  private cache: Record<string, any> = {};
  private timestamps: Record<string, number> = {};

  constructor() {
    // Try to load from localStorage on initialization
    try {
      const savedCache = localStorage.getItem("app_data_cache");
      const savedTimestamps = localStorage.getItem("app_cache_timestamps");

      if (savedCache) this.cache = JSON.parse(savedCache);
      if (savedTimestamps) this.timestamps = JSON.parse(savedTimestamps);
    } catch (e) {
      console.error("Error loading cache from localStorage", e);
    }

    this.setupSocketListeners();
  }

  get<T>(key: string, maxAge = 900000): T | null {
    // Default 15 min TTL
    const timestamp = this.timestamps[key];
    if (!timestamp) return null;

    // Check if cache is still valid
    if (Date.now() - timestamp > maxAge) {
      return null;
    }

    return this.cache[key] as T;
  }

  set<T>(key: string, data: T): void {
    this.cache[key] = data;
    this.timestamps[key] = Date.now();

    // Persist to localStorage
    try {
      localStorage.setItem("app_data_cache", JSON.stringify(this.cache));
      localStorage.setItem(
        "app_cache_timestamps",
        JSON.stringify(this.timestamps)
      );
    } catch (e) {
      console.error("Error saving cache to localStorage", e);
    }
  }

  invalidate(keyPattern: string): void {
    const keys = Object.keys(this.cache);
    keys.forEach((key) => {
      if (key.includes(keyPattern)) {
        delete this.cache[key];
        delete this.timestamps[key];
      }
    });

    // Update localStorage
    try {
      localStorage.setItem("app_data_cache", JSON.stringify(this.cache));
      localStorage.setItem(
        "app_cache_timestamps",
        JSON.stringify(this.timestamps)
      );
    } catch (e) {
      console.error("Error updating localStorage after invalidation", e);
    }
  }

  setupSocketListeners() {
    const socket = io(import.meta.env.VITE_BACKEND_URL);

    // Listen for cache invalidation broadcasts
    socket.on("cacheInvalidation", (data) => {
      console.log("Received cache invalidation:", data);

      if (data.keys && Array.isArray(data.keys)) {
        data.keys.forEach((key) => this.invalidate(key));
      }
    });

    // Listen for study material broadcasts
    socket.on("broadcastStudyMaterial", (data) => {
      console.log("Received new study material broadcast:", data);

      // Invalidate relevant caches
      if (data.should_invalidate && Array.isArray(data.should_invalidate)) {
        data.should_invalidate.forEach((key) => this.invalidate(key));
      }

      // Store the new item in cache
      if (data.study_material_id) {
        this.set(`study_material_${data.study_material_id}`, data);
      }
    });

    socket.on("broadcastStudyMaterialUpdate", (data) => {
      console.log("Received study material update:", data);

      // Invalidate relevant caches
      if (data.cache_keys && Array.isArray(data.cache_keys)) {
        data.cache_keys.forEach((key) => this.invalidate(key));
      }
    });

    socket.on("broadcastStudyMaterialArchived", (data) => {
      console.log("Received study material archive:", data);

      // Invalidate relevant caches
      if (data.cache_keys && Array.isArray(data.cache_keys)) {
        data.cache_keys.forEach((key) => this.invalidate(key));
      }
    });
  }
}

export const cacheService = new CacheService();
