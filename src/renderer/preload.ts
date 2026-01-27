/**
 * Preload Script for Renderer Context
 *
 * Bridges the main process IPC handlers with the renderer process.
 * Uses contextBridge to safely expose IPC methods to window.__mainApi.
 */

import { contextBridge, ipcRenderer } from "electron";
import type { CreateProfileInput, Profile, ProfileListItem } from "../features/profile-management/types";

/**
 * Expose IPC methods to renderer via window.__mainApi
 * All methods return Promises for async operations
 */
contextBridge.exposeInMainWorld("__mainApi", {
  profiles: {
    /**
     * List all available profiles
     * @returns Array of profile metadata (id, name, avatar, created_at, last_opened_at)
     */
    list: () => ipcRenderer.invoke("profile:list") as Promise<ProfileListItem[]>,

    /**
     * Get the current active profile
     * @returns Profile object or null if no profile selected
     */
    getCurrent: () => ipcRenderer.invoke("profile:get-current") as Promise<Profile | null>,

    /**
     * Create a new profile
     * @param input Profile creation input (name, avatar)
     * @returns Success response with created profile data
     */
    create: (input: CreateProfileInput) =>
      ipcRenderer.invoke("profile:create", input) as Promise<{
        success: boolean;
        data?: Profile;
        error?: string;
      }>,

    /**
     * Switch to a different profile
     * @param profileId The profile ID to switch to
     * @returns Success response
     */
    switch: (profileId: string) =>
      ipcRenderer.invoke("profile:switch", profileId) as Promise<{
        success: boolean;
        error?: string;
      }>,

    /**
     * Delete a profile (requires confirmation by re-typing profile name)
     * @param profileId The profile ID to delete
     * @param confirmationName The profile name (must match for confirmation)
     * @returns Success response
     */
    delete: (profileId: string, confirmationName: string) =>
      ipcRenderer.invoke("profile:delete", profileId, confirmationName) as Promise<{
        success: boolean;
        error?: string;
      }>,

    /**
     * Update profile metadata
     * @param profileId The profile ID to update
     * @param updates Partial profile object (name, avatar, etc.)
     * @returns Success response with updated profile
     */
    update: (profileId: string, updates: Partial<Profile>) =>
      ipcRenderer.invoke("profile:update", profileId, updates) as Promise<{
        success: boolean;
        data?: Profile;
        error?: string;
      }>,
  },
});
