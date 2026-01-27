/**
 * Global Type Definitions for Electron IPC Bridge
 *
 * Declares window.__mainApi interface so TypeScript recognizes IPC methods
 * in the renderer process.
 */

import type { CreateProfileInput, Profile, ProfileListItem } from "../features/profile-management/types";

declare global {
  interface Window {
    /**
     * Electron IPC bridge exposing main process handlers
     * Available only in renderer context with contextIsolation enabled
     */
    __mainApi?: {
      profiles: {
        /**
         * List all available profiles
         */
        list(): Promise<ProfileListItem[]>;

        /**
         * Get the current active profile
         */
        getCurrent(): Promise<Profile | null>;

        /**
         * Create a new profile
         */
        create(input: CreateProfileInput): Promise<{
          success: boolean;
          data?: Profile;
          error?: string;
        }>;

        /**
         * Switch to a different profile
         */
        switch(profileId: string): Promise<{
          success: boolean;
          error?: string;
        }>;

        /**
         * Delete a profile with confirmation
         */
        delete(
          profileId: string,
          confirmationName: string
        ): Promise<{
          success: boolean;
          error?: string;
        }>;

        /**
         * Update profile metadata
         */
        update(
          profileId: string,
          updates: Partial<Profile>
        ): Promise<{
          success: boolean;
          data?: Profile;
          error?: string;
        }>;
      };
    };
  }
}

export {};
