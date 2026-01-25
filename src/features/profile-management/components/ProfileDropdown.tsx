/**
 * ProfileDropdown Component
 *
 * Dropdown menu for viewing and switching between profiles.
 * Appears when user clicks avatar in header.
 *
 * UI Spec:
 * - Width: 360px
 * - White background, rounded corners (12px), shadow
 * - Shows current profile with checkmark
 * - Shows other profiles
 * - "Add New Profile" button at bottom
 */

import React, { useState } from "react";
import { useProfiles } from "../hooks/useProfiles.js";
import { CreateProfileModal } from "./CreateProfileModal.js";
import { Profile } from "../types.js";

interface ProfileDropdownProps {
  onClose?: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  onClose,
}) => {
  const {
    profiles,
    currentProfileId,
    isLoading,
    error,
    switchProfile,
  } = useProfiles();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  const currentProfile = profiles.find((p) => p.id === currentProfileId);

  const handleSwitchProfile = async (profile: Profile) => {
    setSwitchingTo(profile.id);
    const result = await switchProfile(profile.id);
    setSwitchingTo(null);

    if (result?.success) {
      onClose?.();
      // App will reload, so no need to update state
    }
  };

  const handleCreateModalClose = () => {
    setShowCreateModal(false);
  };

  return (
    <>
      <div
        className="absolute right-0 mt-2 w-[360px] bg-white rounded-[12px] shadow-lg p-4 border border-gray-200 z-50"
        role="menu"
      >
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <>
            {/* Current Profile Section */}
            {currentProfile && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Current Profile
                </div>
                <div
                  className="p-3 rounded-lg bg-blue-50 border-l-4 border-blue-500 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{currentProfile.avatar}</span>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {currentProfile.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {currentProfile.track || "No track selected"}
                      </div>
                    </div>
                  </div>
                  <span className="text-lg">✓</span>
                </div>
              </div>
            )}

            {/* Other Profiles Section */}
            {profiles.length > 1 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Other Profiles
                </div>
                <div className="space-y-2">
                  {profiles
                    .filter((p) => p.id !== currentProfileId)
                    .map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => handleSwitchProfile(profile)}
                        disabled={switchingTo === profile.id}
                        className="w-full p-3 rounded-lg hover:bg-gray-100 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{profile.avatar}</span>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {profile.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {profile.last_opened_at
                                ? `Last used: ${formatTimeAgo(profile.last_opened_at)}`
                                : "Never opened"}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Add Profile Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full py-2 px-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors text-center text-gray-600 hover:text-blue-600 font-medium"
            >
              + Add New Profile
            </button>
          </>
        )}
      </div>

      {/* Create Profile Modal */}
      {showCreateModal && (
        <CreateProfileModal onClose={handleCreateModalClose} />
      )}
    </>
  );
};

/**
 * Format ISO timestamp as relative time
 * e.g., "2 days ago", "1 hour ago"
 */
function formatTimeAgo(isoString: string): string {
  const now = new Date();
  const then = new Date(isoString);
  const secondsAgo = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (secondsAgo < 60) return "just now";
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
  if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d ago`;

  return then.toLocaleDateString();
}
