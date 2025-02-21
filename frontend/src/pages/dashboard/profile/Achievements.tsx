import { useState } from "react";

const Achievements = () => {
  // State for achievements data with progress values restricted to 20, 40, 60, 80, 100
  const [achievements] = useState([
    {
      id: 1,
      name: "Wisdom Collector",
      description: "Create 5 study materials",
      progress: 40, // Progress percentage
    },
    {
      id: 2,
      name: "Duelist",
      description: "Reach a 3-win streak in PvP",
      progress: 20,
    },
    {
      id: 3,
      name: "Battle Archmage",
      description: "Complete 20 PvP battles",
      progress: 60,
    },
    {
      id: 4,
      name: "Best magician wins",
      description: "Win a PVP battle",
      progress: 100,
    },
    {
      id: 5,
      name: "Speedy Witch",
      description: "Earned for answering within 3 seconds",
      progress: 20,
    },
    {
      id: 6,
      name: "Flawless Spellcaster",
      description: "Awarded for flawless accuracy in a PvP battle",
      progress: 80,
    },
    {
      id: 7,
      name: "Arcane Scholar",
      description: "Earned for completing 10 study sessions in a day",
      progress: 40,
    },
    {
      id: 8,
      name: "Hex of Silence",
      description: "For winning with no opponent points.",
      progress: 100,
    },
    {
      id: 9,
      name: "Mystic Elder",
      description: "Earned by reaching level 50",
      progress: 60,
    },
  ]);

  // Function to calculate the progress in terms of 0/5 scale
  const calculateScale = (progress: number) => {
    const scaleValue = progress / 20; // Directly map the progress value (20, 40, 60, 80, 100) to 1-5 scale
    return `${scaleValue}/5`; // Return in format x/5
  };

  return (
    <div>
      <h3 className="text-white text-2xl font-semibold mb-5">
        Achievements ({achievements.filter((a) => a.progress === 100).length}/
        {achievements.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            style={{ border: "1px solid #6F658D" }}
            className="rounded-lg px-7 py-8 flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-[#D9D9D9] rounded mb-4"></div>
            <h4 className="text-md pt-3 pb-1 font-bold text-center">
              {achievement.name}
            </h4>
            <p className="text-gray-400 text-xs text-center mb-3">
              {achievement.description}
            </p>
            <div className="flex items-center w-[85%] mt-3">
              <div className="w-full bg-[#3E3E50] rounded-full h-2">
                <div
                  className="bg-[#2B00FF] h-2 rounded-full"
                  style={{ width: `${achievement.progress}%` }}
                ></div>
              </div>
              <p className="text-md text-gray-300 ml-3">
                {calculateScale(achievement.progress)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;
