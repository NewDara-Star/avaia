/**
 * CreateProfileModal Component
 *
 * Modal dialog for creating a new profile.
 * User enters name (3-20 chars) and selects avatar.
 *
 * On success:
 * - New profile is created in profiles.db
 * - User is switched to new profile
 * - App reloads with onboarding flow
 */

import React, { useState } from "react";
import { useProfiles } from "../hooks/useProfiles.js";
import { AvatarEmoji, CreateProfileInput } from "../types.js";

const AVAILABLE_AVATARS: AvatarEmoji[] = [
  "🚀",
  "👶",
  "🎓",
  "⭐",
  "🔥",
  "💡",
  "🎯",
  "🌟",
];

interface CreateProfileModalProps {
  onClose: () => void;
}

export const CreateProfileModal: React.FC<CreateProfileModalProps> = ({
  onClose,
}) => {
  const { createProfile, isLoading, error: globalError } = useProfiles();
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarEmoji>("🚀");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const nameLength = name.length;
  const isNameValid = nameLength >= 3 && nameLength <= 20;
  const canSubmit = isNameValid && !isSubmitting && !isLoading;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setFieldError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isNameValid) {
      setFieldError("Profile name must be 3-20 characters");
      return;
    }

    setIsSubmitting(true);
    setFieldError(null);

    const input: CreateProfileInput = {
      name: name.trim(),
      avatar: selectedAvatar,
    };

    const result = await createProfile(input);

    if (result?.success) {
      // Profile created successfully
      // TODO: Switch to new profile and trigger onboarding
      // For now, just close the modal
      onClose();
    } else {
      setFieldError(result?.error ?? "Failed to create profile");
    }

    setIsSubmitting(false);
  };

  const error = fieldError || globalError;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Create New Profile
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Each child gets their own learning space
            </p>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Profile Name */}
            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1">
                Profile Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g., Sarah, Child-1"
                maxLength={20}
                disabled={isSubmitting || isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <div className="text-xs text-gray-500 mt-1">
                {nameLength}/20 characters (min 3)
              </div>
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Avatar
              </label>
              <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    disabled={isSubmitting || isLoading}
                    className={`p-3 rounded-lg text-2xl transition-all border-2 ${
                      selectedAvatar === avatar
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="pt-2 pb-4 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">Preview:</p>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-3xl">{selectedAvatar}</span>
                <div>
                  <div className="font-semibold text-gray-900">{name || "Profile Name"}</div>
                  <div className="text-xs text-gray-500">New profile</div>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isSubmitting || isLoading}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Profile"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
