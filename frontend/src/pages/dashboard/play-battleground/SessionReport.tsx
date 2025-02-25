import { Button } from "@mui/material";
import SessionComplete from "../../../assets/General/SessionComplete.png";
import SessionReportBanner from "../../../assets/General/SessionReportBanner.png";
import ClockIcon from "../../../assets/clock.png";
import ManaIcon from "../../../assets/ManaIcon.png";
import { useNavigate, useLocation } from 'react-router-dom';
import banner from "./banner.jpg"

interface SessionReportProps {
    timeSpent: string;
    correctCount: number;
    incorrectCount: number;
    mode: 'Peaceful' | 'time-pressured' | 'pvp';
    material: string;
}

interface StatisticProps {
    label: string;
    value: string | number;
}

const StatisticBox = ({ label, value, icon }: StatisticProps & { icon: string }) => (
    <div className="backdrop-blur-sm px-6 py-7 rounded-md border border-white">
        <div className="flex items-center gap-2 justify-center">
            <img src={icon} alt="" className="w-4 h-4 mb-1" />
            <div className="text-sm mb-1 text-gray-400 uppercase tracking-wider">{label}</div>
        </div>
        <div className="text-xl font-bold text-white mt-1">{value}</div>
    </div>
);

const SessionReport = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { timeSpent, correctCount, incorrectCount, mode, material } = location.state as SessionReportProps;

    // Add console logs to check passed data
    console.log('Session Report Data:', {
        timeSpent,
        correctCount,
        incorrectCount,
        mode,
        material,
        earnedXP: correctCount * 5
    });

    // Calculate XP based on correct answers
    const earnedXP = correctCount * 5;

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 text-center">
                {/* Session Complete Banner */}
                <div className="relative inline-block mx-auto">
                    <img
                        src={SessionComplete}
                        alt="SESSION COMPLETE"
                        className="relative z-10"
                    />
                </div>

                <div>
                    <div className="flex justify-center">
                        <img
                            src={banner}
                            alt="Session Report Banner"
                            className="w-72"
                        />
                    </div>

                    {/* Stats Box */}
                    <div className="backdrop-blur-sm p-8 mt-[8px] mb-[-20px] rounded-xl">
                        <div className="text-lg text-white mb-6 uppercase tracking-wider">
                            STATISTICS
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <StatisticBox
                                label="EARNED XP"
                                value={`${earnedXP} XP`}
                                icon={ManaIcon}
                            />
                            <StatisticBox
                                label="TOTAL TIME"
                                value={timeSpent}
                                icon={ClockIcon}
                            />
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 justify-center">
                    <Button
                        sx={{
                            px: 4,
                            py: 1.5,
                            backgroundColor: '#2C2C38',
                            color: 'white',
                            borderRadius: 2,
                            '&:hover': {
                                backgroundColor: '#1E1E26',
                            }
                        }}
                        onClick={() => navigate('/dashboard/setup/questions', {
                            state: { mode, material }
                        })}
                    >
                        STUDY AGAIN
                    </Button>
                    <Button
                        sx={{
                            px: 4,
                            py: 1.5,
                            backgroundColor: '#4D18E8',
                            color: 'white',
                            borderRadius: 2,
                            '&:hover': {
                                backgroundColor: '#3A12B0',
                            }
                        }}
                        onClick={() => navigate('/dashboard/home')}
                    >
                        Go Back to Home
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SessionReport;
