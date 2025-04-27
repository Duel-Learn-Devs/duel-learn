import React, { useState } from "react";
import { Modal, Box } from "@mui/material";
import CoinIcon from "/CoinIcon.png";
import ConfirmPurchaseModal from "./ConfirmPurchaseModal";
import { ShopItem } from "../../../../types/shopObject";

// Extended ShopItem for UI purposes
interface ShopItemExtended extends ShopItem {
  id: number;
  owned: number;
  name: string;
  buyLabel: string;
  image: string;
}

interface ShopItemModalProps {
  isModalOpen: boolean;
  closeModal: () => void;
  selectedItem: ShopItemExtended | null;
  quantity: number;
  handleIncrement: () => void;
  handleDecrement: () => void;
  handlePurchase: (
    itemCode: string,
    quantity: number,
    itemName: string,
    itemEffect: string,
    itemPrice: number
  ) => Promise<boolean>;
  userCoins: number;
}

const ShopItemModal: React.FC<ShopItemModalProps> = ({
  isModalOpen,
  closeModal,
  selectedItem,
  quantity,
  handleIncrement,
  handleDecrement,
  handlePurchase,
  userCoins,
}) => {
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOpenConfirmModal = () => {
    if (selectedItem) {
      if (selectedItem.owned + quantity > 5) {
        setErrorMessage("You cannot own more than 5 of this item.");
      } else if (userCoins < parseInt(selectedItem.buyLabel) * quantity) {
        setErrorMessage("You don't have enough coins for this purchase.");
      } else {
        setConfirmModalOpen(true);
      }
    }
  };

  const handleCloseModal = () => {
    setErrorMessage(null);
    closeModal();
  };

  const handleConfirmPurchase = async () => {
    if (!selectedItem) return;

    setIsProcessing(true);
    try {
      const result = await handlePurchase(
        selectedItem.item_code,
        quantity,
        selectedItem.item_name,
        selectedItem.item_effect,
        selectedItem.item_price || 0
      );

      if (result) {
        setConfirmModalOpen(false);
        closeModal();
      }
    } catch (error) {
      console.error("Purchase failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* First Modal: Select Quantity */}
      <Modal open={isModalOpen} onClose={handleCloseModal}>
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
              <h2 className="text-2xl font-bold mb-2">Buy this item</h2>
              <p className="mb-4 text-sm text-[#8d80b3]">
                Select the amount of <strong>{selectedItem.item_name}</strong>{" "}
                you wish to buy.
              </p>

              <div className="flex justify-center items-center gap-6 mb-4">
                <div className="flex items-center my-3 gap-4">
                  <img
                    src={selectedItem.item_picture_url}
                    alt={selectedItem.item_name}
                    className="w-[74px] h-[74px] object-contain rounded-lg mr-3"
                  />
                  <button
                    className="bg-[#6F658D] px-4 py-2 rounded text-white text-base font-bold"
                    onClick={handleDecrement}
                  >
                    -
                  </button>

                  <span className="text-md font-bold">{quantity}</span>

                  <button
                    className="bg-[#6F658D] px-4 py-2 rounded text-white text-base font-bold"
                    onClick={handleIncrement}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-2 mb-4 flex justify-between items-center">
                <span>Your coins:</span>
                <div className="flex items-center">
                  <img
                    src={CoinIcon}
                    alt="Coin"
                    className="w-5 h-5 inline-block mr-2"
                  />
                  <span className="text-[#FFC700] font-bold">{userCoins}</span>
                </div>
              </div>

              <button
                className="bg-white text-black px-5 py-2 rounded-lg font-bold w-full flex justify-center items-center hover:bg-gray-200 transition-all duration-200"
                onClick={handleOpenConfirmModal}
                disabled={selectedItem.item_price * quantity > userCoins}
              >
                Buy for{" "}
                <img
                  src={CoinIcon}
                  alt="Coin"
                  className="w-5 h-5 inline-block ml-2"
                />
                <span className="text-[#9C8307] font-bold ml-2">
                  {selectedItem.item_price * quantity}
                </span>
              </button>

              {errorMessage && (
                <p className="mt-2 text-red-500">{errorMessage}</p>
              )}

              <button
                className="mt-4 text-gray-400 hover:text-gray-600 transition-all duration-200"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
            </>
          )}
        </Box>
      </Modal>

      {/* Second Modal: Confirm Purchase */}
      <ConfirmPurchaseModal
        isOpen={isConfirmModalOpen}
        closeModal={() => setConfirmModalOpen(false)}
        selectedItem={selectedItem}
        quantity={quantity}
        handleConfirmPurchase={handleConfirmPurchase}
        isProcessing={isProcessing}
      />
    </>
  );
};

export default ShopItemModal;
