import { useState } from "react";
import axios from "axios";
import { useUser } from "../../../contexts/UserContext";
// API endpoint

type PlanType = "monthly" | "annual";

interface UsePaymentReturn {
  isLoading: boolean;
  error: string | null;
  selectedPlan: PlanType | null;
  selectPlan: (plan: PlanType) => void;
  initiatePayment: () => Promise<void>;
  resetPaymentState: () => void;
}

export const usePayment = (): UsePaymentReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);

  const { user } = useUser();

  const selectPlan = (plan: PlanType) => {
    setSelectedPlan(plan);
    setError(null);
  };

  const initiatePayment = async (): Promise<void> => {
    // Validate necessary data
    if (!selectedPlan) {
      setError("Please select a plan first");
      return;
    }

    if (!user) {
      setError("You must be logged in to subscribe");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call backend to create Xendit invoice
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/payment/create-invoice`,
        {
          firebase_uid: user.firebase_uid,
          email: user.email,
          username: user.username,
          plan: selectedPlan,
        }
      );

      // Redirect to Xendit payment page
      if (response.data && response.data.invoice_url) {
        window.location.href = response.data.invoice_url;
      } else {
        throw new Error("Invalid response from payment server");
      }
    } catch (err) {
      console.error("Payment initiation failed:", err);
      setError("Failed to initialize payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset payment state
   */
  const resetPaymentState = () => {
    setSelectedPlan(null);
    setError(null);
  };

  return {
    isLoading,
    error,
    selectedPlan,
    selectPlan,
    initiatePayment,
    resetPaymentState,
  };
};
