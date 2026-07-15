"use client";

import { useState } from "react";
import Header from "@/components/Header";
import ResultsGrid from "@/components/ResultsGrid";
import EmptyState from "@/components/EmptyState";
import PlatformsModal from "@/components/PlatformsModal";
import { usePlatforms, useWatchlist } from "@/lib/storage";

export default function WatchlistPage() {
  const { platforms, setPlatforms, loaded: platformsLoaded } = usePlatforms();
  const { watchlist, isInWatchlist, toggle, loaded: watchlistLoaded } = useWatchlist();
  const [editingPlatforms, setEditingPlatforms] = useState(false);

  if (!platformsLoaded || !watchlistLoaded) return null;

  return (
    <>
      <Header onEditPlatforms={() => setEditingPlatforms(true)} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <h1 className="mb-4 text-xl font-semibold">Mi lista</h1>

        {watchlist.length === 0 ? (
          <EmptyState
            title="Todavía no agregaste nada"
            description='Buscá algo y tocá el "+" en el poster para guardarlo acá.'
          />
        ) : (
          <ResultsGrid
            titles={watchlist}
            userProviders={platforms ?? []}
            isInWatchlist={isInWatchlist}
            onToggleWatchlist={toggle}
          />
        )}
      </main>

      {editingPlatforms && (
        <PlatformsModal
          currentSelection={platforms ?? []}
          onSave={(selected) => {
            setPlatforms(selected);
            setEditingPlatforms(false);
          }}
          onClose={() => setEditingPlatforms(false)}
        />
      )}
    </>
  );
}
