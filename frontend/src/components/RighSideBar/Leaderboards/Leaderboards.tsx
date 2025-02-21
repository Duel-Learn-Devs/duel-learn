import React, { useState } from "react";
import Profile from "../../../assets/profile-picture/bunny-picture.png";
import ProfileIcon from "../../../assets/profile-picture/kopibara-picture.png";

const Leaderboards = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [covenHierarchy] = useState([
    { id: 1, name: "SAMIS", xp: 553, avatar: Profile },
    { id: 2, name: "JUSTINE", xp: 400, avatar: ProfileIcon },
    { id: 3, name: "BEA", xp: 100, avatar: Profile },
    { id: 4, name: "JING009", xp: 56, avatar: ProfileIcon },
    { id: 5, name: "LUCAS", xp: 45, avatar: Profile },
    { id: 6, name: "MARIA", xp: 30, avatar: ProfileIcon },
    { id: 7, name: "ALICE", xp: 28, avatar: Profile },
    { id: 8, name: "BOB", xp: 20, avatar: ProfileIcon },
    { id: 9, name: "CARLOS", xp: 18, avatar: Profile },
    { id: 10, name: "ZOE", xp: 12, avatar: ProfileIcon },
  ]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div>
      <div
        className="rounded-md shadow-md border-3"
        style={{ borderColor: "#3B354C", borderWidth: "3px" }}
      >
        <div className="px-8 pt-8 ">
          <div className="flex flex-row items-center mb-5 gap-4">
            <img
              src="/leaderboard.png"
              className="w-[34px] h-[35px] ml-2"
              alt="icon"
            />
            <h2 className="text-xl text-[#FFFFFF] font-semibold">
              Leaderboards
            </h2>
          </div>
          <hr className="border-t-1 border-[#ffffff] mb-7" />
          {covenHierarchy.slice(0, 4).map((member, index) => (
            <div
              key={member.id}
              className="flex items-center justify-between mb-5"
            >
              <div className="flex items-center">
                {index >= 3 && (
                  <p className="text-lg font-semibold mr-3">{index + 1}</p>
                )}
                <div
                  className={`relative ${
                    index >= 3 ? "w-10 h-10" : "w-12 h-12"
                  } mr-3`}
                >
                  <img
                    src={member.avatar}
                    alt="Avatar"
                    className={`w-full h-full rounded-[5px] ${
                      index >= 3 ? "object-contain" : ""
                    }`}
                  />
                </div>
                <p className="font-medium">{member.name}</p>
              </div>
              <p className="text-gray-400">{member.xp} XP</p>
            </div>
          ))}
        </div>
        <button
          style={{ borderColor: "#3B354C", borderWidth: "1px" }}
          className="w-full p-4 text-[#48405f] bg-[#120F1C] text-center"
          onClick={openModal}
        >
          VIEW MORE
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-[#080511] px-10 py-12 border-[#3B354D] border rounded-lg w-[689px] h-[639px] shadow-lg flex flex-col space-y-6 items-center justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center">
              <div className="bg-white w-8 h-8 rounded mr-4"></div>
              <h2 className="text-xl text-[#FFFFFF] font-semibold">
                Top 10 Leaderboards
              </h2>
            </div>
            {/* Add a horizontal rule here */}
            <hr className="border-t-2 border-[#363D46] w-full mb-6" />

            {/* Scrollable content area with custom scrollbar */}
            <div className="overflow-y-auto h-[450px] w-full scrollbar-thin scrollbar-thumb-[#221d35] scrollbar-track-transparent space-y-7 flex-grow">
              {covenHierarchy.map((member, index) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-7"
                >
                  <div className="flex items-center space-x-4">
                    <p className="text-lg font-semibold text-[#FFFFFF]">
                      {index + 1}
                    </p>
                    <div className={`relative w-12 h-12`}>
                      <img
                        src={member.avatar}
                        alt="Avatar"
                        className="w-full h-full rounded-[5px] object-cover"
                      />
                    </div>
                    <p className="font-medium text-[#FFFFFF]">{member.name}</p>
                  </div>
                  <p className="text-gray-400">{member.xp} XP</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboards;
