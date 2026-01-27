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
  AvatarEmojiSchema,
} from "../types";
import {
  generateProfileId,
  getProfilesRoot,
  getProgressDbPath,
  openExistingProgressDb,
  withProgressDb,
} from "./progress-db";

type ProfileRow = {
  id: string | null;
  name: string;
  avatar_url: string | null;
  created_at: string | null;
  last_used_at: string | null;
  current_track_id: string | null;
};

function mapProfileRow(row: ProfileRow, fallbackId: string): Profile {
  const id = row.id ?? fallbackId;
  const avatar = AvatarEmojiSchema.safeParse(row.avatar_url ?? "🚀");

  return {
    id,
    name: row.name,
    avatar: avatar.success ? avatar.data : "🚀",
    created_at: row.created_at ?? new Date().toISOString(),
    last_opened_at: row.last_used_at ?? null,
    track: row.current_track_id ?? null,
  };
}

function readProfileRow(db: any, profileId: string): ProfileRow | null {
  const rowById = db
    .prepare(
      `
      SELECT id, name, avatar_url, created_at, last_used_at, current_track_id
      FROM profile
      WHERE id = ?
    `
    )
    .get(profileId) as ProfileRow | undefined;

  if (rowById) return rowById;

  const rowAny = db
    .prepare(
      `
      SELECT id, name, avatar_url, created_at, last_used_at, current_track_id
      FROM profile
      LIMIT 1
    `
    )
    .get() as ProfileRow | undefined;

  return rowAny ?? null;
}

/**
 * Create a new profile
 *
 * @param input - Name and avatar
 * @returns Success with new Profile or error
 *
 * Side effects:
 * - Creates {userData}/profiles/{profileId}/ directory
 * - Initializes progress.db schema
 * - Inserts profile row into progress.db
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

  const existingProfiles = listProfiles();
  if (existingProfiles.some((profile) => profile.name === input.name)) {
    return {
      success: false,
      error: `Profile name "${input.name}" already exists`,
    };
  }

  const profileId = generateProfileId();
  const profileDir = path.join(app.getPath("userData"), "profiles", profileId);

  try {
    const profile = withProgressDb(profileId, (db) => {
      const now = new Date().toISOString();

      db.prepare(
        `
        INSERT INTO profile (
          id,
          name,
          avatar_url,
          created_at,
          last_used_at,
          current_track_id,
          onboarding_complete
        ) VALUES (?, ?, ?, ?, ?, NULL, FALSE)
      `
      ).run(profileId, input.name, input.avatar, now, now);

      return {
        id: profileId,
        name: input.name,
        avatar: input.avatar,
        created_at: now,
        last_opened_at: now,
        track: null,
      } as Profile;
    });

    return {
      success: true,
      data: profile,
    };
  } catch (err) {
    try {
      if (fs.existsSync(profileDir)) {
        fs.rmSync(profileDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }

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
  const profilesRoot = getProfilesRoot();
  if (!fs.existsSync(profilesRoot)) return [];

  const entries = fs.readdirSync(profilesRoot, { withFileTypes: true });
  const profiles: ProfileListItem[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const profileId = entry.name;
    const dbPath = getProgressDbPath(profileId);

    const db = openExistingProgressDb(dbPath);
    if (!db) continue;

    try {
      const row = readProfileRow(db, profileId);
      if (!row) continue;
      profiles.push(mapProfileRow(row, profileId));
    } catch (err) {
      console.error(`Failed to read profile ${profileId}:`, err);
    } finally {
      try {
        db.close();
      } catch {
        // ignore close errors
      }
    }
  }

  profiles.sort((a, b) => {
    const aKey = a.last_opened_at ?? a.created_at;
    const bKey = b.last_opened_at ?? b.created_at;
    return bKey.localeCompare(aKey);
  });

  return profiles;
}

/**
 * Get a specific profile by ID
 */
