import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PasswordSecurity from "/General/PasswordSecurity.png"; // Importing the big star image
import PageTransition from "../../styles/PageTransition"; // Importing the PageTransition component

export default function PasswordChangedSuccessfully() {
  const [countdown, setCountdown] = useState<number | null>(null); // State to manage countdown timer
  const navigate = useNavigate(); // Hook to programmatically navigate to different routes

  useEffect(() => {
    setCountdown(20); // Ensure countdown starts fresh when component mounts
  }, []);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000); // Decrease countdown every second
      return () => clearTimeout(timer); // Clear timer when component unmounts
    }
  }, [countdown]);

  return (
    <PageTransition>
      <main
        className="flex overflow-hidden flex-col items-center justify-center min-h-screen px-10 pt-12 pb-48 max-md:px-2 max-md:pb-12"
        style={{ backgroundColor: "#080511" }}
        // Main container with flexbox layout, padding, and background color
      >
        <div className="flex flex-col max-w-full w-[573px]">
          {/* Container for the content with flexbox layout and specific width */}
          <header className="flex gap-3 self-start text-xl font-bold text-white absolute top-12 left-10 max-md:left-2">
            {/* Header section with flexbox layout, gap, and text styling */}
            <img
              loading="lazy"
              src="/duel-learn-logo.svg" // Use the URL path to reference the asset
              className="object-contain shrink-0 aspect-square w-[37px] h-[37px]" // Increased size
              alt="Duel Learn Logo"
              // Importing Duel Learn logo in SVG format
            />
            <h1 className="my-auto basis-auto" style={{ fontFamily: "Nunito" }}>
              {/* Title with specific styling */}
              Duel Learn
            </h1>
          </header>

          <section className="flex flex-col items-center mt-14 ml-40 max-w-full text-center w-[213px] max-md:mt-5 max-md:ml-5">
            {/* Section container with flexbox layout, margin, and text alignment */}
            <img
              loading="lazy"
              src={PasswordSecurity}
              className="object-contain self-center max-w-full aspect-[1.08] w-[78px]"
              alt="Password security"
              // Importing email sent illustration in SVG format
            />
            <div className="flex flex-col items-center mt-3 max-md:mt-4 max-md:max-w-full w-[400px]">
              {/* Container for the text content with flexbox layout and margin */}
              <h2
                className="text-4xl font-bold text-slate-200 max-md:max-w-full max-md:text-3xl mb-2"
                style={{ fontFamily: "Nunito" }}
              >
                {/* Heading with specific font size and color */}
                Password Changed Successfully!
              </h2>
              <p
                className="mt-2 text-m text-zinc-400 max-md:max-w-full mb-2"
                style={{ fontFamily: "Nunito" }}
              >
                {/* Paragraph with margin, font size, and color */}
                Way to go, magician! You’ve successfully updated your password.
              </p>
            </div>

            <div className="mt-6 text-m font-bold text-slate-200 max-md:mt-5 max-md:mr-1 max-md:max-w-full">
              {/* Container for the button with margin and text styling */}
              <div className="flex flex-col justify-center w-full max-md:max-w-full">
                {/* Container for the button with flexbox layout */}
                <button
                  className="w-[400px] px-5 py-2 bg-violet-700 rounded-xl max-md:px-2 max-md:max-w-full hover:bg-violet-600 transition-colors text-base"
                  onClick={() => navigate("/sign-up")}
                  style={{ fontFamily: "Nunito" }}
                  // Button with specific styling and click event to navigate to sign-up page
                >
                  Back to Sign In ({countdown !== null ? countdown : 20}s)
                  {/* Button text with countdown timer */}
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </PageTransition>
  );
}
