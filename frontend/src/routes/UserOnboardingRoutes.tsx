import { Routes, Route } from "react-router-dom";
import WelcomePage from "../pages/user-onboarding/WelcomePage";
import TutorialOnePage from "../pages/user-onboarding/TutorialOne";
import TutorialTwo from "../pages/user-onboarding/TutorialTwo";
import TutorialThree from "../pages/user-onboarding/TutorialThree";
import TutorialFour from "../pages/user-onboarding/TutorialFour";
import TutorialFive from "../pages/user-onboarding/TutorialFive";
import TutorialSix from "../pages/user-onboarding/TutorialSix";
import TutorialLast from "../pages/user-onboarding/TutorialLast";
import Personalization from "../pages/user-onboarding/Personalization";

const UserOnboardingRoutes = () => {
  return (
    <Routes>
      <Route path="welcome" element={<WelcomePage />} />
      <Route path="tutorial/step-one" element={<TutorialOnePage />} />
      <Route path="tutorial/step-two" element={<TutorialTwo />} />
      <Route path="tutorial/step-three" element={<TutorialThree />} />
      <Route path="tutorial/step-four" element={<TutorialFour />} />
      <Route path="tutorial/step-five" element={<TutorialFive />} />
      <Route path="tutorial/step-six" element={<TutorialSix />} />
      <Route path="tutorial/last-step" element={<TutorialLast />} />
      <Route path="my-preferences" element={<Personalization />} />
    </Routes>
  );
};

export default UserOnboardingRoutes;
