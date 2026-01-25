/**
 * Electron Preload Script
 *
 * Runs in a privileged context with access to Node APIs.
 * Exposes safe IPC methods to the renderer process via window.__mainApi.
 *
 * Security model:
 * - Only expose explicit methods (not all Electron APIs)
 * - Validate arguments before IPC call
 * - Handle errors gracefully
 */

import { contextBridge, ipcRenderer } from "electron";
import type { Profile, CreateProfileInput } from "./features/profile-management/types.js";

// Define the safe API surface
const mainApi = {
  /**
   * List all profiles
   */
  listProfiles: async (): Promise<Profile[]> => {
    try {
      return await ipcRenderer.invoke("profile:list");
    } catch (err) {
      console.error("Failed to list profiles:", err);
      return [];
    }
  },

  /**
   * Get the current profile
   */
  getCurrentProfile: async (): Promise<Profile | null> => {
    try {
      return await ipcRenderer.invoke("profile:get-current");
    } catch (err) {
      console.error("Failed to get current profile:", err);
      return null;
    }
  },

  /**
   * Create a new profile
   */
  createProfile: async (input: CreateProfileInput): Promise<{
    success: boolean;
    data?: Profile;
    error?: string;
  }> => {
    try {
      return await ipcRenderer.invoke("profile:create", input);
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },

  /**
   * Switch to a different profile
   */
  switchProfile: async (profileId: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      return await ipcRenderer.invoke("profile:switch", profileId);
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },

  /**
   * Delete a profile (requires confirmation)
   */
  deleteProfile: async (
    profileId: string,
    confirmationName: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      return await ipcRenderer.invoke(
        "profile:delete",
        profileId,
        confirmationName
      );
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },

  /**
   * Update profile metadata
   */
  updateProfile: async (
    profileId: string,
    updates: Partial<Profile>
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      return await ipcRenderer.invoke("profile:update", profileId, updates);
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
};

// Expose the API to the window object
contextBridge.exposeInMainWorld("__mainApi", mainApi);

// Update the global window type
declare global {
  interface Window {
    __mainApi: typeof mainApi;
  }
}
