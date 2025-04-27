import noLeaderboard from "/images/noLeaderboard.svg";

const EmptyLB = () => {
  return (
    <div className="rounded-[0.8rem] shadow-md border-3 w-[95%] max-w-[450px] mx-auto">
      <div className="px-3 sm:px-8 pt-4 sm:pt-8 pb-2">
        <div className="flex flex-row items-center mb-3 sm:mb-5">
          <h2 className="text-base sm:text-xl text-[#FFFFFF] font-semibold">
            Leaderboards
          </h2>
        </div>
        <hr className="border-t-1 border-[#ffffff] mb-4 sm:mb-7" />

        <div className="flex flex-col items-center justify-center mb-4 sm:mb-6">
          <img
            src={noLeaderboard}
            alt="No leaderboard"
            className="w-[60%] sm:w-3/4 max-w-[250px]"
          />
          <p className="text-[#6F658D] w-full text-center mt-2 sm:mt-3 px-2 sm:px-7 text-xs sm:text-base">
            Add more friends to unlock the Leaderboards and compete with them
            for the top spot!
          </p>
        </div>
      </div>
      <button
        style={{ borderColor: "#3B354C", borderWidth: "1px" }}
        className="w-full p-2 sm:p-4 text-[#48405f] bg-[#120F1C] text-center text-xs sm:text-base font-medium rounded-b-[0.8rem]"
      >
        FIND FRIENDS
      </button>
    </div>
  );
};

export default EmptyLB;
