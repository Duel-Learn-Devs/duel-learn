import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PremiumAdsBG from "/shop-picture/premium-ads-bg.png";
import PremiumActivatedBG from "/shop-picture/PremiumActivatedBG.png";
import CoinIcon from "/CoinIcon.png";
import ShopItemModal from "./Modals/ShopItemModal";
import DocumentHead from "../../../components/DocumentHead";
import PageTransition from "../../../styles/PageTransition";
import { ShopItem } from "../../../types/shopObject"; // Import the ShopItem interface
import axios from "axios";
import { useUser } from "../../../contexts/UserContext";
import AutoHideSnackbar from "../../../components/ErrorsSnackbar";
import CancelSubscription from "../../../components/premium/CancelSubscription";
import cauldronGif from "/General/Cauldron.gif"; // Import the loading GIF

const Shop = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useUser();
  const isPremium = user?.account_type === "premium"; // Check if the user is premium
  const userCoins = user?.coins || 0;
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ownedItems, setOwnedItems] = useState<Record<string, number>>({});
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [isSnackbarAction, setIsSnackbarAction] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [refreshCallback, setRefreshCallback] = useState<
    (() => void) | undefined
  >(undefined);

  // Handle closing the snackbar
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleOpenCancelSubsModal = () => {
    setShowCancelModal(true);
  };

  // Show a message in the snackbar
  const showSnackbar = (
    message: string,
    action: boolean = false,
    callback?: () => void
  ) => {
    setSnackbarMessage(message);
    setIsSnackbarAction(action);
    setRefreshCallback(callback);
    setSnackbarOpen(true);
  };

  const fetchItems = async (forceRefresh = false) => {
    try {
      setLoading(true);
      // Fetch shop items with optional cache busting
      const timestamp = forceRefresh ? Date.now() : undefined;
      const itemsResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/shop/items${
          forceRefresh ? `?timestamp=${timestamp}` : ""
        }`
      );
      setItems(itemsResponse.data);

      // If user is logged in, fetch their owned items
      if (user?.firebase_uid) {
        // Fetch user's items with same cache strategy
        const userItemsResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/shop/user-item/${
            user.firebase_uid
          }${forceRefresh ? `?timestamp=${timestamp}` : ""}`
        );

        // Use the quantity that now comes directly from the database
        const owned: Record<string, number> = {};
        userItemsResponse.data.forEach((item: any) => {
          owned[item.item_code] = item.quantity;
        });

        setOwnedItems(owned);
      }

      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch shop data:", err);
      setError("Failed to load shop data. Please try again later.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [user?.firebase_uid]);

  const openModal = (item: ShopItem) => {
    const ownedCount = ownedItems[item.item_code] || 0;
    if (ownedCount < 5) {
      setSelectedItem(item);
      setQuantity(1);
      setIsModalOpen(true);
    } else {
      showSnackbar("You cannot own more than 5 of this item.");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleIncrement = () => {
    if (selectedItem) {
      const ownedCount = ownedItems[selectedItem.item_code] || 0;
      const newQuantity = quantity + 1;
      // Check both the ownership limit and if user has enough coins for the increased quantity
      if (
        newQuantity <= 5 - ownedCount &&
        userCoins >= selectedItem.item_price * newQuantity
      ) {
        setQuantity(newQuantity);
      } else if (userCoins < selectedItem.item_price * newQuantity) {
        showSnackbar("You don't have enough coins for this quantity.");
      }
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handlePurchase = async (
    itemCode: string,
    quantity: number,
    itemName: string,
    itemEffect: string,
    itemPrice: number
  ) => {
    if (!user?.firebase_uid) {
      showSnackbar("You need to be logged in to make a purchase.");
      return false;
    }

    try {
      // Send the purchase request with quantity
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/shop/buy-item`,
        {
          firebase_uid: user.firebase_uid,
          username: user.username,
          item_code: itemCode,
          item_name: itemName,
          item_effect: itemEffect,
          item_price: itemPrice,
          quantity: quantity,
        }
      );

      // Create an update object with the coin balance
      const userUpdate: Partial<typeof user> = {
        coins: response.data.remainingCoins,
      };

      // If this is a tech pass purchase, also update the tech_pass count
      if (itemCode === "ITEM002TP" && response.data.tech_pass !== undefined) {
        userUpdate.tech_pass = response.data.tech_pass;
      }

      // Update user state with all the changes
      updateUser(userUpdate);

      console.log("Updated user data:", userUpdate);

      // Update owned items count
      setOwnedItems((prev) => ({
        ...prev,
        [itemCode]: (prev[itemCode] || 0) + quantity,
      }));

      // Use the itemName parameter here instead of a generic message
      if (response.data.message === "Item bought successfully") {
        // Force refresh to get updated inventory
        fetchItems(true);
        showSnackbar(`Successfully purchased ${quantity} ${itemName}!`);
        return true;
      }
    } catch (err: any) {
      // Error handling remains the same
      console.error("Purchase failed:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Failed to complete purchase. Please try again.";

      if (err.response?.data?.message === "Insufficient coins") {
        showSnackbar("You don't have enough coins for this purchase.");
      } else {
        showSnackbar(errorMessage);
      }
      return false;
    }
  };

  const handleUseItem = async (itemCode: string, itemName: string) => {
    if (!user?.firebase_uid) {
      showSnackbar("You need to be logged in to use an item.");
      return;
    }

    // Special handling for Tech Pass - redirect to create-study-material page
    if (itemCode === "ITEM002TP") {
      // Redirect to create material page
      navigate("/dashboard/study-material/create");
      return;
    }

    try {
      console.log(`Using item ${itemCode} for user ${user.firebase_uid}`);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/shop/use-item`,
        {
          firebase_uid: user.firebase_uid,
          item_code: itemCode,
        }
      );

      console.log("Item use response:", response.data);

      // For starter pack specifically, we'll handle it differently
      if (itemCode === "ITEM006SSP") {
        try {
          // First remove the starter pack
          setOwnedItems((prev) => {
            const updated = { ...prev };
            delete updated[itemCode]; // Starter pack is fully consumed

            // Immediately add the fortune coin to the same state update
            // Using ITEM004FC as the item code for Fortune Coin
            updated["ITEM004FC"] = (updated["ITEM004FC"] || 0) + 1;

            console.log("Updated inventory with fortune coin added:", updated);
            return updated;
          });

          // Also fetch fresh data from server to ensure everything is in sync
          const userItemsResponse = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/shop/user-item/${
              user.firebase_uid
            }`
          );

          // Update with the complete inventory from server
          const owned: Record<string, number> = {};
          userItemsResponse.data.forEach((item: any) => {
            owned[item.item_code] = item.quantity;
          });

          setOwnedItems(owned);
          console.log("Server inventory after starter pack use:", owned);
        } catch (err) {
          console.error("Failed to refresh inventory:", err);
        }
      } else {
        // Handle regular items as before
        setOwnedItems((prev) => {
          const updated = { ...prev };
          if (updated[itemCode] <= 1) {
            delete updated[itemCode];
          } else {
            updated[itemCode] = updated[itemCode] - 1;
          }
          return updated;
        });
      }

      // Show success message using snackbar
      showSnackbar(response.data.message || `${itemName} used successfully!`);

      // Update user stats in context based on response
      if (response.data.updatedStats) {
        updateUser(response.data.updatedStats);
      }
    } catch (err: any) {
      console.error("Failed to use item:", err);
      const errorMessage = err.response?.data?.message || "Failed to use item";
      const errorDetail = err.response?.data?.error || "";
      showSnackbar(
        `${errorMessage}${errorDetail ? " Details: " + errorDetail : ""}`
      );
    }
  };

  const getImagePaddingClass = (itemCode: string) => {
    // You can adjust this based on item codes or other properties
    switch (itemCode) {
      case "ITEM001MNB":
        return "pt-3";
      case "ITEM002TP":
        return "pt-4 scale-110";
      case "ITEM003RMB":
        return "pt-3";
      case "ITEM004FC":
        return "pt-3";
      case "ITEM005IT":
        return "pt-3";
      case "ITEM006SSP":
        return "pt-3 scale-150 pl-2";
      default:
        return "";
    }
  };

  const handleRefresh = () => {
    if (refreshCallback) {
      refreshCallback();
    } else {
      fetchItems(true); // Force refresh from server
    }
  };

  return (
    <PageTransition>
      <DocumentHead title="Shop | Duel Learn" />
      <div className="h-full w-full items-center text-white pb-6">
        {/* Premium section with responsive adjustments */}
        {!isPremium && (
          <div
            className="h-auto min-h-[200px] sm:h-[232px] rounded-[0.8rem] p-4 sm:p-6 text-center mb-4 sm:mb-6 flex flex-col justify-center items-center"
            style={{
              backgroundImage: `url(${PremiumAdsBG})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <h1 className="text-2xl sm:text-3xl mb-1 sm:mb-2 font-bold">
              Go Premium!
            </h1>
            <p className="text-[14px] sm:text-[16px] w-full sm:w-[360px] px-2 sm:px-0">
              Unlock advanced tools. Earn exclusive rewards. Enjoy ad-free
              learning!
            </p>
            <button
              className="mt-3 sm:mt-4 px-6 sm:px-10 py-2 text-[14px]  bg-white text-[#9F87E5] rounded-full font-bold hover:scale-105 transition-all duration-300 ease-in-out"
              onClick={() => navigate("/dashboard/buy-premium-account")}
            >
              TRY IT NOW
            </button>
          </div>
        )}

        {/* Premium activated section with responsive adjustments */}
        {isPremium && (
          <div
            className="h-auto min-h-[200px] sm:h-[232px] rounded-[0.8rem] p-4 sm:p-6 text-center mb-4 sm:mb-6 flex flex-col justify-center items-center"
            style={{
              backgroundImage: `url(${PremiumActivatedBG})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <h1 className="text-2xl sm:text-3xl mb-1 sm:mb-2 font-bold">
              Premium Perks Unlocked!
            </h1>
            <p className="text-[13px] sm:text-[15px] my-1 sm:my-2 w-full sm:w-[390px] px-2 sm:px-0">
              You're all set to access the best tools and rewards. Stay ahead
              with ad-free, uninterrupted learning.
            </p>
            <div className="flex gap-2">
              <button
                className="mt-3 sm:mt-4 px-6 sm:px-10 py-2 text-[14px] sm:text-[15px] bg-inherit  text-white hover:text-[#3e2880] hover:bg-white rounded-full transition-all duration-300 ease-in-out font-bold"
                onClick={() => navigate("/dashboard/buy-premium-account")}
              >
                More Info
              </button>
              <button
                className="mt-3 sm:mt-4 px-6 sm:px-10 py-2 text-[14px] sm:text-[15px] bg-white text-[#3e2880] rounded-full font-bold hover:scale-105 transition-all duration-300 ease-in-out"
                onClick={handleOpenCancelSubsModal}
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        )}

        <hr className="border-t-2 border-[#3B354D] mb-6" />

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col gap-1 justify-center items-center ">
            <img
              src={cauldronGif}
              alt="Loading..."
              style={{ width: "12rem", height: "auto" }}
            />
            <p className="text-lg text-[#9F9BAE]">Loading Shop items...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-red-400">{error}</p>
          </div>
        )}

        {/* Responsive grid for shop items */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {items.map((item) => (
              <div
                key={item.item_code}
                className="border-[0.2rem] border-[#3B354C] rounded-[1rem] shadow-lg py-4 sm:py-7 px-4 sm:px-7 flex flex-col items-center pb-4 aspect-w-1 aspect-h-1 relative"
              >
                <div className="relative">
                  <img
                    src={item.item_picture_url}
                    alt={item.item_name}
                    className={`w-20 h-20 sm:w-24 sm:h-24 object-contain mb-3 sm:mb-4 rounded ${getImagePaddingClass(
                      item.item_code
                    )}`}
                  />
                </div>
                <h2 className="text-base sm:text-lg font-bold mb-1 sm:mb-1">
                  {item.item_name}
                </h2>
                <p className=" sm:text-sm text-[#9F9BAE] mb-6  sm:mb-6 text-center">
                  {item.item_description}
                </p>
                <div className="flex-grow"></div>
                <div className="flex gap-2 mb-2 sm:mb-3 w-full">
                  {(ownedItems[item.item_code] || 0) > 0 && (
                    <button
                      className="flex-1 border-2 rounded-[0.8rem] border-[#afafaf]  py-1.5 sm:py-2 text-sm font-bold sm:text-base hover:bg-[#381898] hover:border-[#381898] transition-all duration-300 ease-in-out"
                      onClick={() =>
                        handleUseItem(item.item_code, item.item_name)
                      }
                    >
                      {item.item_code === "ITEM002TP"
                        ? "Use"
                        : `Use (${ownedItems[item.item_code] || 0})`}
                    </button>
                  )}
                  {(ownedItems[item.item_code] || 0) < 5 && (
                    <button
                      className="flex-1 border rounded-[0.8rem] border-[#E2DDF3] text-[#3B354D]  py-1.5 sm:py-2 bg-[#E2DDF3] flex items-center justify-center hover:bg-[#381898] hover:border-[#381898] hover:text-[#E2DDF3] text-sm sm:text-base transition-all duration-300 ease-in-out"
                      onClick={() => openModal(item)}
                    >
                      <span>Buy for </span>
                      <img
                        src={CoinIcon}
                        alt="Coin"
                        className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2"
                      />
                      <span
                        style={{
                          color: "#9C8307",
                          marginLeft: "5px",
                          fontWeight: "bold",
                        }}
                      >
                        {item.item_price}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shop Item Modal */}
      {selectedItem && (
        <ShopItemModal
          isModalOpen={isModalOpen}
          closeModal={closeModal}
          selectedItem={{
            ...selectedItem,
            id: parseInt(selectedItem.item_code),
            name: selectedItem.item_name,
            buyLabel: String(selectedItem.item_price),
            owned: ownedItems[selectedItem.item_code] || 0,
            image: selectedItem.item_picture_url,
          }}
          quantity={quantity}
          handleIncrement={handleIncrement}
          handleDecrement={handleDecrement}
          handlePurchase={handlePurchase}
          userCoins={userCoins}
        />
      )}

      {/* Snackbar for notifications */}
      <AutoHideSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        onClose={handleSnackbarClose}
        onClick={handleRefresh}
        action={isSnackbarAction}
      />
      <CancelSubscription
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
      />
    </PageTransition>
  );
};

export default Shop;
