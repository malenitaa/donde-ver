"use client";

import PlatformPicker from "./PlatformPicker";
import type { Provider } from "@/lib/types";

type Props = {
  country: string;
  currentSelection: Provider[];
  onSave: (selected: Provider[]) => void;
  onClose?: () => void;
  dismissible?: boolean;
};

export default function PlatformsModal({ country, currentSelection, onSave, onClose, dismissible = true }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-neutral-950/90 px-4 py-10 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-neutral-900 p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-50">Tus plataformas</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Marcá las que tenés. Filtramos todo lo que ves para que solo aparezca contenido disponible ahí.
            </p>
          </div>
          {dismissible && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded-full p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
            >
              ✕
            </button>
          )}
        </div>
        <PlatformPicker country={country} initialSelected={currentSelection} onSave={onSave} />
      </div>
    </div>
  );
}
