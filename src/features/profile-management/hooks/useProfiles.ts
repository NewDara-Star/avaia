/**
 * useProfiles Hook
 *
 * React hook for profile management operations.
 * Handles state, mutations, and IPC communication with main process.
 */

import { useState, useCallback, useEffect } from "react";
import {
  Profile,
  CreateProfileInput,
  ProfileListItem,
} from "../types.js";

/**
 * Hook for managing profile state and operations
 */
export function useProfiles() {
  const [profiles, setProfiles] = useState<ProfileListItem[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: This will use IPC to call profile service in main process
      // For now, placeholder
      const result = await window.__mainApi?.listProfiles?.();
      setProfiles(result || []);

      const current = await window.__mainApi?.getCurrentProfile?.();
      setCurrentProfileId(current?.id || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProfile = useCallback(
    async (input: CreateProfileInput) => {
      try {
        setError(null);
        const result = await window.__mainApi?.createProfile?.(input);
        if (result?.success) {
          await loadProfiles();
          return { success: true, data: result.data };
        }
        setError(result?.error || "Unknown error");
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        return { success: false, error: message };
      }
    },
    [loadProfiles]
  );

  const switchProfile = useCallback(
    async (profileId: string) => {
      try {
        setError(null);
        const result = await window.__mainApi?.switchProfile?.(profileId);
        if (result?.success) {
          await loadProfiles();
          return { success: true };
        }
        setError(result?.error || "Unknown error");
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        return { success: false, error: message };
      }
    },
    [loadProfiles]
  );

  const deleteProfile = useCallback(
    async (profileId: string, confirmationName: string) => {
      try {
        setError(null);
        const result = await window.__mainApi?.deleteProfile?.(
          profileId,
          confirmationName
        );
        if (result?.success) {
          await loadProfiles();
          return { success: true };
        }
        setError(result?.error || "Unknown error");
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        return { success: false, error: message };
      }
    },
    [loadProfiles]
  );

  return {
    profiles,
    currentProfileId,
    isLoading,
    error,
    createProfile,
    switchProfile,
    deleteProfile,
    loadProfiles,
  };
}

// Type declaration for window.__mainApi
declare global {
  interface Window {
    __mainApi?: {
      listProfiles?: () => Promise<ProfileListItem[]>;
      getCurrentProfile?: () => Promise<Profile | null>;
      createProfile?: (input: CreateProfileInput) => Promise<{
        success: boolean;
        data?: Profile;
        error?: string;
      }>;
      switchProfile?: (profileId: string) => Promise<{
        success: boolean;
        error?: string;
      }>;
      deleteProfile?: (
        profileId: string,
        confirmationName: string
      ) => Promise<{
        success: boolean;
        error?: string;
      }>;
    };
  }
}
