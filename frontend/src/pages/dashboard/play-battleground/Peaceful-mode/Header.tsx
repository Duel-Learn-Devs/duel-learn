import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import IconButton from "@mui/material/IconButton";

interface HeaderProps {
    mode: string;
    material: {
        title: string;
    } | null;
    correct: number;
    incorrect: number;
}

export default function Header({ material, mode, correct, incorrect }: HeaderProps) {
    const navigate = useNavigate();
    const [openDialog, setOpenDialog] = useState(false);

    const handleBackClick = () => {
        setOpenDialog(true);
    };

    const handleConfirmLeave = () => {
        setOpenDialog(false);
        navigate("/dashboard/home");
    };

    const handleCancelLeave = () => {
        setOpenDialog(false);
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
                                {mode} Mode - {material?.title || 'No Material Selected'}
                            </span>
                            <div className="flex items-center gap-4 text-[12px] sm:text-[14px] text-[#6F658D]">
                                <div>Correct {correct}</div>
                                <div>Incorrect {incorrect}</div>
                            </div>
                        </div>
                    </div>
                    <button className="text-gray-400 hover:text-white transition-colors">
                        <SettingsIcon sx={{ fontSize: 24 }} />
                    </button>
                </div>
            </header>

            {/* Confirmation Modal */}
            <Dialog
                open={openDialog}
                aria-labelledby="confirmation-dialog-title"
                aria-describedby="confirmation-dialog-description"
                sx={{
                    "& .MuiDialog-paper": {
                        backgroundColor: "#080511",
                        paddingY: "30px",
                        paddingX: "20px",
                        paddingRight: "40px",
                        borderRadius: "10px",
                    },
                    "& .MuiDialog-root": {
                        backgroundColor: "transparent",
                    },
                }}
            >
                <DialogTitle
                    id="confirmation-dialog-title"
                    className="text-white py-4 px-6"
                    sx={{
                        backgroundColor: "#080511",
                    }}
                >
                    Are you sure you want to leave?
                </DialogTitle>

                <DialogContent
                    className="text-white py-6 px-6"
                    sx={{ backgroundColor: "#080511" }}
                >
                    <p>
                        If you leave, your current progress will be lost. Please confirm if
                        you wish to proceed.
                    </p>
                </DialogContent>

                <DialogActions className="bg-[#080511]" sx={{ padding: "16px 0" }}>
                    <Button
                        onClick={handleCancelLeave}
                        sx={{
                            color: "#B0B0B0",
                            py: 1,
                            px: 4,
                            "&:hover": {
                                backgroundColor: "#080511",
                                color: "#FFFFFF",
                            },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmLeave}
                        autoFocus
                        sx={{
                            backgroundColor: "#4D1EE3",
                            color: "#FFFFFF",
                            py: 1,
                            px: 4,
                            "&:hover": {
                                backgroundColor: "#6A3EEA",
                                color: "#fff",
                            },
                        }}
                    >
                        Yes, Leave
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

