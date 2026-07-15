"use client";

import Link from "next/link";

type Props = {
  onEditPlatforms: () => void;
  onEditCountry: () => void;
};

export default function Header({ onEditPlatforms, onEditCountry }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-900 bg-neutral-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-neutral-50">
          Dónde ver
        </Link>
        <nav className="flex items-center gap-4 text-sm text-neutral-300">
          <Link href="/watchlist" className="hover:text-neutral-50">
            Mi lista
          </Link>
          <button
            type="button"
            onClick={onEditCountry}
            className="flex items-center gap-1 rounded-full border border-neutral-800 px-3 py-1.5 hover:border-neutral-600 hover:text-neutral-50"
            aria-label="Editar país"
          >
            <span aria-hidden>🌎</span> País
          </button>
          <button
            type="button"
            onClick={onEditPlatforms}
            className="flex items-center gap-1 rounded-full border border-neutral-800 px-3 py-1.5 hover:border-neutral-600 hover:text-neutral-50"
            aria-label="Editar mis plataformas"
          >
            <span aria-hidden>⚙️</span> Mis apps
          </button>
        </nav>
      </div>
    </header>
  );
}
