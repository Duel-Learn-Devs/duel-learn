import { StudyMaterial } from "../types/studyMaterialObject";

const STORAGE_KEY = "recently_opened";
const MAX_ITEMS = 10;

// Check if localStorage is available
const isLocalStorageAvailable = () => {
  try {
    const test = "__test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.error("localStorage is not available:", e);
    return false;
  }
};

export const recentlyOpenedService = {
  // Get all recently opened items
  getRecentlyOpened: (): StudyMaterial[] => {
    if (!isLocalStorageAvailable()) return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      console.log(
        "Retrieved from localStorage:",
        stored ? "data found" : "no data"
      );
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error retrieving recently opened items:", error);
      return [];
    }
  },

  // Add a new item to recently opened
  addToRecentlyOpened: (item: StudyMaterial): void => {
    if (!isLocalStorageAvailable()) return;

    try {
      if (!item || !item.study_material_id) {
        console.error("Invalid study material", item);
        return;
      }

      console.log("Adding to recently opened:", item.title);

      // Get existing items
      const recentItems = recentlyOpenedService.getRecentlyOpened();

      // Remove the item if it already exists
      const filteredItems = recentItems.filter(
        (existingItem) =>
          existingItem.study_material_id !== item.study_material_id
      );

      // Add the new item at the beginning (most recent)
      const updatedItems = [item, ...filteredItems].slice(0, MAX_ITEMS);

      // Store stringified version
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
      console.log(`Saved ${updatedItems.length} items to recently opened`);
    } catch (error) {
      console.error("Error adding to recently opened:", error);
    }
  },

  // Clear all recently opened items
  clearRecentlyOpened: (): void => {
    if (!isLocalStorageAvailable()) return;
    localStorage.removeItem(STORAGE_KEY);
    console.log("Cleared recently opened items");
  },

  // Debug method to log current state
  debugStorage: (): void => {
    if (!isLocalStorageAvailable()) {
      console.log("localStorage is not available");
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      console.log(
        "Current storage content:",
        stored ? JSON.parse(stored) : "empty"
      );
    } catch (error) {
      console.error("Error debugging storage:", error);
    }
  },
};
