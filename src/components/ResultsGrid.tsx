import type { Provider, Title } from "@/lib/types";
import TitleCard from "./TitleCard";

type Props = {
  titles: Title[];
  userProviders: Provider[];
  isInWatchlist: (id: number, mediaType: Title["mediaType"]) => boolean;
  onToggleWatchlist: (title: Title) => void;
};

export default function ResultsGrid({ titles, userProviders, isInWatchlist, onToggleWatchlist }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {titles.map((title) => (
        <TitleCard
          key={`${title.mediaType}-${title.id}`}
          title={title}
          userProviders={userProviders}
          inWatchlist={isInWatchlist(title.id, title.mediaType)}
          onToggleWatchlist={onToggleWatchlist}
        />
      ))}
    </div>
  );
}
