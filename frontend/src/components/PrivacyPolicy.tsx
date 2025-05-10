import { Link } from "react-router-dom"; // Importing the Link component from React Router
import BunnyWithStar from "/General/bunny-with-star.png"; // Importing the bunny with star image
import PageTransition from "../styles/PageTransition"; // Importing the PageTransition component
import DocumentHead from "./DocumentHead"; // Importing the DocumentHead component

const PrivacyPolicy = () => {
  return (
    <PageTransition>
      <DocumentHead title="Privacy Policy | Duel Learn" />
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
            Privacy Policy
          </h2>

          <p
            className="mt-4 text-2xl text-white text-justify"
            style={{ fontSize: "20px", fontFamily: "Nunito" }}
          >
            {/* Paragraph with margin, font size, and color */}
            Last Updated: 20 February 2025
          </p>

          <p
            className="mt-10 text-2xl text-white max-md:mt-8 max-md:max-w-full text-justify"
            style={{ fontSize: "20px", fontFamily: "Nunito" }}
          >
            {/* Paragraph with margin, font size, and color */}
            Welcome to Duel Learn Platform. Your privacy is important to us, and
            we are committed to protecting your personal data. This Privacy
            Policy explains how we collect, use, and share your information when
            you use Duel Learn ("Platform").
          </p>
          <p
            className="mt-10 text-2xl text-white max-md:mt-8 max-md:max-w-full text-justify"
            style={{ fontSize: "20px", fontFamily: "Nunito" }}
          >
            {/* Paragraph with margin, font size, and color */}
            By accessing or using the Platform, you agree to the collection and
            use of your information as described in this Privacy Policy. If you
            do not agree, please do not use the Platform.
          </p>

          <article
            className="mt-10 text-2xl text-white max-md:mt-8 max-md:max-w-full"
            style={{ fontSize: "20px", fontFamily: "Nunito" }}
          >
            {/* Article with margin, font size, and color */}
            <h3>1. Information We Collect</h3>
            <p style={{ fontSize: "20px", fontFamily: "Nunito" }}>
              When you use Duel Learn, we may collect the following types of
              information:
            </p>
            <br />
            <h4>A. Information You Provide</h4>
            <ul
              className="list-disc pl-6"
              style={{ fontSize: "18px", fontFamily: "Nunito" }}
            >
              <li>
                Account Information: When you register, we collect your
                username, email address, password, and any optional profile
                details.
              </li>
              <li>
                Study Materials: Any content you create, upload, or share on the
                Platform, such as flashcards and quizzes.
              </li>
              <li>
                Communications: If you contact us, we may collect messages,
                feedback, or inquiries.
              </li>
            </ul>
            <br />
            <h4>B. Information We Collect Automatically</h4>
            <ul
              className="list-disc pl-6"
              style={{ fontSize: "18px", fontFamily: "Nunito" }}
            >
              <li>
                Usage Data: We collect information about how you interact with
                the Platform, such as pages visited, time spent, and game
                activity.
              </li>
              <li>
                Device Information: We may collect information about your
                device, including IP address, browser type, and operating
                system.
              </li>
            </ul>
            <br />
            <h4>C. Information from Third Parties</h4>
            <p style={{ fontSize: "20px", fontFamily: "Nunito" }}>
              If you choose to log in via third-party services (e.g., Google),
              we may collect information as permitted by those services.
            </p>
          </article>

          <article
            className="mt-10 text-2xl text-white max-md:mt-8 max-md:max-w-full"
            style={{ fontSize: "20px", fontFamily: "Nunito" }}
          >
            {/* Article with margin, font size, and color */}
            <h3>2. How We Use Your Information</h3>
            <ul
              className="list-disc pl-6"
              style={{ fontSize: "18px", fontFamily: "Nunito" }}
            >
              <li>Provide and improve the Duel Learn experience.</li>
              <li>Allow you to create, share, and compete in PvP battles.</li>
              <li>
                Personalize your experience and recommend study materials.
              </li>
              <li>Monitor Platform performance and prevent fraud or abuse.</li>
              <li>Communicate updates, promotions, or important notices.</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </article>

          <article
            className="mt-10 text-2xl text-white max-md:mt-8 max-md:max-w-full"
            style={{ fontSize: "20px", fontFamily: "Nunito" }}
          >
            {/* Article with margin, font size, and color */}
            <h3>3. How We Share Your Information</h3>
            <p style={{ fontSize: "20px", fontFamily: "Nunito" }}>
              We do not sell your personal data. However, we may share
              information in the following cases:
            </p>
            <ul
              className="list-disc pl-6"
              style={{ fontSize: "18px", fontFamily: "Nunito" }}
            >
              <li>
                With Other Users: Your username and study materials may be
                visible to others.
              </li>
              <li>
                With Service Providers: We may share data with third-party
                providers who help operate the Platform (e.g., hosting,
                analytics).
              </li>
              <li>
                For Legal Reasons: If required by law or to protect rights,
                safety, or security.
              </li>
            </ul>
          </article>

          <article
            className="mt-10 text-2xl text-white max-md:mt-8 max-md:max-w-full"
            style={{ fontSize: "20px", fontFamily: "Nunito" }}
          >
            {/* Article with margin, font size, and color */}
            <h3>4. Data Security</h3>
            <p style={{ fontSize: "20px", fontFamily: "Nunito" }}>
              We use reasonable security measures to protect your information.
              However, no method of transmission is 100% secure, so we cannot
              guarantee absolute security.
            </p>
          </article>

          <article
            className="mt-10 text-2xl text-white max-md:mt-8 max-md:max-w-full"
            style={{ fontSize: "20px", fontFamily: "Nunito" }}
          >
            {/* Article with margin, font size, and color */}
            <h3>5. Your Choices and Rights</h3>
            <ul
              className="list-disc pl-6"
              style={{ fontSize: "18px", fontFamily: "Nunito" }}
            >
              <li>
                Editing or Deleting Your Account: You can update or delete your
                account at any time.
              </li>
              <li>
                Opting Out of Communications: You can unsubscribe from emails or
                notifications.
              </li>
            </ul>
            <p style={{ fontSize: "20px", fontFamily: "Nunito" }}>
              For data access or deletion requests, contact us at [Email].
            </p>
          </article>

          <article
            className="mt-10 text-2xl text-white max-md:mt-8 max-md:max-w-full"
            style={{ fontSize: "20px", fontFamily: "Nunito" }}
          >
            {/* Article with margin, font size, and color */}
            <h3>6. Changes to This Policy</h3>
            <p style={{ fontSize: "20px", fontFamily: "Nunito" }}>
              We may update this Privacy Policy from time to time. Continued use
              of the Platform after changes means you accept the revised policy.
            </p>
          </article>

          <article
            className="mt-10 text-2xl text-white max-md:mt-8 max-md:max-w-full"
            style={{ fontSize: "20px", fontFamily: "Nunito" }}
          >
            {/* Article with margin, font size, and color */}
            <h3>7. Contact Us</h3>
            <p style={{ fontSize: "20px", fontFamily: "Nunito" }}>
              If you have any questions about this Privacy Policy, please
              contact us at:
            </p>
            <p style={{ fontSize: "20px", fontFamily: "Nunito" }}>📧 [Email]</p>
            <br />
            <p style={{ fontSize: "20px", fontFamily: "Nunito" }}>
              By using Duel Learn, you acknowledge that you have read and
              understood this Privacy Policy.
            </p>
          </article>

          <div className="flex shrink-0 mt-20 max-w-full bg-zinc-300 h-[312px] w-[1108px] max-md:mt-8" />
          {/* Divider with margin, background color, and specific height and width */}
        </section>
      </main>
    </PageTransition>
  );
};

export default PrivacyPolicy;
