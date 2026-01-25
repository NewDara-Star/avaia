/**
 * Profile Management Types
 *
 * Defines the data model for user profiles, including validation schemas
 * and type definitions for profile metadata, creation, and operations.
 */

import { z } from "zod";

/**
 * Profile name constraints: 3-20 characters, alphanumeric + spaces only.
 * No special chars that break file paths (/, \, :, *, ?, etc.)
 */
export const ProfileNameSchema = z
  .string()
  .trim()
  .min(3, "Profile name must be at least 3 characters")
  .max(20, "Profile name must be at most 20 characters")
  .regex(
    /^[a-zA-Z0-9\s]+$/,
    "Profile name can only contain letters, numbers, and spaces"
  );

/**
 * Available avatars for profile personalization
 */
export type AvatarEmoji =
  | "🚀"
  | "👶"
  | "🎓"
  | "⭐"
  | "🔥"
  | "💡"
  | "🎯"
  | "🌟";

export const AvatarEmojiSchema = z.enum([
  "🚀",
  "👶",
  "🎓",
  "⭐",
  "🔥",
  "💡",
  "🎯",
  "🌟",
]);

/**
 * Profile metadata stored in profiles.db
 */
export type Profile = {
  id: string; // profile_[32-char hex] — canonical format
  name: string;
  avatar: AvatarEmoji;
  created_at: string; // ISO 8601
  last_opened_at: string | null; // ISO 8601
  track: string | null; // e.g., "JavaScript/Web Development", null until onboarding
};

/**
 * Zod validation schema for Profile
 */
export const ProfileSchema = z.object({
  id: z.string().regex(/^profile_[a-f0-9]{32}$/i),
  name: ProfileNameSchema,
  avatar: AvatarEmojiSchema,
  created_at: z.string().datetime(),
  last_opened_at: z.string().datetime().nullable(),
  track: z.string().nullable(),
});

/**
 * Input for creating a new profile
 */
export type CreateProfileInput = {
  name: string;
  avatar: AvatarEmoji;
};

export const CreateProfileInputSchema = z.object({
  name: ProfileNameSchema,
  avatar: AvatarEmojiSchema,
});

/**
 * Result of profile operations
 */
export type ProfileOperationResult =
  | {
      success: true;
      data: Profile;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Profile listing with summary stats
 */
export type ProfileListItem = Profile & {
  progress_count?: number; // Number of completed sessions/projects
};
