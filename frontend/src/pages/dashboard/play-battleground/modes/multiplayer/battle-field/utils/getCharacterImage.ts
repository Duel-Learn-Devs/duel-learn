// Character animations
import characterPicking from "/characterinLobby/CharacterPicking.gif"; // Initial picking animation
import characterPickingLoop from "/characterinLobby/CharacterPickingLoop.gif"; // Loop animation

/**
 * Get the appropriate character image based on animation state and intro status
 * @param baseImage Base character image
 * @param animationState Current animation state (idle or picking)
 * @param introComplete Whether the intro picking animation has completed
 * @returns The appropriate image source for the character
 */
export function getCharacterImage(
  baseImage: string,
  animationState: string,
  introComplete: boolean
): string {
  if (animationState === "idle") {
    // Use the regular idle animation
    return baseImage;
  } else if (animationState === "picking" && !introComplete) {
    // First play the non-looping "picking" intro animation
    return characterPicking;
  } else if (animationState === "picking" && introComplete) {
    // Then continue with the looping "pickingLoop" animation
    return characterPickingLoop;
  }

  // Default fallback
  return baseImage;
}

/**
 * Calculate intro animation duration
 * @returns Duration in milliseconds for the intro animation
 */
export function getIntroAnimationDuration(): number {
  return 400; // Duration in ms - adjust to match your actual GIF duration
}
