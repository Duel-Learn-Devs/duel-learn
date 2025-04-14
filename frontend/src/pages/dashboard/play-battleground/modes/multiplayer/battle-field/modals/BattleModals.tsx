import { X } from "lucide-react";

export interface VictoryModalProps {
  showVictoryModal: boolean;
  victoryMessage: string;
  onConfirm: () => void;
  onViewSessionReport?: () => void;
}

/**
 * VictoryModal - Displays a victory message when the opponent leaves the battle
 */
export function VictoryModal({
  showVictoryModal,
  victoryMessage,
  onConfirm,
  onViewSessionReport,
}: VictoryModalProps) {
  if (!showVictoryModal) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 relative">
        <div className="absolute top-4 right-4">
          <button
            onClick={onConfirm}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <h2 className="text-purple-300 text-3xl font-bold mb-4 text-center">
          Victory!
        </h2>

        <p className="text-white text-xl mb-8 text-center">{victoryMessage}</p>

        <div className="flex flex-col gap-3">
          {onViewSessionReport && (
            <button
              onClick={onViewSessionReport}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition-colors"
            >
              View Session Report
            </button>
          )}

          <button
            onClick={onConfirm}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-lg transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
