import React, { useState } from "react";
import Modal from "./FriendListModal";
import PeopleIcon from "@mui/icons-material/People";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";

const EmptyFriendList: React.FC = () => {
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
          <div className="flex flex-row items-center mb-5">
            <div className="bg-white w-9 h-8 rounded mr-3"></div>
            <h2 className="text-xl text-[#FFFFFF] font-semibold">
              Friend List
            </h2>
          </div>
          <hr className="border-t-1 border-[#ffffff] mb-7" />
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-20 h-20 bg-white rounded mt-4 mb-6"></div>
            <p className="text-[#6F658D] w-[390px] text-center mt-3 px-7">
              Add friends and share the magic!
            </p>
          </div>
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

export default EmptyFriendList;
