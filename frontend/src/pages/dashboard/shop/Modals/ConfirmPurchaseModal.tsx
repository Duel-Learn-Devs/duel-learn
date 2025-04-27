import React from "react";
import { Modal, Box, CircularProgress } from "@mui/material";
import CoinIcon from "/CoinIcon.png";

// Import the same ShopItem interface to ensure consistency
interface ShopItem {
  id: number;
  item_code: string;
  name: string;
  buyLabel: string;
  owned: number;
  image: string;
  item_price?: number;
}

interface ConfirmPurchaseModalProps {
  isOpen: boolean;
  closeModal: () => void;
  selectedItem: ShopItem | null;
  quantity: number;
  handleConfirmPurchase: () => Promise<void>;
  isProcessing: boolean;
}

const ConfirmPurchaseModal: React.FC<ConfirmPurchaseModalProps> = ({
  isOpen,
  closeModal,
  selectedItem,
  quantity,
  handleConfirmPurchase,
  isProcessing,
}) => {
  return (
    <Modal open={isOpen} onClose={closeModal}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500,
          maxWidth: "90%",
          bgcolor: "#080511",
          boxShadow: 24,
          borderColor: "#3B354D",
          borderWidth: "1px",
          borderRadius: "16px",
          p: 4,
          textAlign: "center",
          color: "white",
        }}
      >
        {selectedItem && (
          <>
            <h2 className="text-2xl font-bold mb-2">Confirm Purchase</h2>
            <p className="mb-4 text-sm text-[#8d80b3]">
              Are you sure you want to buy [{quantity}x]{" "}
              <strong>{selectedItem.name}</strong> for{" "}
              <span className="text-[#FFC700] font-bold">
                {parseInt(selectedItem.buyLabel) * quantity}
              </span>{" "}
              <img
                src={CoinIcon}
                alt="Coins"
                className="w-4 h-4 inline-block"
              />
              ?
            </p>

            <img
              src={selectedItem.image}
              alt={selectedItem.name}
              className="w-[84px] h-[84px] object-contain rounded-lg mb-8 mt-8 mx-auto"
            />

            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-10">
              <button
                className="bg-white text-black px-5 py-2 rounded-lg font-bold flex-1 hover:bg-gray-200 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleConfirmPurchase}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <CircularProgress
                      size={20}
                      color="inherit"
                      className="mr-2"
                    />
                    Processing...
                  </>
                ) : (
                  "Confirm Purchase"
                )}
              </button>

              <button
                className="text-white hover:text-gray-200 transition-all duration-200 flex-1 border border-white rounded-lg py-2"
                onClick={closeModal}
                disabled={isProcessing}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default ConfirmPurchaseModal;
