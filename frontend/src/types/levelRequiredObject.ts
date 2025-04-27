export interface LevelRequirement {
  level: number;
  expToNextLevel: number;
  totalExpRequired: number; // Accumulated XP required to reach this level
}

/**
 * Generates level requirements following these rules:
 * - Level 1 to 2: 200 XP
 * - Each subsequent level up to 10 adds 200 more XP
 * - After level 10, each level adds 400 more XP than the previous
 */
export function generateLevelRequirements(
  maxLevel: number = 50
): LevelRequirement[] {
  const requirements: LevelRequirement[] = [];
  let totalExp = 0;

  for (let level = 1; level <= maxLevel; level++) {
    const requirement: LevelRequirement = {
      level,
      expToNextLevel: 0,
      totalExpRequired: totalExp,
    };

    if (level < 10) {
      // Levels 1-9: Each level requires 200 * level XP
      requirement.expToNextLevel = level * 200;
    } else {
      // Level 10+: 1800 + (level-9) * 400
      requirement.expToNextLevel = 1500 + (level - 9) * 200;
    }

    requirements.push(requirement);
    totalExp += requirement.expToNextLevel;
  }

  return requirements;
}

// Helper function to determine level based on total XP
export function getCurrentLevel(
  totalExp: number,
  levels: LevelRequirement[] = DEFAULT_LEVELS
): number {
  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalExp >= levels[i].totalExpRequired) {
      return levels[i].level;
    }
  }
  return 1; // Default to level 1
}

// Default level requirements up to level 50
export const DEFAULT_LEVELS = generateLevelRequirements();
