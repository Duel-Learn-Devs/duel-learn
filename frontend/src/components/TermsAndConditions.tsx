import { Link } from "react-router-dom"; // Importing the Link component from React Router
import BunnyWithStar from "/General/bunny-with-star.png"; // Importing the bunny with star image
import PageTransition from "../styles/PageTransition"; // Importing the PageTransition component
import DocumentHead from "./DocumentHead"; // Importing the DocumentHead component

const TermsAndConditions = () => {
  return (
    <PageTransition>
      <DocumentHead title="Terms and Conditions | Duel Learn" />
      <main
        className="flex overflow-y-auto flex-col items-center"
        style={{ backgroundColor: "#080511", height: "100vh" }}
      >
        {/* Main container with flexbox layout, padding, and background color */}
        <header
          className="flex flex-col items-start self-stretch px-16 pt-8 w-full max-md:px-5 max-md:max-w-full"
          style={{ backgroundColor: "rgba(59, 53, 77, 0.5)" }}
        >
          {/* Header section with flexbox layout, padding, and background color */}
          <div className="flex flex-wrap gap-10 w-full max-w-[1544px] max-md:max-w-full">
            {/* Container for header content with flexbox layout and gap */}
            <div
              className="flex gap-6 self-start text-2xl font-bold text-white mt-2"
              style={{ fontFamily: "Nunito" }}
            >
              <div className="relative w-full">
                <header className="relative top-10 left-4 flex items-center">
                  <Link to="/" className="flex items-center space-x-4">
                    <img
                      src="/duel-learn-logo.svg"
                      className="w-10 h-10"
                      alt="icon"
                    />
                    <p className="text-white text-xl font-semibold">
                      Duel Learn
                    </p>
                  </Link>
                </header>
              </div>
            </div>
            <div className="flex-auto max-md:max-w-full">
              {/* Container for images with flexbox layout */}
              <div className="flex gap-5 max-md:flex-col">
                {/* Container for images with flexbox layout and gap */}

                <div className="ml-auto w-6/12 max-md:ml-0 max-md:w-full">
                  {/* Container for bunny with star image with specific width */}
                  <img
                    loading="lazy"
                    src={BunnyWithStar} // Using the imported bunny with star image
                    className="object-contain max-md:mt-10 max-md:max-w-full mx-auto"
                    style={{
                      width: "345px",
                      height: "250px",
                      marginTop: "30px",
                    }} // Adjusted size proportionally and moved lower
                    alt="Bunny with star" // Alt text for the image
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="flex flex-col items-start max-w-[936px] w-full px-4">
          {/* Section container with flexbox layout, padding, and specific width */}
          <h2
            className="mt-28 text-5xl font-bold text-white max-md:mt-10 max-md:max-w-full"
            style={{ fontSize: "48px", fontFamily: "Nunito" }}
          >
            {/* Heading with margin, font size, and color */}
            Terms and Conditions
          </h2>

          <p
            className="mt-4 text-2xl text-white"
            style={{ fontSize: "20px", fontFamily: "Nunito" }}
          >
            {/* Paragraph with margin, font size, and color */}
            Last Updated: 09 February 2025
          </p>

          <p
            className="mt-10 text-2xl text-white max-md:mt-8 max-md:max-w-full"
            style={{ fontSize: "20px", fontFamily: "Nunito" }}
          >
            {/* Paragraph with margin, font size, and color */}
            Welcome to the Duel Learn Platform. By accessing or using our
            platform, you agree to be bound by these Terms and Conditions
            ("Terms"). If you do not agree with any part of these Terms, you
            should not use the platform.
          </p>

          <article
            className="mt-10 text-2xl text-white max-md:mt-8 max-md:max-w-full"
            style={{ fontSize: "20px", fontFamily: "Nunito" }}
          >
            {/* Article with margin, font size, and color */}
            <h3>1. Acceptance of Terms</h3>
            <p style={{ fontSize: "20px", fontFamily: "Nunito" }}>
              By registering, accessing, or using Duel Learn, you confirm that
              you have read, understood, and agree to these Terms. If you are
              under the age of <em>13</em>, you must have parental or guardian
              consent to use the platform.
            </p>
          </article>

          <article
            className="mt-10 text-2xl text-white max-md:mt-8 max-md:max-w-full"
            style={{ fontSize: "20px", fontFamily: "Nunito" }}
          >
            {/* Article with margin, font size, and color */}
            <h3>2. Account Registration</h3>
            <ul
              className="list-disc pl-6"
              style={{ fontSize: "18px", fontFamily: "Nunito" }}
            >
              {/* Unordered list with disc style and padding */}
              <li>
                You must provide accurate and complete information when creating
                an account.
              </li>
              <li>
                You are responsible for maintaining the security of your account
                and any activity under it.
              </li>
              <li>
                We reserve the right to suspend or terminate accounts that
                violate these Terms.
              </li>
            </ul>
          </article>

          <article
            className="mt-10 text-2xl text-white max-md:mt-8 max-md:max-w-full"
            style={{ fontSize: "20px", fontFamily: "Nunito" }}
          >
            {/* Article with margin, font size, and color */}
            <h3>3. Use of the Platform</h3>
            <ul
              className="list-disc pl-6"
              style={{ fontSize: "18px", fontFamily: "Nunito" }}
            >
              {/* Unordered list with disc style and padding */}
              <li>
                Users can create and share study materials, participate in PvP
                quiz battles, and interact with other users.
              </li>
              <li>
                You agree not to misuse the platform, including engaging in
                cheating, harassment, or unauthorized data scraping.
              </li>
              <li>
                Any attempt to manipulate game results, use bots, or exploit
                platform mechanics will result in account suspension.
              </li>
            </ul>
          </article>

          <article
            className="mt-10 text-2xl text-white max-md:mt-8 max-md:max-w-full"
            style={{ fontSize: "20px", fontFamily: "Nunito" }}
          >
            {/* Article with margin, font size, and color */}
            <h3>4. User-Generated Content</h3>
            <ul
              className="list-disc pl-6"
              style={{ fontSize: "18px", fontFamily: "Nunito" }}
            >
              {/* Unordered list with disc style and padding */}
              <li>
                You retain ownership of the study materials and content you
                create.
              </li>
              <li>
                By posting content, you grant us a non-exclusive, royalty-free
                license to use, modify, and display your content to operate the
                platform.
              </li>
              <li>
                We are not responsible for the accuracy or quality of
                user-generated content.
              </li>
            </ul>
          </article>

          <div className="flex shrink-0 mt-20 max-w-full bg-zinc-300 h-[312px] w-[1108px] max-md:mt-8" />
          {/* Divider with margin, background color, and specific height and width */}
        </section>
      </main>
    </PageTransition>
  );
};

export default TermsAndConditions;
