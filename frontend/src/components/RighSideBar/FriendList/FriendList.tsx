import React, { useState } from "react";
import Profile from "../../../assets/profile-picture/bunny-picture.png";
import ProfileIcon from "../../../assets/profile-picture/kopibara-picture.png";
import PeopleIcon from "@mui/icons-material/People";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import Modal from "./FriendListModal";

const FriendList: React.FC = () => {
  const [friendList] = useState([
    { id: 1, name: "PeraltaMalakas", level: 1, avatar: Profile },
    { id: 2, name: "CJdimarunong", level: 6, avatar: ProfileIcon },
    { id: 3, name: "CJdimarunong", level: 6, avatar: ProfileIcon },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("");

  const openModal = (tab: string) => {
    setActiveTab(tab); // Set the active tab dynamically
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveTab(""); // Reset the active tab when modal closes
  };

  return (
    <>
      <div
        className="rounded-md shadow-md"
        style={{ borderColor: "#3B354C", borderWidth: "3px" }}
      >
        <div className="px-8 pt-8 pb-5">
          <div className="flex flex-row items-center mb-5 gap-4">
            <img src="/bunny.png" className="w-[41px] h-[35px]" alt="icon" />
            <h2 className="text-xl text-[#FFFFFF] font-semibold">
              Friend List
            </h2>
          </div>
          <hr className="border-t-1 border-[#ffffff] mb-7" />
          {friendList.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center justify-between mb-4"
            >
              <div className="flex items-center">
                <img
                  src={friend.avatar}
                  alt="Avatar"
                  className="w-12 h-12 rounded-[5px] mr-6"
                />
                <div>
                  <p className="font-medium text-[#FFFFFF]">{friend.name}</p>
                  <p className="text-sm text-gray-400">LVL {friend.level}</p>
                </div>
              </div>
              <button className="bg-[#57A64E] py-2 px-5 rounded-md text-xs text-white">
                INVITE
              </button>
            </div>
          ))}
        </div>
        <div className="flex justify-around bg-[#120F1C] p-4 border-[1px] border-[#3B354C]">
          <button
            onClick={() => openModal("YOUR FRIENDS")}
            className={`flex items-center justify-center border-r-[1px] border-[#3B354C] flex-1 ${
              activeTab === "YOUR FRIENDS" ? "text-[#ffffff]" : "text-[#48405f]"
            }`}
          >
            <PeopleIcon />
          </button>
          <button
            onClick={() => openModal("FRIEND REQUESTS")}
            className={`flex items-center justify-center border-r-[1px] border-[#3B354C] flex-1 ${
              activeTab === "FRIEND REQUESTS"
                ? "text-[#ffffff]"
                : "text-[#48405f]"
            }`}
          >
            <PersonAddIcon />
          </button>
          <button
            onClick={() => openModal("FIND FRIENDS")}
            className={`flex items-center justify-center flex-1 ${
              activeTab === "FIND FRIENDS" ? "text-[#ffffff]" : "text-[#48405f]"
            }`}
          >
            <PersonSearchIcon />
          </button>
        </div>
      </div>
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        activeTab={activeTab} // Pass the active tab to the modal
        setActiveTab={setActiveTab} // Pass the setter function to allow tab switching in the modal
      />
    </>
  );
};

export default FriendList;
