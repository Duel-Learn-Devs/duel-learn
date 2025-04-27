import { useEffect } from "react";
import { getIntroAnimationDuration } from "../utils/getCharacterImage";

import characterPicking from "/characterinLobby/CharacterPicking.gif"; // Initial picking animation
import characterPickingLoop from "/characterinLobby/CharacterPickingLoop.gif"; // Loop animation
import correctAnswerAnimation from "/GameBattle/correctAnswerAnimationCharacter.gif"; // Correct answer animation
import incorrectAnswerAnimation from "/GameBattle/incorrectAnswerAnimationCharacter.gif"; // Incorrect answer animation
import beenAttackedAnimation from "/GameBattle/BeenAttacked.gif"; // Been attacked animation
import selectedCardCharacterLooping from "/GameBattle/selectedCardCharacterLooping.gif"; // Selected card animation

interface CharacterAnimationManagerProps {
  playerAnimationState: string;
  enemyAnimationState: string;
  setPlayerPickingIntroComplete: (value: boolean) => void;
  setEnemyPickingIntroComplete: (value: boolean) => void;
  playerPickingIntroComplete: boolean;
  enemyPickingIntroComplete: boolean;
}

export default function CharacterAnimationManager({
  playerAnimationState,
  enemyAnimationState,
  setPlayerPickingIntroComplete,
  setEnemyPickingIntroComplete,
  playerPickingIntroComplete,
  enemyPickingIntroComplete,
}: CharacterAnimationManagerProps) {
  // Handle completion of picking intro animation for player - only runs ONCE per turn
  useEffect(() => {
    if (playerAnimationState === "picking" && !playerPickingIntroComplete) {
      // Get the intro animation duration from utils
      const introDuration = getIntroAnimationDuration();

      const introTimer = setTimeout(() => {
        // After intro animation completes exactly once, switch to the looping animation
        setPlayerPickingIntroComplete(true);
        console.log(
          "Player picking intro completed, switching to loop animation"
        );
      }, introDuration);

      return () => clearTimeout(introTimer);
    }
  }, [
    playerAnimationState,
    playerPickingIntroComplete,
    setPlayerPickingIntroComplete,
  ]);

  // Handle completion of picking intro animation for enemy - only runs ONCE per turn
  useEffect(() => {
    if (enemyAnimationState === "picking" && !enemyPickingIntroComplete) {
      // Get the intro animation duration from utils
      const introDuration = getIntroAnimationDuration();

      const introTimer = setTimeout(() => {
        // After intro animation completes exactly once, switch to the looping animation
        setEnemyPickingIntroComplete(true);
        console.log(
          "Enemy picking intro completed, switching to loop animation"
        );
      }, introDuration);

      return () => clearTimeout(introTimer);
    }
  }, [
    enemyAnimationState,
    enemyPickingIntroComplete,
    setEnemyPickingIntroComplete,
  ]);

  // Component doesn't render anything visible
  return null;
}

// Helper function to get the correct animation image for a character
export function getCharacterImage(
  baseImage: string,
  animationState: string,
  introComplete: boolean
): string {
  if (animationState === "picking") {
    // If in picking state, show intro animation until it completes, then show loop
    return introComplete ? characterPickingLoop : characterPicking;
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
  return baseImage;
}
