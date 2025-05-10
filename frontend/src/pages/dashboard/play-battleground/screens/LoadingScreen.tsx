import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import cauldronGif from "/General/Cauldron.gif";
import PageTransition from "../../../../styles/PageTransition";
import DocumentHead from "../../../../components/DocumentHead";

export default function LoadingScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, material, selectedTypes, timeLimit } = location.state || {};

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mode === "Peaceful") {
        navigate("/dashboard/study/peaceful-mode", {
          state: {
            mode,
            material,
            selectedTypes,
          },
        });
      } else if (mode === "Time Pressured") {
        navigate("/dashboard/study/time-pressured-mode", {
          state: {
            mode,
            material,
            selectedTypes,
            timeLimit,
          },
        });
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [mode, material, selectedTypes, timeLimit, navigate]);

  console.log(
    "Mode:",
    mode,
    "Material:",
    material,
    "Selected Types:",
    selectedTypes
  );

  return (
    <>
      <DocumentHead title={`${mode} | Duel Learn`} />
      <PageTransition>
        <main className="flex overflow-hidden flex-col justify-center items-center min-h-screen px-10 py-28 max-md:px-2 max-md:py-12">
          <section className="flex flex-col mt-4 items-center max-w-full w-full md:w-[546px] mx-auto px-4">
            <img
              loading="lazy"
              src={cauldronGif}
              className="object-contain max-w-full aspect-square w-[265px] relative z-10"
              alt="Loading animation"
            />
            <h1
              className="mt-8 text-2xl font-extrabold text-white max-md:mt-5"
              style={{ fontFamily: "Nunito" }}
            >
              Loading Questions <span className="dot-1">.</span>
              <span className="dot-2">.</span>
              <span className="dot-3">.</span>
            </h1>
            <p
              className="mt-12 text-xl font-medium text-center text-zinc-400 max-md:mt-5 max-w-[700px]"
              style={{ fontFamily: "Nunito" }}
            >
              {mode === "Time Pressured" ? (
                <span className="text-[#9F9BAE]">
                  Time Pressured Mode for quick thinking and rapid responses.
                  Get ready to showcase your skills, Magician!
                </span>
              ) : (
                <span className="text-[#9F9BAE]">
                  Peaceful Mode for relaxed practice and review. The best way to
                  retain those lessons in your head, Magician.
                </span>
              )}
            </p>
          </section>
        </main>
      </PageTransition>
    </>
  );
}
