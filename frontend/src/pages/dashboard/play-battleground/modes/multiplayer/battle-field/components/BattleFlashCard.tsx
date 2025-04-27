import React from 'react';

interface BattleFlashCardProps {
    question: string;
    correctAnswer: string;
    type?: 'multiple-choice' | 'identification' | 'true-false';
    disabled?: boolean;
}

const BattleFlashCard: React.FC<BattleFlashCardProps> = ({
    question,
    type,
    disabled = false
}) => {
    return (
        <div className={`w-full max-w-[900px] h-[400px] mt-[-60px] bg-white rounded-lg p-8 relative`}>
            <div className="h-full flex items-center justify-center">
                <p className="text-center text-black text-2xl max-w-[600px]">
                    {question || <span className="animate-pulse">Loading question...</span>}
                </p>
            </div>
        </div>
    );
};

export default BattleFlashCard; 