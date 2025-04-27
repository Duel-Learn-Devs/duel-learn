import React, { useState } from "react";
import { IconButton } from "@mui/material";
import { ContentCopy, CheckCircle } from "@mui/icons-material";
import { motion } from "framer-motion";

interface LobbyCodeDisplayProps {
  lobbyCode: string;
}

const LobbyCodeDisplay: React.FC<LobbyCodeDisplayProps> = ({ lobbyCode }) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(lobbyCode)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => {
          setCopySuccess(false);
        }, 5000);
      })
      .catch(() => {
        setCopySuccess(false);
      });
  };

  return (
    <motion.div
      className="flex flex-row mt-24 items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-sm sm:text-base mr-6 text-white mb-1">
        LOBBY CODE
      </p>
      <div className="bg-white text-black text-sm sm:text-base font-bold px-2 ps-4 py-1 rounded-md flex items-center">
        {lobbyCode}
        <IconButton
          onClick={handleCopy}
          className="text-gray-500"
          style={{ fontSize: "16px" }}
        >
          {copySuccess ? (
            <CheckCircle fontSize="small" style={{ color: "gray" }} />
          ) : (
            <ContentCopy fontSize="small" />
          )}
        </IconButton>
      </div>
    </motion.div>
  );
};

export default LobbyCodeDisplay; 