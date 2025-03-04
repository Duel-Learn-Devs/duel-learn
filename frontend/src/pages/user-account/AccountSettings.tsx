<<<<<<< HEAD
"use client";

import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Avatar from "../../assets/profile-picture/bunny-picture.png";

export default function AccountSettings() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
=======
import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import sampleAvatar from "../../assets/profile-picture/bunny-picture.png"; // Import the sample avatar image
import useEditUsernameValidation from "../../hooks/validation.hooks/useEditUsernameValidation"; // Import the new validation hook
import useChangePasswordValidation from "../../hooks/validation.hooks/useChangePasswordValidation"; // Import the change password validation hook
import useUpdateUserDetailsApi from "../../hooks/api.hooks/useUpdateUserDetailsApi"; // Import the API hook
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { linkWithCredential, EmailAuthProvider } from "firebase/auth"; // Import Firebase auth functions
import { auth } from "../../services/firebase"; // Import the Firebase auth service
import { db } from "../../services/firebase"; // Import the Firestore database service
import { doc, getDoc } from "firebase/firestore"; // Import the Firestore functions
import bcrypt from "bcryptjs"; // Import the bcrypt library
import CircularProgress from "@mui/material/CircularProgress"; // Import CircularProgress component
import useAccountSettings from '../../hooks/useAccountSettings';
import ProfilePictureModal from '../../components/ProfilePictureModal';
import useProfilePicture from '../../hooks/useProfilePicture';
import DeleteAccountModal from "../../components/DeleteAccountModal";

