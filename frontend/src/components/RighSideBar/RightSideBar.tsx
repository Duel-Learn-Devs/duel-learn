import React from "react";
import { useLocation } from "react-router-dom";

// Importing the necessary content components
import Leaderboards from "./Leaderboards/Leaderboards";
import FriendList from "./FriendList/FriendList";

// Define the possible route paths based on the PrivateRoutes
type RoutePath =
  | "/dashboard/home"
  | "/dashboard/explore"
  | "/dashboard/my-library"
  | "/dashboard/profile"
  | "/dashboard/study-material/create"
  | "/dashboard/shop"
  | "/dashboard/account-settings"
  | "/dashboard/search";

const RightSideBar: React.FC = () => {
  // Make sure to get the location from useLocation hook
  const location = useLocation();

  // Handle dynamic route `/dashboard/study-material/preview/:studyMaterialId`
  const isPreviewRoute = location.pathname.startsWith(
    "/dashboard/study-material/preview/"
  );

  // Handle dynamic route `/dashboard/study-material/view/:studyMaterialId`
  const isViewRoute = location.pathname.startsWith(
    "/dashboard/study-material/view/"
  );

  // Determine whether to show EmptyLB or Leaderboards
  const leaderboardContent = <Leaderboards />;
  const friendListContent = <FriendList />;

  // Mapping route paths to content components
  const contentMap: Partial<Record<RoutePath, JSX.Element>> &
    Record<string, JSX.Element> = {
    "/dashboard/home": (
      <>
        {friendListContent}
        <div className="my-7"></div>
        {leaderboardContent}
      </>
    ),
    "/dashboard/explore": (
      <>
        {friendListContent}
        <div className="my-7"></div>
        {leaderboardContent}
      </>
    ),
    "/dashboard/my-library": (
      <>
        {friendListContent}
        <div className="my-7"></div>
        {leaderboardContent}
      </>
    ),
    "/dashboard/study-material/create": (
      <>
        {friendListContent}
        <div className="my-7"></div>
        {leaderboardContent}
      </>
    ),
    "/dashboard/profile": friendListContent,
    "/dashboard/shop": (
      <>
        {friendListContent}
        <div className="my-7"></div>
        {leaderboardContent}
      </>
    ),
    "/dashboard/search": (
      <>
        {friendListContent}
        <div className="my-7"></div>
        {leaderboardContent}
      </>
    ),
    // Return empty div for account-settings route
    "/dashboard/account-settings": <div></div>,
    "/dashboard/verify-email": <div></div>,
  };

  // Check if we should hide the sidebar completely
  const shouldHideSidebar = location.pathname.includes(
    "/dashboard/account-settings"
  );

  if (shouldHideSidebar) {
    return null; // Return null to completely hide the sidebar
  }

  // Get the content based on the current route
  let content: JSX.Element;

  if (isPreviewRoute) {
    content = (
      <>
        {friendListContent}
        <div className="my-7"></div>
        {leaderboardContent}
      </>
    );
  } else {
    content = contentMap[location.pathname] || <div></div>;
  }

  if (isPreviewRoute || isViewRoute) {
    content = (
      <>
        {friendListContent}
        <div className="my-7"></div>
        {leaderboardContent}
      </>
    );
  } else {
    content = contentMap[location.pathname] || <div></div>;
  }

  return (
    <div className="hidden side-list-navi pr-8 lg:block sm:w-[20rem] md:w-[24rem] mb-10 lg:w-[28rem] p-4 flex-shrink-0">
      {content}
    </div>
  );
};

export default RightSideBar;
