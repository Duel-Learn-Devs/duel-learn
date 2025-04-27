import sampleAvatar from "/profile-picture/default-picture.svg";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import RefreshIcon from "@mui/icons-material/Refresh";
import useAccountSettings from "../../../hooks/useAccountSettings";
import ProfilePictureModal from "../../../components/ProfilePictureModal";
import useProfilePicture from "../../../hooks/useProfilePicture";
import DeleteAccountModal from "../../../components/DeleteAccountModal";
import { CircularProgress } from "@mui/material";
import { useUser } from "../../../contexts/UserContext";
import { useState } from "react";
import { Button } from "@mui/material";
import { toast } from "react-hot-toast";
import PasswordValidationTooltip from "../../../components/PasswordValidationTooltip";

export default function AccountSettings() {
  const { user, refreshUserData } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const {
    formik,
    isEditing,
    isChangingPassword,
    isCreatingPassword,
    showPassword,
    showConfirmPassword,
    error,
    hasNoPassword,
    isLoading,
    handleEditClick,
    handleDiscardClick,
    handlePasswordChangeClick,
    handleCreatePasswordClick,
    togglePassword,
    toggleConfirmPassword,
    hasChanges,
    handleProfilePictureChange,
    isDeleteModalOpen,
    isDeletingAccount,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteAccount,
    handleUsernameChange,
  } = useAccountSettings();

  const {
    isModalOpen,
    selectedPicture,
    availablePictures,
    openModal,
    closeModal,
    handlePictureSelect,
    handleSave,
  } = useProfilePicture(formik.values.display_picture || sampleAvatar);

  const handleProfilePictureSave = () => {
    if (!isEditing) return;
    const newPicture = handleSave();
    handleProfilePictureChange(newPicture);
  };

  const handleRefresh = async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      await refreshUserData();
      toast.success("User data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh user data");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="h-auto w-full">
      <main>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-0">
            Account Settings
          </h1>

          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="contained"
            color="primary"
            startIcon={
              <RefreshIcon className={refreshing ? "animate-spin" : ""} />
            }
            sx={{ backgroundColor: "#4D18E8" }}
            size="small"
            className="w-full sm:w-auto"
          >
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>

        <div className="flex items-start justify-start">
          <form
            onSubmit={formik.handleSubmit}
            className="bg-[#0D0A17] rounded-[1rem] p-4 sm:p-6 md:p-8 lg:p-12 space-y-6 sm:space-y-8 w-full max-w-[1100px]"
          >
            {/* Profile Image Section */}
            {error.general && (
              <div className="w-full px-4 py-2 bg-red-100 text-red-600 rounded-[0.8rem] border border-red-300">
                {error.general}
              </div>
            )}
            <div className="space-y-4">
              <label className="block text-[1rem] sm:text-[1.05rem] text-[#9F9BAE]">
                Profile Image
              </label>
              <div className="flex items-center justify-center sm:justify-start gap-6">
                <img
                  src={formik.values.display_picture || sampleAvatar}
                  alt="Profile"
                  className={`w-32 h-32 sm:w-[198px] sm:h-[194.49px] rounded-lg ${
                    isEditing
                      ? "cursor-pointer hover:opacity-80"
                      : "cursor-not-allowed"
                  }`}
                  onClick={() => isEditing && openModal()}
                />
              </div>
            </div>

            {/* Username Section */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="block text-[1rem] sm:text-[1.05rem] text-[#9F9BAE]"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                {...formik.getFieldProps("username")}
                onChange={handleUsernameChange}
                disabled={!isEditing}
                className="w-full md:w-[1000px] h-[47px] px-6 py-5 bg-[#3B354D] rounded-[0.8rem] focus:outline-none focus:ring-2 focus:ring-[#4D18E8] focus:border-[#4D18E8] transition-colors"
                style={{ color: isEditing ? "white" : "#6F658D" }}
              />
              {formik.touched.username && formik.errors.username && (
                <p className="text-red-500 text-sm mt-1">
                  {formik.errors.username}
                </p>
              )}
            </div>

            {/* Email Section */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-[1rem] sm:text-[1.05rem] text-[#9F9BAE]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full md:w-[1000px] h-[47px] px-6 py-5 bg-[#3B354D] text-[#6F658D] rounded-[0.8rem] focus:outline-none focus:ring-2 focus:ring-[#4D18E8] focus:border-[#4D18E8] transition-colors"
              />
            </div>

            {/* Password Section */}
            {hasNoPassword ? (
              !isCreatingPassword ? (
                isEditing && (
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="block text-[1rem] sm:text-[1.05rem] text-[#9F9BAE]"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleCreatePasswordClick}
                      className="w-full md:w-[1000px] h-[47px] px-4 bg-[#2a2435] text-[#9F9BAE] rounded-[0.8rem] hover:bg-[#3b354d] transition-colors"
                    >
                      Create Password
                    </button>
                  </div>
                )
              ) : (
                <>
                  {error.general && (
                    <div className="w-full px-4 py-2 bg-red-100 text-red-600 rounded-[0.8rem] border border-red-300">
                      {error.general}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label
                      htmlFor="newpassword"
                      className="block text-[1rem] sm:text-[1.05rem] text-[#9F9BAE]"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="newpassword"
                        {...formik.getFieldProps("newpassword")}
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={(e) => {
                          formik.handleBlur(e);
                          setIsPasswordFocused(false);
                        }}
                        className="w-full md:w-[1000px] h-[47px] px-6 py-5 bg-[#3B354D] rounded-[0.8rem] focus:outline-none focus:ring-2 focus:ring-[#4D18E8] focus:border-[#4D18E8] transition-colors"
                        style={{ color: isEditing ? "white" : "#6F658D" }}
                      />
                      <button
                        type="button"
                        onClick={togglePassword}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9F9BAE]"
                      >
                        {showPassword ? (
                          <VisibilityRoundedIcon />
                        ) : (
                          <VisibilityOffRoundedIcon />
                        )}
                      </button>

                      <div className="relative">
                        <PasswordValidationTooltip
                          password={formik.values.newpassword}
                          isVisible={
                            isPasswordFocused ||
                            !!(
                              formik.touched.newpassword &&
                              formik.errors.newpassword
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="block text-[1rem] sm:text-[1.05rem] text-[#9F9BAE]"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        {...formik.getFieldProps("confirmPassword")}
                        className="w-full md:w-[1000px] h-[47px] px-6 py-5 bg-[#3B354D] rounded-[0.8rem] focus:outline-none focus:ring-2 focus:ring-[#4D18E8] focus:border-[#4D18E8] transition-colors"
                        style={{ color: isEditing ? "white" : "#6F658D" }}
                      />
                      <button
                        type="button"
                        onClick={toggleConfirmPassword}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9F9BAE]"
                      >
                        {showConfirmPassword ? (
                          <VisibilityRoundedIcon />
                        ) : (
                          <VisibilityOffRoundedIcon />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )
            ) : !isChangingPassword ? (
              isEditing && (
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-[1rem] sm:text-[1.05rem] text-[#9F9BAE]"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handlePasswordChangeClick}
                    className="w-full text-center md:w-[1000px] h-[47px] px-6  bg-[#2a2435] text-[#9F9BAE] rounded-[0.8rem] hover:bg-[#3b354d] transition-colors"
                  >
                    Change Password
                  </button>
                </div>
              )
            ) : (
              <>
                <div className="space-y-2">
                  <label
                    htmlFor="newpassword"
                    className="block text-[1rem] sm:text-[1.05rem] text-[#9F9BAE]"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="newpassword"
                      {...formik.getFieldProps("newpassword")}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={(e) => {
                        formik.handleBlur(e);
                        setIsPasswordFocused(false);
                      }}
                      className="w-full md:w-[1000px] h-[47px] px-6 py-5 bg-[#3B354D] rounded-[0.8rem] focus:outline-none focus:ring-2 focus:ring-[#4D18E8] focus:border-[#4D18E8] transition-colors"
                      style={{ color: isEditing ? "white" : "#6F658D" }}
                    />
                    <button
                      type="button"
                      onClick={togglePassword}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9F9BAE]"
                    >
                      {showPassword ? (
                        <VisibilityRoundedIcon />
                      ) : (
                        <VisibilityOffRoundedIcon />
                      )}
                    </button>

                    <div className="relative">
                      <PasswordValidationTooltip
                        password={formik.values.newpassword}
                        isVisible={
                          isPasswordFocused ||
                          !!(
                            formik.touched.newpassword &&
                            formik.errors.newpassword
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-[1rem] sm:text-[1.05rem] text-[#9F9BAE]"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      {...formik.getFieldProps("confirmPassword")}
                      className="w-full md:w-[1000px] h-[47px] px-6 py-5 bg-[#3B354D] rounded-[0.8rem] focus:outline-none focus:ring-2 focus:ring-[#4D18E8] focus:border-[#4D18E8] transition-colors"
                      style={{ color: isEditing ? "white" : "#6F658D" }}
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPassword}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9F9BAE]"
                    >
                      {showConfirmPassword ? (
                        <VisibilityRoundedIcon />
                      ) : (
                        <VisibilityOffRoundedIcon />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}

            <div className="flex flex-col sm:flex-row gap-4">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDiscardClick}
                  className="px-8 py-2 bg-[#2a2435] text-[#9F9BAE] rounded-[0.8rem] hover:bg-[#3B354D] transition-colors w-full sm:w-auto"
                >
                  {hasChanges() ? "Discard" : "Cancel"}
                </button>
              )}

              {/* Show Edit button when not editing */}
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="px-10 py-2 bg-[#381898] text-white rounded-[0.8rem] hover:bg-[#4D18E8] transition-colors w-full sm:w-auto"
                >
                  Edit
                </button>
              )}

              {/* Only show Save button when editing AND there are changes */}
              {isEditing && hasChanges() && (
                <button
                  type="submit"
                  className="px-10 py-2 bg-[#381898] text-white rounded-[0.8rem] hover:bg-[#4D18E8] transition-colors w-full sm:w-auto"
                >
                  {isLoading ? <CircularProgress size={24} /> : "Save"}
                </button>
              )}
            </div>
            {/* Delete Account Section */}
            <div className="bg-[#1a1625]/50 rounded-lg p-4 sm:p-8 mt-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">
                Delete Account
              </h2>
              <p className="text-gray-400 mb-6">
                This will delete all your data and cannot be undone.
              </p>
              <button
                type="button"
                onClick={openDeleteModal}
                className="w-full sm:w-[182.45px] h-[45px] bg-[#f13f42] text-white rounded-lg hover:bg-red-900 transition-colors"
              >
                Delete
              </button>
            </div>
          </form>
        </div>
      </main>

      <ProfilePictureModal
        isOpen={isModalOpen}
        onClose={closeModal}
        pictures={availablePictures}
        selectedPicture={selectedPicture}
        onPictureSelect={handlePictureSelect}
        onSave={handleProfilePictureSave}
        isEditing={isEditing}
      />

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteAccount}
        isLoading={isDeletingAccount}
      />
    </div>
  );
}
