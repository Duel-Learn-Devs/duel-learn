import React, { memo, useState, useEffect, useRef } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";

interface FlashCardProps {
  question: string;
  correctAnswer: string;
  isFlipped: boolean;
  onFlip: () => void;
  onReveal?: () => void;
  timeRemaining?: number | null;
  type?: "multiple-choice" | "identification" | "true-false";
  disabled?: boolean;
  image?: string | null;
  currentQuestion: {
    itemInfo?: {
      image?: string | null;
      term?: string;
      definition?: string;
      itemId?: number;
      itemNumber?: number;
      studyMaterialId?: string;
    };
    correctAnswer?: string;
    options?: { [key: string]: string } | string[];
    questionType?: "multiple-choice" | "identification" | "true-false";
  } | null;
  isTransitioning?: boolean;
  questionId?: string;
}

const FlashCard: React.FC<FlashCardProps> = memo(
  ({
    question,
    correctAnswer,
    isFlipped,
    onFlip,
    onReveal,
    timeRemaining,
    type,
    disabled = false,
    currentQuestion,
    isTransitioning = false,
    questionId = "",
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [displayedQuestion, setDisplayedQuestion] = useState(question);
    const [displayedAnswer, setDisplayedAnswer] = useState(correctAnswer);
    const [displayedImageUrl, setDisplayedImageUrl] = useState<string | null>(null);
    const [cardOpacity, setCardOpacity] = useState(1);
    const [isTransitioningInternal, setIsTransitioningInternal] = useState(false);
    const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const previousQuestionIdRef = useRef<string>(questionId);
    const isInitialMountRef = useRef(true);

    // Get image URL from currentQuestion.itemInfo and validate it's not null/undefined
    const imageUrl = currentQuestion?.itemInfo?.image || null;
    const hasValidImage = imageUrl && imageUrl !== "null" && !imageUrl.includes("undefined");

    // Add image prefetch check
    useEffect(() => {
      if (hasValidImage && imageUrl) {
        // Try to fetch the image first to check if it's accessible
        fetch(imageUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.blob();
          })
          .then(() => {
            console.log("FlashCard: Image prefetch successful:", imageUrl);
            setDisplayedImageUrl(imageUrl);
            setImageError(false);
          })
          .catch(error => {
            console.error("FlashCard: Image prefetch failed:", {
              imageUrl,
              error: error.message,
              status: error.status,
              statusText: error.statusText
            });
            setImageError(true);
            setDisplayedImageUrl(null);
          });
      }
    }, [imageUrl, hasValidImage]);

    // Add debug logging for image URL
    useEffect(() => {
      if (imageUrl) {
        console.log("FlashCard: Image details:", {
          imageUrl,
          hasValidImage,
          questionInfo: {
            term: currentQuestion?.itemInfo?.term,
            itemNumber: currentQuestion?.itemInfo?.itemNumber,
            studyMaterialId: currentQuestion?.itemInfo?.studyMaterialId
          },
          displayedImageUrl
        });
      }
    }, [imageUrl, currentQuestion, displayedImageUrl]);

    // Clear any existing timeouts when component unmounts
    useEffect(() => {
      return () => {
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }
      };
    }, []);

    // Handle initial mount
    useEffect(() => {
      if (isInitialMountRef.current) {
        setDisplayedQuestion(question);
        setDisplayedAnswer(correctAnswer);
        setDisplayedImageUrl(imageUrl);
        setIsLoading(false);
        isInitialMountRef.current = false;
      }
    }, []);

    // Handle question and answer updates with transition
    useEffect(() => {
      // Skip transition on initial mount
      if (isInitialMountRef.current) {
        return;
      }

      // Only proceed if we have a new question or if the current question has changed
      if (
        questionId !== previousQuestionIdRef.current ||
        question !== displayedQuestion ||
        correctAnswer !== displayedAnswer ||
        imageUrl !== displayedImageUrl
      ) {
        // Set transitioning state
        setIsTransitioningInternal(true);
        setCardOpacity(0);

        // Clear any existing timeout
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }

        // Wait for fade out to complete, then update content
        transitionTimeoutRef.current = setTimeout(() => {
          setDisplayedQuestion(question);
          setDisplayedAnswer(correctAnswer);
          setDisplayedImageUrl(imageUrl);
          setImageLoaded(false);
          previousQuestionIdRef.current = questionId;

          // Fade in with the new content
          setCardOpacity(1);
          setIsLoading(false);
          setIsTransitioningInternal(false);
        }, 300);
      }
    }, [question, correctAnswer, imageUrl, questionId]);

    const handleImageLoad = () => {
      console.log("FlashCard: Image loaded successfully:", displayedImageUrl);
      setImageLoaded(true);
      setImageError(false);
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const imgElement = e.target as HTMLImageElement;
      console.error("FlashCard: Image load failed:", {
        imageUrl: displayedImageUrl,
        naturalWidth: imgElement.naturalWidth,
        naturalHeight: imgElement.naturalHeight,
        error: e,
        currentSrc: imgElement.currentSrc,
        complete: imgElement.complete
      });
      setImageError(true);
      setImageLoaded(false);
    };

    return (
      <div
        className={`w-full max-w-[900px] h-[380px] mt-[-60px] bg-white rounded-lg p-8 relative ${
          disabled ? "cursor-default" : "cursor-pointer"
        }`}
        onDoubleClick={() => !disabled && onFlip && onFlip()}
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d",
          transition: "transform 0.6s",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front of card (Question) */}
        <div
          className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8 bg-white rounded-lg"
          style={{
            backfaceVisibility: "hidden",
            transition: "opacity 0.3s",
            opacity: isFlipped ? 0 : cardOpacity,
          }}
        >
          {isLoading || isTransitioningInternal ? (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-center text-gray-400 text-xl">
                Loading question...
              </p>
            </div>
          ) : (
            <>
              {/* Only render image section if we have a valid image */}
              {hasValidImage && displayedImageUrl && (
                <div className="w-full h-[50%] mb-4 relative flex items-center justify-center">
                  {!imageLoaded && !imageError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                      <span className="text-gray-400">Loading image...</span>
                    </div>
                  )}
                  <img
                    src={displayedImageUrl}
                    alt="Question visual"
                    className={`w-full h-full object-contain rounded-lg transition-opacity duration-300 ${
                      imageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    crossOrigin="anonymous"
                  />
                  {imageError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                      <span className="text-gray-400">Failed to load image</span>
                    </div>
                  )}
                </div>
              )}

              {/* Question Section - adjust height based on whether we have an image */}
              <div
                className={`flex-1 flex items-center justify-center ${
                  hasValidImage && displayedImageUrl ? "h-[45%]" : "h-full"
                }`}
              >
                <p className="text-center text-black text-2xl max-w-[600px]">
                  {displayedQuestion}
                </p>
              </div>

              {/* Reveal Button */}
              <button
                className="absolute bottom-6 right-9 flex items-center space-x-2 text-[#4D18E8] hover:text-[#4D18E8] transition-all duration-200 ease-in-out hover:scale-105 hover:font-bold transform"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onReveal && !disabled) {
                    onReveal();
                  }
                }}
                disabled={disabled}
              >
                <VisibilityIcon className="w-5 h-5 text-[#4D18E8]" />
                <span className="text-sm font-bold text-[#4D18E8]">
                  {disabled ? "ANSWER REVEALED" : "REVEAL ANSWER"}
                </span>
              </button>
            </>
          )}
        </div>

        {/* Back of card (Answer) */}
        <div
          className="absolute inset-0 backface-hidden flex items-center justify-center bg-white rounded-lg"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            transition: "opacity 0.3s",
            opacity:
              isFlipped && !isTransitioning && !isTransitioningInternal
                ? cardOpacity
                : 0,
            display:
              isTransitioning || isTransitioningInternal ? "none" : "flex",
          }}
        >
          <p className="text-center text-black text-3xl font-bold">
            {displayedAnswer}
          </p>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Enhanced memo comparison
    return (
      prevProps.questionId === nextProps.questionId &&
      prevProps.question === nextProps.question &&
      prevProps.correctAnswer === nextProps.correctAnswer &&
      prevProps.isFlipped === nextProps.isFlipped &&
      prevProps.timeRemaining === nextProps.timeRemaining &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.image === nextProps.image &&
      prevProps.currentQuestion?.itemInfo?.image ===
        nextProps.currentQuestion?.itemInfo?.image &&
      prevProps.currentQuestion?.correctAnswer ===
        nextProps.currentQuestion?.correctAnswer &&
      prevProps.isTransitioning === nextProps.isTransitioning
    );
  }
);

export default FlashCard;