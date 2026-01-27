import React, { useMemo, useState } from "react";
import { Layout } from "./components/Layout.js";
import { useProfiles } from "./features/profile-management/hooks/useProfiles.js";
import { CreateProfileModal } from "./features/profile-management/components/CreateProfileModal.js";

export const App: React.FC = () => {
  const { profiles, currentProfileId, isLoading, error } = useProfiles();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const hasProfiles = profiles.length > 0;
  const showWelcome = useMemo(
    () => !isLoading && !hasProfiles,
    [isLoading, hasProfiles]
  );

  return (
    <Layout>
      {isLoading && (
        <div className="text-sm text-slate-500">Loading profiles...</div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showWelcome && (
        <div className="mx-auto flex w-full max-w-xl flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Welcome to Avaia</h1>
            <p className="mt-2 text-sm text-slate-600">
              Create a profile to set up a personalized learning space.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Create Profile
          </button>
        </div>
      )}

      {!showWelcome && !isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {currentProfileId ? "Dashboard" : "Profiles"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {currentProfileId
              ? "Select a learning track to continue."
              : "Choose a profile from the header to begin."}
          </p>
        </div>
      )}

      {showCreateModal && (
        <CreateProfileModal onClose={() => setShowCreateModal(false)} />
      )}
    </Layout>
  );
};
