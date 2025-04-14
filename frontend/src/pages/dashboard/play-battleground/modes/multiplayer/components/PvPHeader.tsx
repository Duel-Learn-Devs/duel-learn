import React from "react";
import { Button, IconButton } from "@mui/material";
import { motion } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CachedIcon from "@mui/icons-material/Cached";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ManaIcon from "/ManaIcon.png";

interface PvPHeaderProps {
  onBackClick: () => void;
  onChangeMaterial: () => void;
  onChangeQuestionType: () => void;
  selectedMaterial: { title: string } | null;
  selectedTypesFinal: string[];
  questionTypes: { display: string; value: string }[];
  manaPoints: number;
  isCurrentUserGuest: boolean;
}

const PvPHeader: React.FC<PvPHeaderProps> = ({
  onBackClick,
  onChangeMaterial,
  onChangeQuestionType,
  selectedMaterial,
  selectedTypesFinal,
  questionTypes,
  manaPoints,
  isCurrentUserGuest,
}) => {
  return (
    <motion.div
      className="absolute top-0 left-0 w-full sm:px-8 md:px-16 lg:px-32 px-12 mt-5 py-12 flex justify-between items-center"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
        <IconButton
          className="text-gray-300"
          style={{
            border: "2px solid #6F658D",
            borderRadius: "50%",
            padding: "4px",
            color: "#6F658D",
          }}
          onClick={onBackClick}
        >
          <ArrowBackIcon />
        </IconButton>

        <div>
          <h2 className="text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px] font-semibold mb-1">
            {isCurrentUserGuest ? "LOBBY" : "PVP LOBBY"}
          </h2>
          <h6 className="text-[14px] text-gray-300 mb-1">
            {isCurrentUserGuest ? "Host selected: " : ""}
            {selectedTypesFinal.map((type, index) => {
              // Map question type values to display names
              const displayType =
                questionTypes.find((qt) => qt.value === type)?.display || type;
              return (
                <span key={type}>
                  {index > 0 ? ", " : ""}
                  {displayType}
                </span>
              );
            })}
          </h6>
          <p className="text-[12px] sm:text-[14px] text-gray-400 flex items-center">
            {isCurrentUserGuest
              ? "Host's Study Material: "
              : "Chosen Study Material: "}
            &nbsp;
            <span className="font-bold text-white">
              {selectedMaterial
                ? typeof selectedMaterial === "string" &&
                  selectedMaterial === "None"
                  ? "Waiting for host's material..."
                  : selectedMaterial.title || "Loading material..."
                : isCurrentUserGuest
                ? "Waiting for host's material..."
                : "Choose Study Material"}
            </span>
            {!isCurrentUserGuest && (
              <span className="transition-colors duration-200">
                <CachedIcon
                  sx={{
                    color: "#6F658D",
                    marginLeft: "8px",
                    fontSize: "22px",
                    cursor: "pointer",
                    "&:hover": { color: "#4B17CD" },
                  }}
                  onClick={onChangeMaterial}
                />
              </span>
            )}
            {isCurrentUserGuest && (
              <span className="ml-2 text-[12px] text-purple-300">
                (Guest mode)
              </span>
            )}
            <span className="transition-colors duration-200">
              <VisibilityIcon
                sx={{
                  color: "#6F658D",
                  marginLeft: "6px",
                  fontSize: "20px",
                  cursor: "pointer",
                  "&:hover": { color: "#4B17CD" },
                }}
              />
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="contained"
          className="bg-[#3d374d] text-white"
          onClick={onChangeQuestionType}
          sx={{
            cursor: isCurrentUserGuest ? "not-allowed" : "pointer",
            backgroundColor: "#3d374d",
            "&:hover": {
              backgroundColor: "#4B17CD",
            },
          }}
          disabled={isCurrentUserGuest}
        >
          CHANGE QUESTION TYPE
        </Button>

        <img
          src={ManaIcon}
          alt="Mana"
          className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 ml-6"
        />
        <span className="text-[14px] sm:text-[16px] text-gray-300 mr-2 sm:mr-3">
          {manaPoints}
        </span>
        <span className="animate-spin text-[14px] sm:text-[16px] text-purple-400">
          ⚙️
        </span>
      </div>
    </motion.div>
  );
};

export default PvPHeader;
