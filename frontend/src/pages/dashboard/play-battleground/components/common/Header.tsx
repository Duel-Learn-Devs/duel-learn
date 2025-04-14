import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";

interface HeaderProps {
  mode: string;
  material: {
    title: string;
    study_material_id: string;
  } | null;
  correct: number;
  incorrect: number;
  startTime: Date;
  highestStreak: number;
  masteredCount: number;
  unmasteredCount: number;
  onEndGame?: () => Promise<void>;
}

const commonDialogStyle = {
  "& .MuiDialog-paper": {
    backgroundColor: "#080511",
    paddingY: "30px",
    paddingX: "20px",
    paddingRight: "20px",
    borderRadius: "10px",
  },
};

const commonButtonStyles = {
  cancelButton: {
    color: "#B0B0B0",
    py: 1,
    px: 4,
    "&:hover": {
      backgroundColor: "#080511",
      color: "#FFFFFF",
    },
    borderRadius: "0.8rem",
  },
  confirmButton: {
    backgroundColor: "#4D1EE3",
    color: "#FFFFFF",
    py: 1,
    px: 4,
    "&:hover": {
      backgroundColor: "#6A3EEA",
    },
    borderRadius: "0.8rem",
  },
};

export default function Header({
  material,
  mode,
  correct,
  incorrect,
  startTime,
  highestStreak,
  masteredCount,
  unmasteredCount,
  onEndGame,
}: HeaderProps) {
  const navigate = useNavigate();
  const [openGameOptionsDialog, setOpenGameOptionsDialog] = useState(false);
  const [openLeaveConfirmDialog, setOpenLeaveConfirmDialog] = useState(false);
  const [openEndGameDialog, setOpenEndGameDialog] = useState(false);

  const handleBackClick = () => {
    setOpenGameOptionsDialog(true);
  };

  const handleLeaveGame = () => {
    setOpenGameOptionsDialog(false);
    setOpenLeaveConfirmDialog(true);
  };

  const handleEndGame = () => {
    setOpenGameOptionsDialog(false);
    setOpenEndGameDialog(true);
  };

  const handleConfirmLeave = () => {
    setOpenLeaveConfirmDialog(false);
    navigate("/dashboard/home");
  };

  const handleConfirmEndGame = async () => {
    setOpenEndGameDialog(false);

    if (onEndGame) {
      try {
        await onEndGame();
      } catch (error) {
        console.error("Error ending game:", error);
      }
    }

    const endTime = new Date();
    const timeDiff = endTime.getTime() - startTime.getTime();
    const minutes = Math.floor(timeDiff / 60000);
    const seconds = Math.floor((timeDiff % 60000) / 1000);
    const timeSpent = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

    navigate("/dashboard/study/session-summary", {
      state: {
        timeSpent,
        correctCount: correct,
        incorrectCount: incorrect,
        mode,
        material: material?.title || "Unknown Material",
        earlyEnd: true,
        highestStreak,
        masteredCount,
        unmasteredCount,
      },
    });
  };

  return (
    <>
      <header className="absolute top-0 left-0 w-full sm:px-8 md:px-16 lg:px-32 px-12 mt-5 py-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
            <IconButton
              className="text-gray-300"
              style={{
                border: "2px solid #6F658D",
                borderRadius: "50%",
                padding: "4px",
                color: "#6F658D",
              }}
              onClick={handleBackClick}
            >
              <ArrowBackIcon />
            </IconButton>
            <div className="flex flex-col">
              <span className="text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px] font-semibold mb-1 text-white">
                {mode} Mode - {material?.title || "No Material Selected"}
              </span>
              <div className="flex items-center gap-4 text-[12px] sm:text-[14px] text-[#6F658D]">
                {mode.toLowerCase() === "peaceful" ? (
                  <>
                    <div>Mastered {masteredCount}</div>
                    <div>Unmastered {unmasteredCount}</div>
                  </>
                ) : (
                  <>
                    <div>Correct {correct}</div>
                    <div>Incorrect {incorrect}</div>
                  </>
                )}
              </div>
            </div>
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <SettingsIcon sx={{ fontSize: 24 }} />
          </button>
        </div>
      </header>

      {/* Game Options Dialog - Keep the new centered design */}
      <Dialog
        open={openGameOptionsDialog}
        onClose={() => setOpenGameOptionsDialog(false)}
        sx={commonDialogStyle}
      >
        <DialogTitle className="text-center pb-6">
          <div className="text-2xl font-bold text-white mb-3">Pause Menu</div>
          <div className="text-sm text-gray-400 mb-2">
            Current Progress: {correct} Mastered • {incorrect} Unmastered
          </div>
          <div className="w-3/3 mx-auto border-b border-gray-800/50" />
        </DialogTitle>
        <DialogContent className="text-center pb-8">
          <p className="text-lg text-gray-300 pb-1 pl-1 font-medium">
            What would you like to do?
          </p>
        </DialogContent>
        <DialogActions
          className="bg-[#080511] pl-1 justify-center"
          sx={{ padding: "0 24px 32px 24px", gap: 3 }}
        >
          <Button
            onClick={handleLeaveGame}
            sx={{
              ...commonButtonStyles.cancelButton,
              border: "1px solid rgba(176, 176, 176, 0.5)",
              minWidth: "140px",
              py: 1.5,
            }}
          >
            Exit Game
          </Button>
          <Button
            onClick={handleEndGame}
            autoFocus
            sx={{
              ...commonButtonStyles.confirmButton,
              boxShadow: "0 4px 12px rgba(77, 30, 227, 0.4)",
              minWidth: "140px",
              py: 1.5,
            }}
          >
            End Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Leave Game Confirmation Dialog - Revert to original design */}
      <Dialog
        open={openLeaveConfirmDialog}
        onClose={() => setOpenLeaveConfirmDialog(false)}
        sx={commonDialogStyle}
      >
        <DialogTitle className="text-white">
          Are you sure you want to leave?
        </DialogTitle>
        <DialogContent className="text-white">
          <p>
            If you leave, your current progress will be lost. Please confirm if
            you wish to proceed.
          </p>
        </DialogContent>
        <DialogActions className="bg-[#080511]" sx={{ padding: "16px 24px" }}>
          <Button
            onClick={() => setOpenLeaveConfirmDialog(false)}
            sx={commonButtonStyles.cancelButton}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmLeave}
            autoFocus
            sx={commonButtonStyles.confirmButton}
          >
            Yes, Leave
          </Button>
        </DialogActions>
      </Dialog>

      {/* End Game Confirmation Dialog - Revert to original design */}
      <Dialog
        open={openEndGameDialog}
        onClose={() => setOpenEndGameDialog(false)}
        sx={commonDialogStyle}
      >
        <DialogTitle className="text-white">End Game Early?</DialogTitle>
        <DialogContent className="text-white">
          <p>
            Ending the game now will result in 0 XP earned. Your progress will
            still be recorded. Do you want to continue?
          </p>
        </DialogContent>
        <DialogActions className="bg-[#080511]" sx={{ padding: "16px 24px" }}>
          <Button
            onClick={() => setOpenEndGameDialog(false)}
            sx={commonButtonStyles.cancelButton}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmEndGame}
            autoFocus
            sx={commonButtonStyles.confirmButton}
          >
            End Game
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
