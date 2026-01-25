/**
 * Electron Main Process Entry Point
 *
 * Responsible for:
 * - Creating the app window
 * - Loading the renderer (Vite dev or built assets)
 * - Managing the app lifecycle
 * - Setting up IPC handlers
 * - Initializing the profile system
 */

import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { registerProfileIpcHandlers, initializeProfileSystem } from "../features/profile-management/services/profile-ipc.js";
import { importLegacyDataIfNeeded } from "../features/profile-management/services/legacy-import.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

/**
 * Create the main application window
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "../preload.ts"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    // Dev mode: load from Vite dev server
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load from built assets
    mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/**
 * App event: ready
 */
app.on("ready", async () => {
  // Initialize profile system
  try {
    console.log("[Main] Initializing profile system...");
    await importLegacyDataIfNeeded();
    await initializeProfileSystem();
    console.log("[Main] Profile system initialized ✓");
  } catch (err) {
    console.error("[Main] Failed to initialize profile system:", err);
  }

  // Register IPC handlers
  registerProfileIpcHandlers();
  console.log("[Main] IPC handlers registered ✓");

  // Create window
  createWindow();
});

/**
 * App event: window-all-closed
 * On macOS, apps stay active until user quits explicitly
 */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/**
 * App event: activate
 * On macOS, re-create window when dock icon is clicked
 */
app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle any unhandled exceptions
process.on("uncaughtException", (err) => {
  console.error("[Main] Uncaught exception:", err);
});
