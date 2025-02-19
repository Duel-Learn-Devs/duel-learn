import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Home from "../pages/dashboard/home/HomePage";
import Explore from "../pages/dashboard/explore/ExplorePage";
import YourLibrary from "../pages/dashboard/my-library/MyLibrary";
import Profile from "../pages/dashboard/profile/ProfilePage";
import Shop from "../pages/dashboard/shop/ShopPage";
import CreateStudyMaterial from "../pages/dashboard/study-material/material-create/CreateStudyMaterial";
import ViewStudyMaterial from "../pages/dashboard/study-material/view-study-material/ViewStudyMaterial";

const DashboardRoutes = ({ setSelectedIndex }: { setSelectedIndex: (index: number) => void }) => {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route
          path="home"
          element={<Home setSelectedIndex={setSelectedIndex} />}
        />
        <Route path="explore" element={<Explore />} />
        <Route path="my-library" element={<YourLibrary />} />
        <Route path="profile" element={<Profile />} />
        <Route path="shop" element={<Shop />} />
        <Route path="study-material/create" element={<CreateStudyMaterial />} />
        <Route
          path="study-material/preview/:studyMaterialId"
          element={<ViewStudyMaterial />}
        />
      </Route>
    </Routes>
  );
};

export default DashboardRoutes;
