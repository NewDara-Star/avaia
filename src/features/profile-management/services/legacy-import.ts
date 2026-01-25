/**
 * Legacy Data Import (v2+) — GOLD (patched)
 *
 * Fix applied:
 * - Always cleans up {userData}/profiles/*.importing leftovers BEFORE deciding to skip import.
 *   This prevents "ghost profile" dirs and broken listing/opening behaviour after crashes.
 *
 * Goal:
 * - Import legacy ~/.avaia data into Electron userData layout:
 *   {userData}/profiles/{profile_id}/progress.db
 *   {userData}/.api_key  (global, safeStorage-encrypted)
 *
 * Guarantees:
 * - Idempotent: skips entire import if {userData}/profiles/ already has ANY profiles (ADR-013)
 * - Crash-safe (copy to temp, then atomic rename)
 * - Cleans up *.importing leftovers
 * - Migrates legacy per-profile .api_key into global location
 * - Ensures API key is safeStorage-encrypted (handles plaintext legacy keys)
 *
 * Notes:
 * - Electron MAIN process only.
 * - Requires better-sqlite3.
 * - Requires electron safeStorage for API key encryption.
 */

import path from "path";
import os from "os";
import fs from "fs";
import { app, safeStorage } from "electron";
import Database from "better-sqlite3";

type ImportResult = {
  importedProfiles: number;
  skippedReason: string | null;
  migratedApiKey: boolean;
  apiKeyWasPlaintext: boolean;
  notes: string[];
};

