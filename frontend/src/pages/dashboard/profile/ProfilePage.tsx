import ProfileHeader from "./ProfileHeader";
import Statictics from "./Statistics";
import Achievements from "./Achievements";
import Leaderboards from "./Leaderboards";
import DocumentHead from "../../../components/DocumentHead";
import PageTransition from "../../../styles/PageTransition";

const Profile = () => {
  return (
    <PageTransition>
      <DocumentHead title="Profile | Duel Learn" />
      <div className="h-full w-full text-white">
        {/* Profile Header */}
        <ProfileHeader />

        {/* Statistics Section */}
        <Statictics />

        {/* Achievements Section */}
        <Achievements />

        {/* Leaderboards Section */}
        <Leaderboards />
      </div>
    </PageTransition>
  );
};

export default Profile;
