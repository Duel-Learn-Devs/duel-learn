import { useState, useEffect } from "react";

const useCountdown = (initialTime: number | null) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(initialTime);

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev && prev > 1000) {
            return prev - 1000;
          } else {
            clearInterval(interval);
            return null;
          }
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeRemaining]);

  return timeRemaining;
};

export default useCountdown;