export default function AccountSettings() {
  const {
    selectedIndex,
    setSelectedIndex,
    userData,
    isEditing,
    isChangingPassword,
    isCreatingPassword,
    showPassword,
    showConfirmPassword,
    errors,
    passwordErrors,
    error,
    hasNoPassword,
    isLoading,
    handleEditClick,
    handleSaveClick,
    handleDiscardClick,
    handleInputChange,
    handlePasswordChangeClick,
    handleCreatePasswordClick,
    handleLinkCredential,
    togglePassword,
    toggleConfirmPassword,
    hasChanges,
    validate,
    validatePassword,
    handleProfilePictureChange,
    isDeleteModalOpen,
    isDeletingAccount,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteAccount,
  } = useAccountSettings();

  const {
    isModalOpen,
    selectedPicture,
    availablePictures,
    openModal,
    closeModal,
    handlePictureSelect,
    handleSave,
  } = useProfilePicture(userData.display_picture || sampleAvatar);

  const handleProfilePictureSave = () => {
    if (!isEditing) return;
    const newPicture = handleSave();
    handleProfilePictureChange(newPicture);
  };
>>>>>>> origin/beta-branch

  return (
    <div className="flex min-h-screen bg-[#080511] text-white" style={{ fontFamily: "Nunito, sans-serif" }}>
      {/* Sidebar */}
      <aside className="hidden lg:block pl-4 pr-4 h-screen sticky top-0">
        <Sidebar selectedIndex={selectedIndex} setSelectedIndex={setSelectedIndex} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto" style={{ width: "1137px", height: "calc(100vh - 64px)" }}>
        <div className="h-[5vh]"></div> {/* This pushes the content down */}
        <h1 className="text-2xl font-semibold mb-10" style={{ fontFamily: "Nunito, sans-serif" }}>
          Account Settings
        </h1>
        <div className="flex items-start">
<<<<<<< HEAD
          <div className="bg-[#1a1625]/50 rounded-lg p-8 space-y-10">
            <div className="space-y-4">
              <label className="block text-sm font-medium" style={{ fontFamily: "Nunito, sans-serif", fontSize: "20px" }}>
=======
          <div className="bg-[#1a1625]/50 rounded-lg p-8 space-y-8">
            {/* Profile Image Section */}
            <div className="space-y-4">
              <label className="block text-[20px] font-medium text-[#6F658D]">
>>>>>>> origin/beta-branch
                Profile Image
              </label>
              <div className="flex items-center gap-6">
                <img
<<<<<<< HEAD
                  src={Avatar || "/placeholder.svg"}
                  alt="Profile"
                  className="w-12 h-12"
                  style={{ width: "198px", height: "194.49px" }}
                />
              </div>
            </div>
            <div className="flex flex-col items-start space-y-4">
              <label
                htmlFor="username"
                className="block text-sm font-medium w-full"
                style={{ fontFamily: "Nunito, sans-serif", fontSize: "20px" }}
=======
                  src={userData.display_picture || sampleAvatar}
                  alt="Profile"
                  className={`w-[198px] h-[194.49px] rounded-lg ${isEditing ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}`}
                  onClick={() => isEditing && openModal()}
                />
              </div>
            </div>

            {/* Username Section */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="block text-[20px] font-medium text-[#6F658D]"
>>>>>>> origin/beta-branch
              >
                Username
              </label>
              <input
                id="username"
                type="text"
<<<<<<< HEAD
                className="w-[850px] h-[47px] px-3 py-2 bg-[#2a2435] border border-[#3b354d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4D18E8]"
                style={{ fontFamily: "Nunito, sans-serif" }}
              />
            </div>
            <div className="flex flex-col items-start space-y-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium w-full"
                style={{ fontFamily: "Nunito, sans-serif", fontSize: "20px" }}
=======
                value={userData.username || ""}
                disabled={!isEditing}
                onChange={handleInputChange}
                onBlur={(e) => validate("username", e.target.value)}
                className="w-[850px] h-[47px] px-4 bg-[#2a2435] border border-[#3b354d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4D18E8]"
                style={{ color: isEditing ? "white" : "#6F658D" }}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            {/* Email Section */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-[20px] font-medium text-[#6F658D]"
>>>>>>> origin/beta-branch
              >
                Email
              </label>
              <input
                id="email"
                type="email"
<<<<<<< HEAD
                className="w-[850px] h-[47px] px-3 py-2 bg-[#2a2435] border border-[#3b354d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4D18E8]"
                style={{ fontFamily: "Nunito, sans-serif" }}
              />
            </div>
            <div className="flex flex-col items-start space-y-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium w-full"
                style={{ fontFamily: "Nunito, sans-serif", fontSize: "20px" }}
              >
                Create Password
              </label>
              <input
                id="password"
                type="password"
                className="w-[850px] h-[47px] px-3 py-2 bg-[#2a2435] border border-[#3b354d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4D18E8]"
                style={{ fontFamily: "Nunito, sans-serif" }}
              />
            </div>
            <div className="flex flex-col items-start space-y-4">
              <label
                htmlFor="confirm"
                className="block text-sm font-medium w-full"
                style={{ fontFamily: "Nunito, sans-serif", fontSize: "20px" }}
              >
                Confirm Password
              </label>
              <input
                id="confirm"
                type="password"
                className="w-[850px] h-[47px] px-3 py-2 bg-[#2a2435] border border-[#3b354d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4D18E8]"
                style={{ fontFamily: "Nunito, sans-serif" }}
              />
            </div>
            <div className="flex gap-2 mt-1">
              <button
                className="px-6 py-2 bg-[#2a2435] text-[#6F658D] rounded-lg hover:bg-[#3b354d] transition-colors"
                style={{ fontFamily: "Nunito, sans-serif", width: "182.45px", height: "45px" }}
=======
                value={userData.email || ""}
                disabled
                className="w-[850px] h-[47px] px-4 bg-[#2a2435] border border-[#3b354d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4D18E8] text-[#6F658D]"
              />
            </div>

            {/* Password Section */}
            {hasNoPassword ? (
              !isCreatingPassword ? (
                isEditing && (
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="block text-[20px] font-medium text-[#6F658D]"
                    >
                      Password
                    </label>
                    <button
                      onClick={handleCreatePasswordClick}
                      className="w-[850px] h-[47px] px-4 bg-[#2a2435] text-[#6F658D] rounded-lg hover:bg-[#3b354d] transition-colors"
                    >
                      Create Password
                    </button>
                  </div>
                )
              ) : (
                <>
                  {error.general && (
                    <div className="w-[850px] px-4 py-2 bg-red-100 text-red-600 rounded-md border border-red-300">
                      {error.general}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label
                      htmlFor="newpassword"
                      className="block text-[20px] font-medium text-[#6F658D]"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="newpassword"
                        onChange={handleInputChange}
                        onBlur={(e) => validatePassword("newpassword", e.target.value, userData)}
                        className="w-[850px] h-[47px] px-4 pr-12 bg-[#2a2435] border border-[#3b354d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4D18E8]"
                        style={{ color: isEditing ? "white" : "#6F658D" }}
                      />
                      <button
                        type="button"
                        onClick={togglePassword}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9F9BAE]"
                      >
                        {showPassword ? <VisibilityRoundedIcon /> : <VisibilityOffRoundedIcon />}
                      </button>
                    </div>
                    {passwordErrors.newpassword && (
                      <p className="text-red-500 text-sm mt-1">{passwordErrors.newpassword}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="block text-[20px] font-medium text-[#6F658D]"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        onChange={handleInputChange}
                        onBlur={(e) => validatePassword("confirmPassword", e.target.value, userData)}
                        className="w-[850px] h-[47px] px-4 pr-12 bg-[#2a2435] border border-[#3b354d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4D18E8]"
                        style={{ color: isEditing ? "white" : "#6F658D" }}
                      />
                      <button
                        type="button"
                        onClick={toggleConfirmPassword}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9F9BAE]"
                      >
                        {showConfirmPassword ? <VisibilityRoundedIcon /> : <VisibilityOffRoundedIcon />}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>
                </>
              )
            ) : (
              !isChangingPassword ? (
                isEditing && (
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="block text-[20px] font-medium text-[#6F658D]"
                    >
                      Password
                    </label>
                    <button
                      onClick={handlePasswordChangeClick}
                      className="w-[850px] h-[47px] px-4 bg-[#2a2435] text-[#6F658D] rounded-lg hover:bg-[#3b354d] transition-colors"
                    >
                      Change Password
                    </button>
                  </div>
                )
              ) : (
                <>
                  {error.general && (
                    <div className="w-[850px] px-4 py-2 bg-red-100 text-red-600 rounded-md border border-red-300">
                      {error.general}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label
                      htmlFor="newpassword"
                      className="block text-[20px] font-medium text-[#6F658D]"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="newpassword"
                        onChange={handleInputChange}
                        onBlur={(e) => validatePassword("newpassword", e.target.value, userData)}
                        className="w-[850px] h-[47px] px-4 pr-12 bg-[#2a2435] border border-[#3b354d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4D18E8]"
                        style={{ color: isEditing ? "white" : "#6F658D" }}
                      />
                      <button
                        type="button"
                        onClick={togglePassword}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9F9BAE]"
                      >
                        {showPassword ? <VisibilityRoundedIcon /> : <VisibilityOffRoundedIcon />}
                      </button>
                    </div>
                    {passwordErrors.newpassword && (
                      <p className="text-red-500 text-sm mt-1">{passwordErrors.newpassword}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="block text-[20px] font-medium text-[#6F658D]"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        onChange={handleInputChange}
                        onBlur={(e) => validatePassword("confirmPassword", e.target.value, userData)}
                        className="w-[850px] h-[47px] px-4 pr-12 bg-[#2a2435] border border-[#3b354d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4D18E8]"
                        style={{ color: isEditing ? "white" : "#6F658D" }}
                      />
                      <button
                        type="button"
                        onClick={toggleConfirmPassword}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9F9BAE]"
                      >
                        {showConfirmPassword ? <VisibilityRoundedIcon /> : <VisibilityOffRoundedIcon />}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>
                </>
              )
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleDiscardClick}
                className="w-[182.45px] h-[45px] bg-[#2a2435] text-[#6F658D] rounded-lg hover:bg-[#3b354d] transition-colors"
>>>>>>> origin/beta-branch
              >
                Discard
              </button>
              <button
<<<<<<< HEAD
                className="px-6 py-2 bg-[#4D18E8] text-white rounded-lg hover:bg-[#3b13b3] transition-colors"
                style={{ fontFamily: "Nunito, sans-serif", width: "182.45px", height: "45px" }}
              >
                Save
              </button>
            </div>
            <div className="bg-[#1a1625]/50 rounded-lg p-6 mt-10">
              <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "Nunito, sans-serif" }}>
                Delete Account
              </h2>
              <p className="text-gray-400 mb-6" style={{ fontFamily: "Nunito, sans-serif" }}>
                This will delete all your data and cannot be undone.
              </p>
              <button
                className="px-6 py-2 bg-[#FF3B3F] text-white rounded-lg hover:bg-red-800 transition-colors"
                style={{ fontFamily: "Nunito, sans-serif", width: "182.45px", height: "45px" }}
=======
                onClick={isEditing ? handleSaveClick : handleEditClick}
                className={`w-[182.45px] h-[45px] ${isEditing ? "bg-[#4D18E8]" : "bg-[#2a2435]"} text-white rounded-lg hover:bg-[#3b13b3] transition-colors`}
                disabled={isEditing && !hasChanges()}
              >
                {isLoading ? <CircularProgress size={24} /> : isEditing ? "Save" : "Edit"}
              </button>
            </div>

            {/* Delete Account Section */}
            <div className="bg-[#1a1625]/50 rounded-lg p-6 mt-8">
              <h2 className="text-xl font-semibold mb-4">
                Delete Account
              </h2>
              <p className="text-gray-400 mb-6">
                This will delete all your data and cannot be undone.
              </p>
              <button
                onClick={openDeleteModal}
                className="w-[182.45px] h-[45px] bg-[#FF3B3F] text-white rounded-lg hover:bg-red-800 transition-colors"
>>>>>>> origin/beta-branch
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </main>
<<<<<<< HEAD
=======

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
>>>>>>> origin/beta-branch
    </div>
  );
}