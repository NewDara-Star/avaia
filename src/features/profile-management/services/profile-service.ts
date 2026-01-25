/**
 * Profile Service
 *
 * High-level operations for profile management:
 * - Create new profile
 * - List all profiles
 * - Get current profile
 * - Update profile metadata (last_opened_at, track)
 * - Delete profile
 * - Switch profile (with app reload)
 *
 * All operations are validated against the Profile schema.
 */

import path from "path";
import fs from "fs";
import { app } from "electron";
import {
  Profile,
  CreateProfileInput,
  ProfileOperationResult,
  ProfileListItem,
  ProfileNameSchema,
} from "../types.js";
import {
  generateProfileId,
  withProfilesDb,
  getProfilesDbPath,
} from "./profiles-db.js";

/**
 * Create a new profile
 *
 * @param input - Name and avatar
 * @returns Success with new Profile or error
 *
 * Side effects:
 * - Creates entry in profiles.db
 * - Creates {userData}/profiles/{profileId}/ directory
 * - Does NOT initialize progress.db (caller's responsibility)
 */
export function createProfile(
  input: CreateProfileInput
): ProfileOperationResult {
  // Validate input
  const nameValidation = ProfileNameSchema.safeParse(input.name);
  if (!nameValidation.success) {
    return {
      success: false,
      error: `Invalid profile name: ${nameValidation.error.message}`,
    };
  }

  const profileId = generateProfileId();
  const userData = app.getPath("userData");
  const profileDir = path.join(userData, "profiles", profileId);

  try {
    return withProfilesDb((db) => {
      // Check if name already exists
      const existing = db
        .prepare("SELECT id FROM profiles WHERE name = ?")
        .get(input.name);

      if (existing) {
        return {
          success: false,
          error: `Profile name "${input.name}" already exists`,
        };
      }

      // Create profile in database
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO profiles (id, name, avatar, created_at, last_opened_at, track)
        VALUES (?, ?, ?, ?, NULL, NULL)
      `).run(profileId, input.name, input.avatar, now);

      // Create profile directory
      try {
        fs.mkdirSync(profileDir, { recursive: true });
      } catch (err) {
        // If dir creation fails, rollback the database insert
        db.prepare("DELETE FROM profiles WHERE id = ?").run(profileId);
        throw err;
      }

      const profile: Profile = {
        id: profileId,
        name: input.name,
        avatar: input.avatar,
        created_at: now,
        last_opened_at: null,
        track: null,
      };

      return {
        success: true,
        data: profile,
      };
    });
  } catch (err) {
    return {
      success: false,
      error: `Failed to create profile: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * List all profiles, sorted by last_opened_at (most recent first)
 */
export function listProfiles(): ProfileListItem[] {
  try {
    return withProfilesDb((db) => {
      const rows = db
        .prepare(
          `
        SELECT id, name, avatar, created_at, last_opened_at, track
        FROM profiles
        ORDER BY last_opened_at DESC, created_at DESC
      `
        )
        .all() as Profile[];

      return rows;
    });
  } catch (err) {
    console.error("Failed to list profiles:", err);
    return [];
  }
}

/**
 * Get a specific profile by ID
 */
export function getProfile(profileId: string): Profile | null {
  try {
    return withProfilesDb((db) => {
      const row = db
        .prepare(
          `
        SELECT id, name, avatar, created_at, last_opened_at, track
        FROM profiles
        WHERE id = ?
      `
        )
        .get(profileId) as Profile | undefined;

      return row ?? null;
    });
  } catch (err) {
    console.error("Failed to get profile:", err);
    return null;
  }
}

/**
 * Update profile metadata
 *
 * @param profileId - Profile ID
 * @param updates - Partial updates (e.g., { track: "JavaScript" })
 */
export function updateProfile(
  profileId: string,
  updates: Partial<Omit<Profile, "id" | "created_at">>
): ProfileOperationResult {
  try {
    return withProfilesDb((db) => {
      const profile = db
        .prepare(
          `
        SELECT id, name, avatar, created_at, last_opened_at, track
        FROM profiles
        WHERE id = ?
      `
        )
        .get(profileId) as Profile | undefined;

      if (!profile) {
        return {
          success: false,
          error: `Profile not found: ${profileId}`,
        };
      }

      // Build update query
      const setClause: string[] = [];
      const values: unknown[] = [];

      if (updates.track !== undefined) {
        setClause.push("track = ?");
        values.push(updates.track);
      }

      if (updates.last_opened_at !== undefined) {
        setClause.push("last_opened_at = ?");
        values.push(updates.last_opened_at);
      }

      if (updates.name !== undefined) {
        const nameValidation = ProfileNameSchema.safeParse(updates.name);
        if (!nameValidation.success) {
          return {
            success: false,
            error: `Invalid profile name: ${nameValidation.error.message}`,
          };
        }
        // Check uniqueness
        const existing = db
          .prepare("SELECT id FROM profiles WHERE name = ? AND id != ?")
          .get(updates.name, profileId);
        if (existing) {
          return {
            success: false,
            error: `Profile name "${updates.name}" already exists`,
          };
        }
        setClause.push("name = ?");
        values.push(updates.name);
      }

      if (setClause.length === 0) {
        return { success: true, data: profile };
      }

      values.push(profileId);

      db.prepare(
        `UPDATE profiles SET ${setClause.join(", ")} WHERE id = ?`
      ).run(...values);

      // Fetch updated profile
      const updated = db
        .prepare(
          `
        SELECT id, name, avatar, created_at, last_opened_at, track
        FROM profiles
        WHERE id = ?
      `
        )
        .get(profileId) as Profile;

      return {
        success: true,
        data: updated,
      };
    });
  } catch (err) {
    return {
      success: false,
      error: `Failed to update profile: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Delete a profile
 *
 * @param profileId - Profile ID to delete
 * @param confirmationName - User must re-type the profile name to confirm
 * @returns Success or error
 *
 * Side effects:
 * - Removes profile from profiles.db
 * - Deletes {userData}/profiles/{profileId}/ directory recursively
 * - Does NOT update the "current profile" setting (caller's responsibility)
 */
export function deleteProfile(
  profileId: string,
  confirmationName: string
): ProfileOperationResult {
  try {
    return withProfilesDb((db) => {
      const profile = db
        .prepare(
          `
        SELECT id, name, avatar, created_at, last_opened_at, track
        FROM profiles
        WHERE id = ?
      `
        )
        .get(profileId) as Profile | undefined;

      if (!profile) {
        return {
          success: false,
          error: `Profile not found: ${profileId}`,
        };
      }

      // Require confirmation (user must re-type profile name)
      if (confirmationName !== profile.name) {
        return {
          success: false,
          error: "Profile name mismatch. Deletion cancelled.",
        };
      }

      // Delete from database first
      db.prepare("DELETE FROM profiles WHERE id = ?").run(profileId);

      // Delete profile directory
      const userData = app.getPath("userData");
      const profileDir = path.join(userData, "profiles", profileId);

      try {
        if (fs.existsSync(profileDir)) {
          fs.rmSync(profileDir, { recursive: true, force: true });
        }
      } catch (err) {
        console.error("Failed to delete profile directory:", err);
        // Non-fatal: database record is already deleted
      }

      return {
        success: true,
        data: profile,
      };
    });
  } catch (err) {
    return {
      success: false,
      error: `Failed to delete profile: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Update last_opened_at timestamp (called when switching to a profile)
 */
export function markProfileOpened(profileId: string): void {
  try {
    withProfilesDb((db) => {
      const now = new Date().toISOString();
      db.prepare("UPDATE profiles SET last_opened_at = ? WHERE id = ?").run(
        now,
        profileId
      );
    });
  } catch (err) {
    console.error("Failed to update last_opened_at:", err);
  }
}

/**
 * Check if profiles.db exists (used during app initialization)
 */
export function profilesDbExists(): boolean {
  const dbPath = getProfilesDbPath();
  return fs.existsSync(dbPath);
}

/**
 * Get the count of profiles (used to detect first launch)
 */
export function getProfileCount(): number {
  try {
    return withProfilesDb((db) => {
      const result = db
        .prepare("SELECT COUNT(*) as count FROM profiles")
        .get() as { count: number };
      return result.count;
    });
  } catch {
    return 0;
  }
}
