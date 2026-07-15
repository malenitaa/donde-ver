"use client";

import Image from "next/image";
import type { Provider, Title } from "@/lib/types";
import { posterUrl } from "@/lib/images";

type Props = {
  title: Title;
  userProviders: Provider[];
  inWatchlist: boolean;
  onToggleWatchlist: (title: Title) => void;
};

function formatRuntime(minutes: number | null): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TitleCard({ title, userProviders, inWatchlist, onToggleWatchlist }: Props) {
  const poster = posterUrl(title.posterPath);
  const userProviderIds = new Set(userProviders.map((p) => p.id));
  const matchingOffers = title.offers.filter(
    (o) => userProviderIds.has(o.providerId) || o.providerId === 0
  );
  const availableInUserApps = matchingOffers.length > 0;
  const offersToShow = availableInUserApps ? matchingOffers : title.offers;
  const uniqueProviders = [...new Map(offersToShow.map((o) => [o.providerName, o])).values()];

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl bg-neutral-900">
      <div className="relative aspect-[2/3] w-full bg-neutral-800">
        {poster ? (
          <Image
            src={poster}
            alt={title.title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-neutral-500">
            {title.title}
          </div>
        )}
        <button
          type="button"
          onClick={() => onToggleWatchlist(title)}
          aria-label={inWatchlist ? "Quitar de mi lista" : "Agregar a mi lista"}
          className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-lg backdrop-blur ${
            inWatchlist ? "bg-emerald-500 text-neutral-950" : "bg-neutral-950/70 text-neutral-100"
          }`}
        >
          {inWatchlist ? "✓" : "+"}
        </button>
        {title.leavingAt && (
          <span className="absolute left-2 top-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-neutral-950">
            Se va {new Date(title.leavingAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <h3 className="line-clamp-2 text-sm font-medium text-neutral-50">{title.title}</h3>
        <p className="text-xs text-neutral-400">
          {[title.year, title.mediaType === "tv" ? "Serie" : "Película", formatRuntime(title.runtime)]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {!availableInUserApps && (
          <p className="mt-1 text-[11px] text-amber-400">No está en tus apps. Disponible en:</p>
        )}

        {uniqueProviders.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {uniqueProviders.slice(0, 4).map((o) => (
              <span
                key={o.providerName}
                className={`rounded px-1.5 py-0.5 text-[10px] ${
                  availableInUserApps ? "bg-emerald-500/15 text-emerald-300" : "bg-neutral-800 text-neutral-300"
                }`}
              >
                {o.providerName}
              </span>
            ))}
          </div>
        )}
        {offersToShow.length === 0 && (
          <p className="mt-1 text-[11px] text-neutral-500">Sin oferta de streaming en Argentina.</p>
        )}
      </div>
    </div>
  );
}