function exists(p: string): boolean {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function ensureDir(p: string): void {
  fs.mkdirSync(p, { recursive: true });
}

function safeCopyDir(src: string, dest: string): void {
  fs.cpSync(src, dest, { recursive: true, force: true });
}

function rmQuiet(p: string): void {
  try {
    fs.rmSync(p, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

function listDirs(p: string): string[] {
  if (!exists(p)) return [];
  return fs
    .readdirSync(p, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(p, d.name));
}

function readProfileIdFromProgressDb(progressDbPath: string): string | null {
  let db: Database | null = null;
  try {
    db = new Database(progressDbPath, { readonly: true });
    const row = db.prepare("SELECT id FROM profile LIMIT 1").get() as
      | { id: string }
      | undefined;
    return row?.id && typeof row.id === "string" ? row.id : null;
  } catch {
    return null;
  } finally {
    try {
      db?.close();
    } catch {
      // Ignore close errors
    }
  }
}

function guessLegacyRoots(): string[] {
  const roots: string[] = [];

  roots.push(path.join(os.homedir(), ".avaia"));

  try {
    const currentUserData = app.getPath("userData");
    const parent = path.dirname(currentUserData);
    roots.push(path.join(parent, "Avaia"));
    roots.push(path.join(parent, "avaia"));
  } catch {
    // ignore
  }

  return Array.from(new Set(roots));
}

function findLegacyProfiles(legacyRoot: string): string[] {
  const profilesDir = path.join(legacyRoot, "profiles");
  return listDirs(profilesDir);
}

function isCanonicalProfileId(name: string): boolean {
  return /^profile_[a-f0-9]{32}$/i.test(name);
}

function atomicMoveTempToDest(tmpDir: string, dest: string): boolean {
  if (exists(dest)) {
    rmQuiet(tmpDir);
    return false;
  }
  try {
    fs.renameSync(tmpDir, dest);
    return true;
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err?.code === "EXDEV") {
      safeCopyDir(tmpDir, dest);
      rmQuiet(tmpDir);
      return true;
    }
    rmQuiet(tmpDir);
    throw e;
  }
}

function looksLikePlaintextApiKeyString(s: string): boolean {
  const trimmed = s.trim();
  return trimmed.startsWith("sk-ant-") || trimmed.startsWith("sk-");
}

function isSafeStorageAvailable(): boolean {
  try {
    return safeStorage.isEncryptionAvailable();
  } catch {
    return false;
  }
}

function tryDecryptIfEncrypted(buf: Buffer): string | null {
  if (!isSafeStorageAvailable()) return null;
  try {
    return safeStorage.decryptString(buf);
  } catch {
    return null;
  }
}

/**
 * NEW: Clean up any stale {userData}/profiles/*.importing dirs
 * even if we end up skipping import due to existing profiles.
 */
function cleanupImportingLeftovers(profilesRoot: string, notes: string[]): void {
  if (!exists(profilesRoot)) return;

  let dirents: fs.Dirent[];
  try {
    dirents = fs.readdirSync(profilesRoot, { withFileTypes: true });
  } catch {
    return;
  }

  for (const d of dirents) {
    const name = d.name;
    if (!name.endsWith(".importing")) continue;

    const fullPath = path.join(profilesRoot, name);
    rmQuiet(fullPath);
    notes.push(`Cleaned stale importing dir: ${fullPath}`);
  }
}

function migrateGlobalApiKey(
  userData: string,
  legacyProfileDirs: string[],
  notes: string[]
): { migrated: boolean; wasPlaintext: boolean } {
  const globalKeyPath = path.join(userData, ".api_key");

  if (exists(globalKeyPath)) {
    return { migrated: false, wasPlaintext: false };
  }

  const candidates: { file: string; mtimeMs: number }[] = [];
  for (const pdir of legacyProfileDirs) {
    const keyPath = path.join(pdir, ".api_key");
    if (exists(keyPath)) {
      try {
        const stat = fs.statSync(keyPath);
        candidates.push({ file: keyPath, mtimeMs: stat.mtimeMs });
      } catch {
        // ignore
      }
    }
  }

  if (candidates.length === 0) {
    return { migrated: false, wasPlaintext: false };
  }

  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const chosen = candidates[0].file;

  let keyData: Buffer;
  try {
    keyData = fs.readFileSync(chosen);
  } catch {
    notes.push(`Failed to read legacy API key: ${chosen}`);
    return { migrated: false, wasPlaintext: false };
  }

  let wasPlaintext = false;
  let dataToWrite: Buffer;

  const decrypted = tryDecryptIfEncrypted(keyData);
  if (decrypted !== null) {
    dataToWrite = keyData;
    notes.push(`Copied encrypted API key from: ${chosen}`);
  } else {
    const maybeString = keyData.toString("utf8");
    if (looksLikePlaintextApiKeyString(maybeString)) {
      wasPlaintext = true;

      if (!isSafeStorageAvailable()) {
        notes.push(
          `Cannot migrate plaintext API key: safeStorage not available. User must re-enter key.`
        );
        return { migrated: false, wasPlaintext: true };
      }

      try {
        const plaintext = maybeString.trim();
        dataToWrite = safeStorage.encryptString(plaintext);
        notes.push(`Encrypted plaintext API key from: ${chosen}`);
      } catch (err) {
        notes.push(`Failed to encrypt API key: ${String(err)}`);
        return { migrated: false, wasPlaintext: true };
      }
    } else {
      dataToWrite = keyData;
      notes.push(
        `Copied API key from ${chosen}, but it was not decryptable and didn't look like plaintext. May be unreadable.`
      );
    }
  }

  ensureDir(userData);
  try {
    fs.writeFileSync(globalKeyPath, dataToWrite);
  } catch (err) {
    notes.push(`Failed to write global API key: ${String(err)}`);
    return { migrated: false, wasPlaintext };
  }

  try {
    fs.renameSync(chosen, chosen + ".migrated");
  } catch {
    // non-fatal
  }

  return { migrated: true, wasPlaintext };
}

export function importLegacyDataIfNeeded(): ImportResult {
  const notes: string[] = [];

  const userData = app.getPath("userData");
  const newProfilesRoot = path.join(userData, "profiles");
  ensureDir(newProfilesRoot);

  // ALWAYS cleanup stale *.importing first (even if we skip import)
  cleanupImportingLeftovers(newProfilesRoot, notes);

  const legacyRoots = guessLegacyRoots();
  const legacyProfileDirs = legacyRoots.flatMap(findLegacyProfiles).sort();

  // ADR-013: If {userData}/profiles/ already contains profiles, skip import.
  // Only count canonical profile folders (profile_[a-f0-9]{32}), not junk.
  const existingProfiles = listDirs(newProfilesRoot).filter((d) =>
    isCanonicalProfileId(path.basename(d))
  );

  if (existingProfiles.length > 0) {
    notes.push(
      `Skipped profile import (ADR-013): ${existingProfiles.length} profile(s) already exist in ${newProfilesRoot}. ` +
      `Legacy profiles (if any) will NOT be imported automatically.`
    );

    const apiKeyResult = migrateGlobalApiKey(userData, legacyProfileDirs, notes);

    return {
      importedProfiles: 0,
      skippedReason: "profiles_already_exist",
      migratedApiKey: apiKeyResult.migrated,
      apiKeyWasPlaintext: apiKeyResult.wasPlaintext,
      notes,
    };
  }

  if (legacyProfileDirs.length === 0) {
    notes.push("No legacy profiles found.");
    return {
      importedProfiles: 0,
      skippedReason: "no_legacy_data",
      migratedApiKey: false,
      apiKeyWasPlaintext: false,
      notes,
    };
  }

  let importedProfiles = 0;

  for (const legacyProfilePath of legacyProfileDirs) {
    const folderName = path.basename(legacyProfilePath);
    const legacyProgress = path.join(legacyProfilePath, "progress.db");

    if (!exists(legacyProgress)) {
      notes.push(`Skipped (no progress.db): ${legacyProfilePath}`);
      continue;
    }

    const profileIdFromDb = readProfileIdFromProgressDb(legacyProgress);
    const profileId =
      profileIdFromDb ?? (isCanonicalProfileId(folderName) ? folderName : null);

    if (!profileId) {
      notes.push(`Skipped (cannot determine profile_id): ${legacyProfilePath}`);
      continue;
    }

    const targetProfileDir = path.join(newProfilesRoot, profileId);

    const tmpDir = targetProfileDir + ".importing";
    rmQuiet(tmpDir);

    if (exists(targetProfileDir)) {
      notes.push(`Already exists, skipped: ${profileId}`);
      continue;
    }

    ensureDir(tmpDir);
    safeCopyDir(legacyProfilePath, tmpDir);

    if (atomicMoveTempToDest(tmpDir, targetProfileDir)) {
      importedProfiles++;
      notes.push(`Imported: ${profileId}`);
    } else {
      notes.push(`Failed to move (destination appeared): ${profileId}`);
    }
  }

  const apiKeyResult = migrateGlobalApiKey(userData, legacyProfileDirs, notes);

  return {
    importedProfiles,
    skippedReason: null,
    migratedApiKey: apiKeyResult.migrated,
    apiKeyWasPlaintext: apiKeyResult.wasPlaintext,
    notes,
  };
}