export function getProfile(profileId: string): Profile | null {
  const dbPath = getProgressDbPath(profileId);
  const db = openExistingProgressDb(dbPath);
  if (!db) return null;

  try {
    const row = readProfileRow(db, profileId);
    if (!row) return null;
    return mapProfileRow(row, profileId);
  } catch (err) {
    console.error("Failed to get profile:", err);
    return null;
  } finally {
    try {
      db.close();
    } catch {
      // ignore close errors
    }
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
    return withProgressDb(profileId, (db) => {
      const profileRow = readProfileRow(db, profileId);

      if (!profileRow) {
        return {
          success: false,
          error: `Profile not found: ${profileId}`,
        };
      }

      const setClause: string[] = [];
      const values: unknown[] = [];

      if (updates.track !== undefined) {
        setClause.push("current_track_id = ?");
        values.push(updates.track);
      }

      if (updates.last_opened_at !== undefined) {
        setClause.push("last_used_at = ?");
        values.push(updates.last_opened_at);
      }

      if (updates.avatar !== undefined) {
        const avatarValidation = AvatarEmojiSchema.safeParse(updates.avatar);
        if (!avatarValidation.success) {
          return {
            success: false,
            error: `Invalid avatar: ${avatarValidation.error.message}`,
          };
        }
        setClause.push("avatar_url = ?");
        values.push(updates.avatar);
      }

      if (updates.name !== undefined) {
        const nameValidation = ProfileNameSchema.safeParse(updates.name);
        if (!nameValidation.success) {
          return {
            success: false,
            error: `Invalid profile name: ${nameValidation.error.message}`,
          };
        }

        const existing = listProfiles().find(
          (profile) => profile.name === updates.name && profile.id !== profileId
        );
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
        return { success: true, data: mapProfileRow(profileRow, profileId) };
      }

      values.push(profileId);

      db.prepare(`UPDATE profile SET ${setClause.join(", ")} WHERE id = ?`).run(
        ...values
      );

      const updatedRow = readProfileRow(db, profileId);
      if (!updatedRow) {
        return {
          success: false,
          error: "Failed to read updated profile",
        };
      }

      return {
        success: true,
        data: mapProfileRow(updatedRow, profileId),
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
 * - Deletes {userData}/profiles/{profileId}/ directory recursively
 * - Does NOT update the "current profile" setting (caller's responsibility)
 */
export function deleteProfile(
  profileId: string,
  confirmationName: string
): ProfileOperationResult {
  const profile = getProfile(profileId);
  if (!profile) {
    return {
      success: false,
      error: `Profile not found: ${profileId}`,
    };
  }

  if (confirmationName !== profile.name) {
    return {
      success: false,
      error: "Profile name mismatch. Deletion cancelled.",
    };
  }

  const profileDir = path.join(app.getPath("userData"), "profiles", profileId);

  try {
    if (fs.existsSync(profileDir)) {
      fs.rmSync(profileDir, { recursive: true, force: true });
    }

    return {
      success: true,
      data: profile,
    };
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
    withProgressDb(profileId, (db) => {
      const now = new Date().toISOString();
      db.prepare("UPDATE profile SET last_used_at = ? WHERE id = ?").run(
        now,
        profileId
      );
    });
  } catch (err) {
    console.error("Failed to update last_opened_at:", err);
  }
}

/**
 * Check if any progress.db exists (used during app initialization)
 */
export function profilesDbExists(): boolean {
  const profilesRoot = getProfilesRoot();
  if (!fs.existsSync(profilesRoot)) return false;

  const entries = fs.readdirSync(profilesRoot, { withFileTypes: true });
  return entries.some((entry) => {
    if (!entry.isDirectory()) return false;
    return fs.existsSync(getProgressDbPath(entry.name));
  });
}

/**
 * Get the count of profiles (used to detect first launch)
 */
export function getProfileCount(): number {
  return listProfiles().length;
}
