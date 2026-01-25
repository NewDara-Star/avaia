/**
 * Profile IPC Handlers
 *
 * Electron IPC endpoints for profile operations.
 * These run in the main process and communicate with renderer.
 *
 * Endpoints:
 * - profile:list
 * - profile:create
 * - profile:get-current
 * - profile:switch
 * - profile:delete
 * - profile:update
 */

import { ipcMain } from "electron";
import {
  createProfile,
  listProfiles,
  getProfile,
  deleteProfile,
  updateProfile,
  markProfileOpened,
} from "./profile-service.js";
import { CreateProfileInput } from "../types.js";

/**
 * Store for tracking current profile in main process
 * (Usually stored in preferences/settings)
 */
let currentProfileId: string | null = null;

export function setCurrentProfileId(profileId: string | null): void {
  currentProfileId = profileId;
}

export function getCurrentProfileId(): string | null {
  return currentProfileId;
}

/**
 * Register all profile IPC handlers
 *
 * Call this during app initialization (in main process)
 */
export function registerProfileIpcHandlers(): void {
  // List all profiles
  ipcMain.handle("profile:list", async () => {
    try {
      return listProfiles();
    } catch (err) {
      console.error("profile:list error:", err);
      return [];
    }
  });

  // Create profile
  ipcMain.handle("profile:create", async (_event, input: CreateProfileInput) => {
    try {
      const result = createProfile(input);
      if (result.success) {
        // Auto-switch to new profile
        setCurrentProfileId(result.data.id);
        // TODO: Initialize progress.db for new profile
        // TODO: Reload app with onboarding flow
      }
      return result;
    } catch (err) {
      console.error("profile:create error:", err);
      return {
        success: false,
        error: "Failed to create profile",
      };
    }
  });

  // Get current profile
  ipcMain.handle("profile:get-current", async () => {
    try {
      if (!currentProfileId) return null;
      return getProfile(currentProfileId);
    } catch (err) {
      console.error("profile:get-current error:", err);
      return null;
    }
  });

  // Switch profile
  ipcMain.handle("profile:switch", async (_event, profileId: string) => {
    try {
      const profile = getProfile(profileId);
      if (!profile) {
        return {
          success: false,
          error: "Profile not found",
        };
      }

      // Update last_opened_at
      markProfileOpened(profileId);
      setCurrentProfileId(profileId);

      // TODO: Close active session, load new profile data
      // TODO: Reload app window

      return { success: true };
    } catch (err) {
      console.error("profile:switch error:", err);
      return {
        success: false,
        error: "Failed to switch profile",
      };
    }
  });

  // Delete profile
  ipcMain.handle(
    "profile:delete",
    async (_event, profileId: string, confirmationName: string) => {
      try {
        const result = deleteProfile(profileId, confirmationName);
        if (result.success) {
          // If deleting current profile, switch to first available
          if (currentProfileId === profileId) {
            const profiles = listProfiles();
            if (profiles.length > 0) {
              setCurrentProfileId(profiles[0].id);
              // TODO: Reload app
            }
          }
        }
        return result;
      } catch (err) {
        console.error("profile:delete error:", err);
        return {
          success: false,
          error: "Failed to delete profile",
        };
      }
    }
  );

  // Update profile metadata
  ipcMain.handle(
    "profile:update",
    async (_event, profileId: string, updates: Partial<any>) => {
      try {
        return updateProfile(profileId, updates);
      } catch (err) {
        console.error("profile:update error:", err);
        return {
          success: false,
          error: "Failed to update profile",
        };
      }
    }
  );
}

/**
 * Initialize profile system on app startup
 *
 * - Load the last opened profile from storage
 * - If no profile exists, create first profile
 * - Run legacy import if needed
 *
 * Call this in app.whenReady().then(...)
 */
export async function initializeProfileSystem(): Promise<void> {
  try {
    const profiles = listProfiles();

    if (profiles.length === 0) {
      console.log("No profiles found, this is first launch");
      // Create default first profile
      const result = createProfile({
        name: "My Profile",
        avatar: "🚀",
      });

      if (result.success) {
        setCurrentProfileId(result.data.id);
        console.log(`Created default profile: ${result.data.id}`);
      } else {
        console.error(`Failed to create default profile: ${result.error}`);
      }
    } else {
      // Load last opened profile
      const lastOpened = profiles[0];
      setCurrentProfileId(lastOpened.id);
      console.log(`Loaded profile: ${lastOpened.name} (${lastOpened.id})`);
    }
  } catch (err) {
    console.error("Failed to initialize profile system:", err);
  }
}
