"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Provider } from "@/lib/types";
import { logoUrl } from "@/lib/images";

type Props = {
  initialSelected: Provider[];
  onSave: (selected: Provider[]) => void;
  saveLabel?: string;
};

export default function PlatformPicker({ initialSelected, onSave, saveLabel = "Guardar" }: Props) {
  const [available, setAvailable] = useState<Provider[] | null>(null);
  const [error, setError] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(initialSelected.map((p) => p.id))
  );

  useEffect(() => {
    fetch("/api/providers")
      .then((res) => {
        if (!res.ok) throw new Error("bad response");
        return res.json();
      })
      .then((data) => setAvailable(data.providers))
      .catch(() => setError(true));
  }, []);

  const toggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (error) {
    return (
      <p className="text-sm text-red-400">
        No pudimos cargar la lista de plataformas. Revisá tu conexión o intentá de nuevo más tarde.
      </p>
    );
  }

  if (!available) {
    return <p className="text-sm text-neutral-400">Cargando plataformas…</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {available.map((provider) => {
          const selected = selectedIds.has(provider.id);
          const logo = logoUrl(provider.logoPath);
          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => toggle(provider.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition ${
                selected ? "border-emerald-400 bg-emerald-400/10" : "border-neutral-800 bg-neutral-900"
              }`}
            >
              <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-white/90">
                {logo && <Image src={logo} alt={provider.name} fill sizes="48px" className="object-cover" />}
              </div>
              <span className="text-center text-xs text-neutral-200">{provider.name}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onSave(available.filter((p) => selectedIds.has(p.id)))}
        disabled={selectedIds.size === 0}
        className="mt-6 w-full rounded-lg bg-emerald-500 py-3 font-medium text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saveLabel}
      </button>
      {selectedIds.size === 0 && (
        <p className="mt-2 text-center text-xs text-neutral-500">Elegí al menos una plataforma para continuar.</p>
      )}
    </div>
  );
}
