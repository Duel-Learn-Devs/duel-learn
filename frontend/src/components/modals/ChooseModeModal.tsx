import React, { useState } from "react";
import {
    Box,
    Button,
    Modal,
    Typography,
    Stack,
    Backdrop,
    Fade,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ModalFriendList from "../../assets/General/ModalFriendList.png";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SelectStudyMaterialModal from "./SelectStudyMaterialModal"; // Assuming it's in the same folder

interface CustomModalProps {
    open: boolean;
    handleClose: () => void;
}

const ChooseModeModal: React.FC<CustomModalProps> = ({ open, handleClose }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [selectedMode, setSelectedMode] = useState<string | null>(null);
<<<<<<< HEAD
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
=======
>>>>>>> origin/beta-branch

    const buttonData = [
        {
            label: "Peaceful Mode",
            subtitle: "Study your way, no rush, just flow!",
            variant: "contained",
            backgroundColor: "#E2DBF8",
            hoverBackground: "#E8E2FE",
        },
        {
            label: "Time Pressured",
            subtitle: "Test your skills under time pressure!",
            variant: "outlined",
            backgroundColor: "#E2DBF8",
            hoverBackground: "#E8E2FE",
        },
        {
            label: "PvP Mode",
            subtitle: "Face off, outsmart, and win now!",
            variant: "contained",
            backgroundColor: "#E2DBF8",
            hoverBackground: "#E8E2FE",
            expanded: true, // Flag for special hover behavior
            subButtons: [
                { label: "Easy", subtitle: "20 secs" },
                { label: "Average", subtitle: "15 secs" },
                { label: "Hard", subtitle: "10 secs" },
            ],
        },
    ];

<<<<<<< HEAD
    const handleMaterialSelect = (material: any) => {
        // Handle the material selection logic here
    };

    const handleModeSelect = (mode: string) => {
        // Handle the mode selection logic here
    };
=======
>>>>>>> origin/beta-branch

    return (
        <>
            <Modal
                open={open}
                onClose={handleClose}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
                    sx: {
                        backgroundColor: "rgba(0, 0, 0, 0.5)", // Darker background
                    },
                }}
            >
                <Fade in={open}>
                    <Box
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: { xs: "90%", sm: "880px" },
                            height: { xs: "auto", sm: "600px" },
                            bgcolor: "#080511",
                            borderRadius: "10px",
                            boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: { xs: "20px", sm: "40px" },
                            paddingY: { xs: "60px", sm: "40px" },
                        }}
                    >
                        {/* Close button */}
                        <IconButton
                            aria-label="close"
                            onClick={handleClose}
                            sx={{
                                position: "absolute",
                                top: 16,
                                right: 16,
                                color: "#FFFFFF",
                            }}
                        >
                            <CloseIcon />
                        </IconButton>

                        {/* Modal Friend List Image */}
                        <Box
                            component="img"
                            src={ModalFriendList}
                            alt="Modal Friend List"
                            sx={{
                                width: "70px",
                                objectFit: "cover",
                                borderRadius: "5px 5px 0 0",
                                mb: 2,
                            }}
                        />

                        {/* Modal Header */}
                        <Typography
                            sx={{
                                fontWeight: "bold",
                                fontSize: { xs: "24px", sm: "32px" },
                                color: "#FFFFFF",
                                textAlign: "center",
                            }}
                        >
                            Choose Your Challenge
                        </Typography>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                color: "#9F9BAE",
                                mb: 5,
                                textAlign: "center",
                                fontSize: { xs: "14px", sm: "16px" },
                            }}
                        >
                            Forge your learning quest, Magician!
                        </Typography>

                        {/* Buttons */}
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={3}
                            justifyContent="center"
                            alignItems="center"
                        >
                            {buttonData.map((button, index) => (
                                <Box
                                    key={index}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    sx={{
                                        width: { xs: "100%", sm: "231px" },
                                        height: { xs: "auto", sm: "272px" },
                                        borderRadius: "8px",
                                        backgroundColor:
                                            hoveredIndex === index
                                                ? button.hoverBackground
                                                : hoveredIndex !== null
                                                    ? "#716C82"
                                                    : button.backgroundColor,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "flex-end",
                                        alignItems: "center",
                                        overflow: "hidden",
                                        transition: "background-color 0.3s ease",
                                        position: "relative",
                                        padding: "20px",
                                        textAlign: "center",
                                    }}
                                    onClick={() => {
                                        if (button.label !== "PvP Mode") {
                                            setSelectedMode(button.label); // Set the selected mode
                                            setModalOpen(true); // Open the SelectStudyMaterialModal
                                        }
                                    }}
                                >
                                    {/* Main Button Text */}
                                    {!(button.expanded && hoveredIndex === index) && (
                                        <>
                                            <Typography
                                                sx={{
                                                    color: "#000000",
                                                    fontWeight: "bold",
                                                    fontSize: "17px",
                                                    mb: "1px",
                                                    transition: "opacity 0.3s ease",
                                                }}
                                            >
                                                {button.label}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    color: "#322168",
                                                    fontSize: "14px",
                                                    width: "180px",
                                                    transition: "opacity 0.3s ease",
                                                }}
                                            >
                                                {button.subtitle}
                                            </Typography>
                                        </>
                                    )}

                                    {/* Sub-Buttons (only visible on hover) */}
                                    {button.expanded && hoveredIndex === index && (
                                        <Stack
                                            direction="column"
                                            spacing={0.925}
                                            sx={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: "100%",
                                                backgroundColor: "#040209",
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            {button.subButtons?.map((subButton, subIndex) => (
                                                <Button
                                                    key={subIndex}
                                                    variant="outlined"
                                                    sx={{
                                                        width: "100%",
                                                        height: `calc(33.33% - 5px)`,
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        border: "none",
                                                        backgroundColor: "#73707F",
                                                        color: "#000000",
                                                        textTransform: "none",
                                                        borderRadius: "5px",
                                                        padding: "8px 25px",
                                                        transition: "background-color 0.3s ease",
                                                        "&:hover": {
                                                            backgroundColor: "#E6DFFE",
                                                        },
                                                    }}
                                                    onClick={() => {
                                                        setSelectedMode(`${button.label} - ${subButton.label}`); // Updated template literal
                                                        setModalOpen(true);
                                                    }}
                                                >
                                                    <Typography sx={{ fontWeight: "bold", fontSize: "17px" }}>
                                                        {subButton.label}
                                                    </Typography>

                                                    <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <AccessTimeIcon sx={{ fontSize: "19px", color: "#6F658D" }} />
                                                        <Typography sx={{ fontSize: "17px", color: "#4B4B4B" }}>
                                                            {subButton.subtitle}
                                                        </Typography>
                                                    </Box>
                                                </Button>
                                            ))}
                                        </Stack>
                                    )}
                                </Box>
                            ))}

                        </Stack>
                    </Box>
                </Fade>
            </Modal>

            {/* Select Study Material Modal */}
            <SelectStudyMaterialModal
                open={modalOpen}
                handleClose={() => setModalOpen(false)} // This closes the study material modal
<<<<<<< HEAD
                mode={selectedMode} // Pass the selected mode
                onMaterialSelect={handleMaterialSelect} // Pass the selection handler
                onModeSelect={handleModeSelect} // Pass the mode selection handler
                selectedTypes={selectedTypes} // Pass selectedTypes to the modal
=======
                mode={selectedMode} // Pass selected mode to SelectStudyMaterialModal
>>>>>>> origin/beta-branch
            />
        </>
    );
};

export default ChooseModeModal;
