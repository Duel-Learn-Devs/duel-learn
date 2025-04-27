import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const Checkout = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const clientSecret = params.get("client_secret");
    const paymentIntentId = params.get("payment_intent_id");

    if (!clientSecret || !paymentIntentId) {
      setError("Invalid payment information");
      setLoading(false);
      return;
    }

    // Load PayMongo.js script
    const script = document.createElement("script");
    script.src = "https://js.paymongo.com/v2/paymongo.js";
    script.async = true;
    script.onload = () => {
      if (clientSecret && paymentIntentId) {
        initializePayment(clientSecret, paymentIntentId);
      }
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, [location.search]);

  const initializePayment = async (
    clientSecret: string,
    paymentIntentId: string
  ) => {
    try {
      if (typeof window.PayMongo === "undefined") {
        throw new Error("PayMongo SDK not loaded");
      }

      // Initialize PayMongo
      const paymongo = window.PayMongo.init(
        import.meta.env.VITE_PAYMONGO_PUBLIC_KEY as string
      );

      // Create payment method elements
      const elements = paymongo.elements();
      const paymentElement = elements.create("payment", {
        clientKey: clientSecret,
      });

      const paymentElementContainer =
        document.getElementById("payment-element");
      if (paymentElementContainer) {
        paymentElement.mount("#payment-element");
      }
      setLoading(false);

      // Handle form submission
      const form = document.getElementById("payment-form") as HTMLFormElement;
      if (form) {
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          setLoading(true);

          try {
            // Confirm payment
            const result = await paymongo.confirmPaymentIntent({
              id: paymentIntentId,
              client_key: clientSecret,
              return_url: `${window.location.origin}/dashboard/payment-success`,
            });

            if (result.error) {
              setError(result.error.message);
            } else {
              // Payment successful, redirect to success page
              navigate("/dashboard/payment-success");
            }
          } catch (error) {
            setError("Payment failed. Please try again.");
            console.error(error);
          } finally {
            setLoading(false);
          }
        });
      }
    } catch (error) {
      console.error(error);
      setError("Failed to initialize payment.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-[#1E1A29] rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Complete Your Payment</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
      )}

      <form id="payment-form">
        <div id="payment-element" className="mb-6"></div>
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#A38CE6]"></div>
          </div>
        ) : (
          <button
            type="submit"
            className="w-full bg-[#A38CE6] hover:bg-[#8C77D1] text-white py-3 px-4 rounded-md transition-colors duration-300"
          >
            Pay Now
          </button>
        )}
      </form>
    </div>
  );
};

export default Checkout;
