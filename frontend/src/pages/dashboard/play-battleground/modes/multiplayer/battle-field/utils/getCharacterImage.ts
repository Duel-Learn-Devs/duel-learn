// Character animations
import characterPicking from "/characterinLobby/CharacterPicking.gif"; // Initial picking animation
import characterPickingLoop from "/characterinLobby/CharacterPickingLoop.gif"; // Loop animation
import correctAnswerAnimation from "/GameBattle/correctAnswerAnimationCharacter.gif"; // Correct answer animation
import incorrectAnswerAnimation from "/GameBattle/incorrectAnswerAnimationCharacter.gif"; // Incorrect answer animation
import beenAttackedAnimation from "/GameBattle/BeenAttacked.gif"; // Been attacked animation
import selectedCardCharacterLooping from "/GameBattle/selectedCardCharacterLooping.gif"; // Selected card animation

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
  } else if (animationState === "card_selected") {
    // Show the card selected looping animation
    return selectedCardCharacterLooping;
  } else if (animationState === "correct_answer") {
    // Show correct answer animation
    return correctAnswerAnimation;
  } else if (animationState === "incorrect_answer") {
    // Show incorrect answer animation
    return incorrectAnswerAnimation;
  } else if (animationState === "been_attacked") {
    // Show been attacked animation
    return beenAttackedAnimation;
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
