import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Question } from "../types";

// Define StudyMaterial interface directly without importing the conflicting one
interface StudyMaterial {
  study_material_id: string;
  title: string;
  tags: string[];
  summary: string;
  total_items: number;
  items: {
    term: string;
    definition: string;
  }[];
}

interface UseGameLogicProps {
  mode: string;
  material: StudyMaterial;
  selectedTypes: string[];
  timeLimit?: number | null;
  aiQuestions?: Question[];
  isGameReady?: boolean;
}

export const useGameLogic = ({
  mode,
  material,
  selectedTypes,
  timeLimit,
  aiQuestions,
  isGameReady = false,
}: UseGameLogicProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [inputAnswer, setInputAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [startTime] = useState(new Date());
  const [timerProgress, setTimerProgress] = useState(100);
  const [questionTimer, setQuestionTimer] = useState<number | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [unmasteredCount, setUnmasteredCount] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [retakeQuestions, setRetakeQuestions] = useState<any[]>([]);
  const [isInRetakeMode, setIsInRetakeMode] = useState(false);
  const [retakePhase, setRetakePhase] = useState(0); // Track retake phases
  const [masteredQuestions, setMasteredQuestions] = useState<string[]>([]); // Track mastered questions
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isQuestionInitiallyLoaded, setIsQuestionInitiallyLoaded] =
    useState(false); // Flag to track initial question load
  const [seenQuestions, setSeenQuestions] = useState<Set<string>>(new Set()); // Track seen questions to prevent duplicates
  const [processedQuestionIds, setProcessedQuestionIds] = useState<Set<string>>(
    new Set()
  ); // Track which questions have been processed
  const [questionDisplayOrder, setQuestionDisplayOrder] = useState<string[]>(
    []
  ); // Track the order of questions to display
  const [lastProcessedQuestionId, setLastProcessedQuestionId] = useState<
    string | null
  >(null); // Track the last processed question ID
  const [uniqueQuestionIds, setUniqueQuestionIds] = useState<Set<string>>(
    new Set()
  );
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(
    null
  );

  const navigate = useNavigate();

  // Remove filteredQuestions since we're using AI questions now
  // Update isLastQuestion to only use AI questions logic
  const isLastQuestion = isInRetakeMode
    ? questionIndex === retakeQuestions.length - 1
    : aiQuestions
    ? questionIndex === aiQuestions.length - 1
    : false;

  // Add a debug log when hook first loads with props
  useEffect(() => {
    console.log("useGameLogic initialized with props:", {
      mode,
      materialTitle: material?.title,
      selectedTypes,
      timeLimit,
      aiQuestionsCount: aiQuestions?.length || 0,
    });

    if (aiQuestions) {
      console.log("AI questions received in hook:", aiQuestions);
    }
  }, []);

  // Add a function to initialize the question display order
  useEffect(() => {
    // Initialize the question display order with all questions
    if (
      aiQuestions &&
      aiQuestions.length > 0 &&
      questionDisplayOrder.length === 0
    ) {
      console.log("Initializing question display order");

      // Create a unique ID for each question
      const questionIds = aiQuestions.map((q) => {
        // Support both correctAnswer and answer fields
        const questionId = `${q.question}-${q.correctAnswer || q.answer}`;
        return questionId;
      });

      // Shuffle the question IDs to randomize the order
      const shuffledIds = [...questionIds].sort(() => Math.random() - 0.5);

      console.log(`Created display order with ${shuffledIds.length} questions`);
      setQuestionDisplayOrder(shuffledIds);
    }
  }, [aiQuestions, questionDisplayOrder.length]);

  const processQuestion = (rawQuestion: any) => {
    console.log("Processing raw question:", rawQuestion);

    // Ensure we preserve the answer field correctly
    const correctAnswer = rawQuestion.correctAnswer || rawQuestion.answer;

    // Determine the type of options (object or array)
    let processedOptions = rawQuestion.options;

    // If options is a string (JSON), try to parse it
    if (typeof rawQuestion.options === "string") {
      try {
        processedOptions = JSON.parse(rawQuestion.options);
        console.log("Parsed options from JSON string:", processedOptions);
      } catch (e) {
        console.error("Failed to parse options JSON:", e);
      }
    }

    return {
      questionType: rawQuestion.questionType || rawQuestion.type,
      type: rawQuestion.type,
      question: rawQuestion.question,
      correctAnswer: correctAnswer, // Use the preserved answer
      answer: correctAnswer, // Keep both for compatibility
      options: processedOptions,
      rawOptions: rawQuestion.rawOptions,
      itemInfo: rawQuestion.itemInfo || {
        image: rawQuestion.image,
        term: rawQuestion.term,
        definition: rawQuestion.definition,
        itemId: rawQuestion.item_id,
        itemNumber: rawQuestion.item_number,
      },
    };
  };

  const handleGameComplete = () => {
    const totalItems = material?.items?.length || 0;

    console.log("Game completion triggered:", {
      masteredCount,
      totalItems,
      retakeQuestionsCount: retakeQuestions.length,
      isInRetakeMode,
    });

    // Force immediate game completion - no additional checks
    console.log("Navigating to session summary immediately");

    const endTime = new Date();
    const timeDiff = endTime.getTime() - startTime.getTime();
    const minutes = Math.floor(timeDiff / 60000);
    const seconds = Math.floor((timeDiff % 60000) / 1000);
    const timeSpent = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

    // Navigate directly to summary with actual counts
    navigate("/dashboard/study/session-summary", {
      state: {
        timeSpent,
        correctCount,
        incorrectCount,
        mode,
        material,
        highestStreak,
        masteredCount,
        unmasteredCount,
        totalQuestions: totalItems,
        aiQuestions: aiQuestions || [],
      },
    });
  };

  useEffect(() => {
    if (!aiQuestions || aiQuestions.length === 0 || isTransitioning) {
      console.log("Skipping question processing:", {
        hasQuestions: !!aiQuestions,
        questionsLength: aiQuestions?.length,
        isTransitioning,
      });
      return;
    }

    // Skip processing if showing results
    if (showResult) {
      console.log("Not updating current question - showing results");
      return;
    }

    // Debug log retake questions
    if (retakeQuestions.length > 0) {
      console.log(
        `Current retake questions (${retakeQuestions.length}):`,
        retakeQuestions.map(
          (q) => `${q.question}-${q.correctAnswer || q.answer}`
        )
      );
    }

    const processCurrentQuestion = () => {
      // Quick check - if all items are mastered, end the game immediately
      const totalItems = material?.items?.length || 0;
      if (masteredCount >= totalItems) {
        console.log(
          "All items are mastered, ending game from processCurrentQuestion"
        );
        handleGameComplete();
        return;
      }

      let questionToProcess: any = null;
      let newQuestionId: string | null = null;

      console.log("Processing current question:", {
        isInRetakeMode,
        questionIndex,
        retakeQuestionsLength: retakeQuestions.length,
        questionsLength: aiQuestions?.length || 0,
        masteredCount,
        totalItems: material?.items?.length,
      });

      // Simplified approach: In normal mode, directly use the aiQuestions array
      if (isInRetakeMode && retakeQuestions.length > 0) {
        // In retake mode, process questions from retake list
        if (questionIndex < retakeQuestions.length) {
          questionToProcess = retakeQuestions[questionIndex];
          if (questionToProcess) {
            newQuestionId = `${questionToProcess.question}-${
              questionToProcess.correctAnswer || questionToProcess.answer
            }`;
            console.log("Found retake question:", {
              questionId: newQuestionId,
              questionIndex,
              retakeQuestionsLength: retakeQuestions.length,
            });
          } else {
            console.log(
              "No question found at index",
              questionIndex,
              "in retake list"
            );
          }
        } else {
          console.log(
            "Question index",
            questionIndex,
            "out of bounds for retake list length",
            retakeQuestions.length
          );
        }
      } else {
        // In normal mode, directly use the aiQuestions array by index
        if (aiQuestions && questionIndex < aiQuestions.length) {
          questionToProcess = aiQuestions[questionIndex];
          if (questionToProcess) {
            newQuestionId = `${questionToProcess.question}-${
              questionToProcess.correctAnswer || questionToProcess.answer
            }`;
            console.log("Found normal mode question by direct index:", {
              questionId: newQuestionId,
              questionIndex,
              questionsLength: aiQuestions.length,
            });
          } else {
            console.log(
              "Question at index",
              questionIndex,
              "is null or undefined"
            );
          }
        } else {
          console.log(
            "Question index",
            questionIndex,
            "out of bounds for questions length",
            aiQuestions?.length || 0
          );
        }
      }

      // If no question found at current index, handle completion or mode switch
      if (!questionToProcess) {
        console.log("No question found, handling completion/mode switch:", {
          isInRetakeMode,
          questionIndex,
          masteredCount,
          totalItems: material?.items?.length,
          retakeQuestionsLength: retakeQuestions.length,
        });

        // Check if all questions are mastered, and if so, end the game immediately
        const totalItems = material?.items?.length || 0;
        if (masteredCount >= totalItems) {
          console.log("All items mastered, ending game immediately");
          handleGameComplete();
          return;
        }

        if (isInRetakeMode) {
          // If in retake mode and no questions found
          if (retakeQuestions.length === 0) {
            // No more retake questions, check if we should end the game or go back to normal mode
            if (masteredCount >= (material?.items?.length || 0)) {
              console.log("All items mastered in retake mode, completing game");
              handleGameComplete();
            } else {
              // Switch back to normal mode if there are still unmastered questions
              console.log("No more retake questions, switching to normal mode");
              setIsInRetakeMode(false);
              setQuestionIndex(0);
            }
          } else if (questionIndex >= retakeQuestions.length) {
            // Index out of bounds for retake questions, reset to beginning
            console.log("Retake index out of bounds, resetting to beginning");
            setQuestionIndex(0);
          }
        } else {
          // In normal mode, check if we should switch to retake mode
          if (
            retakeQuestions.length > 0 &&
            questionIndex >= (aiQuestions?.length || 0) - 1
          ) {
            console.log(
              "End of normal questions with retake items, switching to retake mode"
            );
            setIsInRetakeMode(true);
            setQuestionIndex(0);
          } else if (masteredCount >= (material?.items?.length || 0)) {
            console.log("All items mastered in normal mode, completing game");
            handleGameComplete();
          } else if (questionIndex >= (aiQuestions?.length || 0)) {
            // We've gone through all questions, reset to beginning
            console.log("End of normal questions, resetting to beginning");
            setQuestionIndex(0);
          } else {
            // Otherwise, just increment the index and try again
            console.log(
              "Incrementing question index to find next valid question"
            );
            setQuestionIndex((prev) => prev + 1);
          }
        }
        return;
      }

      // Process the found question
      if (questionToProcess && newQuestionId !== currentQuestionId) {
        console.log("Processing new question:", {
          questionId: newQuestionId,
          currentQuestionId,
          isInRetakeMode,
        });
        const processedQuestion = processQuestion(questionToProcess);
        setCurrentQuestion(processedQuestion);
        if (newQuestionId) {
          setCurrentQuestionId(newQuestionId);
          setProcessedQuestionIds((prev) => new Set(prev).add(newQuestionId));
          setUniqueQuestionIds((prev) => {
            const newSet = new Set(prev);
            newSet.add(newQuestionId);
            return newSet;
          });
        }
        setIsQuestionInitiallyLoaded(true);
      } else {
        console.log(
          "Skipping question processing - same question or no new question ID:",
          {
            questionId: newQuestionId,
            currentQuestionId,
          }
        );
      }
    };

    // Add a check to prevent infinite loops
    const shouldProcess =
      !isTransitioning && !showResult && (aiQuestions?.length || 0) > 0;
    if (shouldProcess) {
      processCurrentQuestion();
    }
  }, [
    aiQuestions,
    questionIndex,
    isInRetakeMode,
    retakeQuestions.length,
    showResult,
    isTransitioning,
    currentQuestionId,
    material?.items?.length,
    masteredCount,
    handleGameComplete,
  ]);

  // Timer logic for Time Pressured mode
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (mode === "Time Pressured" && timeLimit && !showResult && isGameReady) {
      setQuestionTimer(timeLimit);
      setTimerProgress(100);
      setRetakeQuestions([]); // Clear retake questions for Time Pressured mode

      timer = setInterval(() => {
        setQuestionTimer((prev) => {
          if (prev === null || prev <= 0) {
            clearInterval(timer);
            if (!showResult) {
              // Mark the current question as incorrect
              if (currentQuestion) {
                currentQuestion.isCorrect = false;
              }
              // Submit empty answer to trigger incorrect result
              handleAnswerSubmit("");
              // Show the next question button
              setShowResult(true);
              setShowNextButton(true);
            }
            return 0;
          }
          const progress = ((prev - 1) / timeLimit) * 100;
          setTimerProgress(progress);
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [currentQuestionIndex, timeLimit, showResult, mode, isGameReady, currentQuestion]);

  const handleAnswerSubmit = (answer: string) => {
    if (showResult || !currentQuestion) return;

    // Get correct answer - with fallbacks
    let correctAnswer = currentQuestion.correctAnswer || currentQuestion.answer;

    // Handle special case for multiple-choice: correctAnswer might be in format "A. term"
    if (
      currentQuestion.questionType === "multiple-choice" &&
      typeof correctAnswer === "string" &&
      correctAnswer.includes(". ")
    ) {
      // Extract just the term part after the letter
      const answerParts = correctAnswer.split(". ");
      if (answerParts.length > 1) {
        correctAnswer = answerParts.slice(1).join(". ").trim();
        console.log(
          `Using extracted multiple-choice answer: "${correctAnswer}" from "${currentQuestion.correctAnswer}"`
        );
      }
    }

    // Multi-stage fallback for correct answer
    if (!correctAnswer && currentQuestion.itemInfo?.term) {
      correctAnswer = currentQuestion.itemInfo.term;
      console.log(`Using term as fallback answer: "${correctAnswer}"`);
    }

    if (!correctAnswer) {
      console.error("No correct answer found for question:", currentQuestion);
      return;
    }

    // For multiple-choice questions, check if the selected answer matches ANY of the options
    // that contain the correct answer (to handle options stored in different formats)
    let isAnswerCorrect = false;

    // Safe string conversion for comparison
    const answerString = String(answer || "")
      .toLowerCase()
      .trim();
    const correctAnswerString = String(correctAnswer).toLowerCase().trim();

    if (
      currentQuestion.questionType === "multiple-choice" &&
      currentQuestion.options
    ) {
      console.log(
        `Handling multiple-choice comparison for "${answerString}" against correct "${correctAnswerString}"`
      );

      // Check if the answer matches the correct answer directly
      if (answerString === correctAnswerString) {
        isAnswerCorrect = true;
      }
      // Also check if any option contains the correct answer (handle mixed formats)
      else if (
        typeof currentQuestion.options === "object" &&
        !Array.isArray(currentQuestion.options)
      ) {
        // Handle object format {A: "option1", B: "option2"}
        Object.entries(currentQuestion.options).forEach(
          ([key, optionValue]) => {
            const optionString = String(optionValue || "")
              .toLowerCase()
              .trim();
            // Check if this option contains the correct answer
            if (
              optionString === correctAnswerString &&
              answerString === optionString
            ) {
              console.log(`Found matching option ${key}: "${optionString}"`);
              isAnswerCorrect = true;
            }
          }
        );
      }
      // Handle array format ["option1", "option2"]
      else if (Array.isArray(currentQuestion.options)) {
        for (const option of currentQuestion.options) {
          const optionString = String(option || "")
            .toLowerCase()
            .trim();
          if (
            optionString === correctAnswerString &&
            answerString === optionString
          ) {
            console.log(`Found matching option in array: "${optionString}"`);
            isAnswerCorrect = true;
            break;
          }
        }
      }

      console.log(
        `Multiple-choice answer result: ${
          isAnswerCorrect ? "CORRECT" : "INCORRECT"
        }`
      );
    } else {
      // For non-multiple-choice questions, simple string comparison
      console.log(
        `Comparing answer "${answerString}" with correct answer "${correctAnswerString}"`
      );
      isAnswerCorrect = answerString === correctAnswerString;
    }

    setIsCorrect(isAnswerCorrect);
    setShowResult(true);

    if (isAnswerCorrect) {
      setCorrectCount((prev) => prev + 1);
      setCurrentStreak((prev) => {
        const newStreak = prev + 1;
        if (newStreak > highestStreak) {
          setHighestStreak(newStreak);
        }
        return newStreak;
      });
      setShowNextButton(false);
    } else {
      setIncorrectCount((prev) => prev + 1);
      setCurrentStreak(0);
      setShowNextButton(true);

      // Automatically mark incorrect answers as unmastered
      const questionId = `${currentQuestion.question}-${currentQuestion.correctAnswer}`;

      // Remove from mastered list if it was there
      if (masteredQuestions.includes(questionId)) {
        setMasteredQuestions((prev) => prev.filter((id) => id !== questionId));
        setMasteredCount((prev) => Math.max(0, prev - 1));
      }

      // Add to retake list if not already there
      const isAlreadyInRetakeList = retakeQuestions.some(
        (q) =>
          q.question === currentQuestion.question &&
          q.correctAnswer === currentQuestion.correctAnswer
      );

      if (!isAlreadyInRetakeList) {
        setUnmasteredCount((prev) => prev + 1);
        setRetakeQuestions((prev) => [...prev, currentQuestion]);
      }
    }

    setSelectedAnswer(answer);
    setIsFlipped(true);
    setShowNextButton(true);
  };

  const handleRevealAnswer = () => {
    if (showResult) return;

    console.log("User revealed answer without attempting a solution");

    // First, reveal the current question's answer
    setIsCorrect(false);
    setIncorrectCount((prev) => prev + 1);
    setCurrentStreak(0);
    setShowResult(true);
    setShowNextButton(true);
    setIsFlipped(true);

    // Add revealed question to retake list if not already in it
    if (
      !retakeQuestions.some(
        (q) =>
          q.question === currentQuestion.question &&
          q.correctAnswer === currentQuestion.correctAnswer
      )
    ) {
      setRetakeQuestions((prev) => [...prev, currentQuestion]);
    }

    // Do NOT automatically move to the next question
    // The user must click "Next Question", "Mastered", or "Retake" button
  };

  // Modify handleNextQuestion to properly handle transitions
  const handleNextQuestion = () => {
    if (isTransitioning) return;

    const totalItems = material?.items?.length || 0;

    // Check if the game should end (all questions mastered)
    // This is a direct check - we end immediately if all items are mastered
    if (masteredCount >= totalItems) {
      console.log(
        "All items mastered in handleNextQuestion, ending game immediately"
      );
      handleGameComplete();
      return;
    }

    setIsTransitioning(true);
    setShowResult(false);
    setIsFlipped(false);
    setInputAnswer("");

    if (isInRetakeMode) {
      // In retake mode
      if (retakeQuestions.length === 0) {
        // No more retake questions, end game if all mastered
        if (masteredCount >= totalItems) {
          console.log("All questions mastered in retake mode, ending game");
          handleGameComplete();
          return;
        } else {
          // Switch back to normal mode
          console.log("No retake questions left, switching to normal mode");
          setIsInRetakeMode(false);
          setQuestionIndex(0);
        }
      } else if (questionIndex < retakeQuestions.length - 1) {
        // Move to next retake question
        setQuestionIndex((prev) => prev + 1);
      } else {
        // At the end of retake questions, start over
        setQuestionIndex(0);
      }
    } else {
      // In normal mode
      if (questionIndex < (aiQuestions?.length || 0) - 1) {
        // Move to next question
        setQuestionIndex((prev) => prev + 1);
      } else {
        // Reached the end of normal questions
        if (retakeQuestions.length > 0) {
          // If we have retake questions, switch to retake mode
          console.log(
            "Normal mode completed. Switching to retake mode with",
            retakeQuestions.length,
            "questions"
          );
          setIsInRetakeMode(true);
          setQuestionIndex(0);
          setRetakePhase((prev) => prev + 1);
        } else if (masteredCount >= totalItems) {
          // All questions mastered, complete the game
          console.log("All questions mastered in normal mode, completing game");
          handleGameComplete();
          return;
        } else {
          // Otherwise, cycle back to the beginning of normal mode
          console.log(
            "Cycling back to beginning of normal mode (no retake questions)"
          );
          setQuestionIndex(0);
        }
      }
    }

    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  // Add resetQuestionState function
  const resetQuestionState = () => {
    setIsTransitioning(true);
    setShowResult(false);
    setIsFlipped(false);
    setInputAnswer("");
    setSelectedAnswer(null);
    setShowNextButton(false);
    setIsCorrect(null);
    setIsQuestionInitiallyLoaded(false);
    setCurrentQuestionId(null);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const handleMastered = () => {
    // Create a unique identifier for this question
    const questionId = `${currentQuestion.question}-${currentQuestion.correctAnswer}`;
    const totalItems = material?.items?.length || 0;

    console.log("Processing mastered question:", {
      questionId,
      currentMasteredCount: masteredCount,
      totalItems,
      retakeQuestionsCount: retakeQuestions.length,
    });

    // Calculate the new mastered count immediately for logic checks
    let newMasteredCount = masteredCount;

    // Only increment mastered count if not already mastered
    if (!masteredQuestions.includes(questionId)) {
      // Calculate the new value first
      newMasteredCount = masteredCount + 1;

      // Then update the state
      setMasteredQuestions((prev) => [...prev, questionId]);
      setMasteredCount(newMasteredCount);

      // Immediately remove from retake list
      let newRetakeLength = retakeQuestions.length;
      const wasInRetakeList = retakeQuestions.some((q) => {
        const currentId = `${q.question}-${q.correctAnswer || q.answer}`;
        return currentId === questionId;
      });

      if (wasInRetakeList) {
        console.log("Removing question from retake list:", questionId);
        newRetakeLength -= 1;
        setRetakeQuestions((prev) => {
          const filtered = prev.filter((q) => {
            const currentId = `${q.question}-${q.correctAnswer || q.answer}`;
            return currentId !== questionId;
          });
          console.log(`Retake list updated. New length: ${filtered.length}`);
          return filtered;
        });

        // Update unmastered count if it was in retake list
        setUnmasteredCount((prev) => Math.max(0, prev - 1));
      }

      // Check if this was the last item to master using our calculated value (not the state)
      if (newMasteredCount >= totalItems) {
        console.log("Last item mastered, ending game immediately");
        handleGameComplete();
        return;
      }
    } else {
      console.log("Question already marked as mastered:", questionId);
    }

    // Only proceed to next question if we didn't complete the game
    handleNextQuestion();
  };

  const handleUnmastered = () => {
    // Create a unique identifier for this question
    const questionId = `${currentQuestion.question}-${currentQuestion.correctAnswer}`;

    console.log("Marking question as unmastered:", {
      questionId,
      currentUnmasteredCount: unmasteredCount,
      isAlreadyInRetakeList: retakeQuestions.some(
        (q) =>
          q.question === currentQuestion.question &&
          q.correctAnswer === currentQuestion.correctAnswer
      ),
    });

    // Remove from mastered list if it was there
    if (masteredQuestions.includes(questionId)) {
      setMasteredQuestions((prev) => prev.filter((id) => id !== questionId));
      setMasteredCount((prev) => Math.max(0, prev - 1));
    }

    // Only add to retake list and increment unmastered if not already there
    const isAlreadyInRetakeList = retakeQuestions.some(
      (q) =>
        q.question === currentQuestion.question &&
        q.correctAnswer === currentQuestion.correctAnswer
    );

    if (!isAlreadyInRetakeList) {
      console.log("Adding question to retake list:", questionId);
      setUnmasteredCount((prev) => prev + 1);

      // Use a callback to ensure we have the latest state
      setRetakeQuestions((prev) => {
        const updatedList = [...prev, currentQuestion];
        console.log(`Retake list updated. New length: ${updatedList.length}`);
        return updatedList;
      });
    } else {
      console.log("Question already in retake list:", questionId);
    }

    // Check if we're at the end of normal mode questions
    const isLastNormalQuestion =
      !isInRetakeMode && questionIndex >= (aiQuestions?.length || 0) - 1;

    if (isLastNormalQuestion && retakeQuestions.length > 0) {
      console.log(
        "Last normal question marked as unmastered. Will transition to retake mode."
      );
    }

    handleNextQuestion();
  };

  const getButtonStyle = (option: string) => {
    if (!showResult) {
      return "border-2 border-gray-600";
    }

    // Handle true/false questions differently
    if (currentQuestion?.type === "true-false") {
      const normalizedOption = String(option).toLowerCase();
      const normalizedAnswer = String(
        currentQuestion.correctAnswer
      ).toLowerCase();

      if (normalizedOption === normalizedAnswer) {
        return "border-2 border-[#6DBE45] bg-[#16251C]";
      }
      return "border-2 border-[#FF3B3F] bg-[#39101B]";
    }

    // Handle other question types
    if (
      option?.toLowerCase() === currentQuestion?.correctAnswer?.toLowerCase()
    ) {
      return "border-2 border-[#6DBE45] bg-[#16251C]";
    }
    return "border-2 border-[#FF3B3F] bg-[#39101B]";
  };

  // Add a computed value for retake questions count that includes both initial and new retakes
  const retakeQuestionsCount = retakeQuestions.length;

  console.log("Current question index:", questionIndex);
  console.log("Current question ID:", currentQuestionId);
  console.log("Processed question IDs:", Array.from(processedQuestionIds));
  console.log("Unique question IDs:", Array.from(uniqueQuestionIds));

  if (
    mode === "Time Pressured" &&
    correctCount + incorrectCount >= (aiQuestions?.length || 0)
  ) {
    // Don't end the game if no questions have been loaded yet
    if (aiQuestions?.length === 0) {
      console.log("No questions loaded yet, skipping game completion check");
      return;
    }

    console.log("All questions answered in Time Pressured mode, ending game.");
    handleGameComplete();
    return;
  }

  const handleFlip = () => {
    if (showResult) return;

    console.log("User flipped card to reveal answer");

    // First, reveal the current question's answer
    setIsCorrect(false);
    setIncorrectCount((prev) => prev + 1);
    setCurrentStreak(0);
    setShowResult(true);
    setShowNextButton(true);
    setIsFlipped(true);

    // Add revealed question to retake list if not already in it
    if (
      !retakeQuestions.some(
        (q) =>
          q.question === currentQuestion.question &&
          q.correctAnswer === currentQuestion.correctAnswer
      )
    ) {
      setRetakeQuestions((prev) => [...prev, currentQuestion]);
    }
  };

  return {
    currentQuestion,
    isFlipped,
    selectedAnswer,
    showResult,
    showNextButton,
    correctCount,
    incorrectCount,
    questionTimer,
    timerProgress,
    inputAnswer,
    currentStreak,
    highestStreak,
    timeLimit,
    masteredCount,
    unmasteredCount,
    isCorrect,
    isInRetakeMode,
    retakeQuestionsCount,
    retakePhase,
    isTransitioning,
    handleFlip,
    handleAnswerSubmit,
    handleNextQuestion,
    getButtonStyle,
    setInputAnswer,
    handleMastered,
    handleUnmastered,
    handleRevealAnswer,
    cardDisabled: showResult,
  };
};
