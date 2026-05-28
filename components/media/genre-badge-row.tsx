import { Badge } from '@/components/ui/badge';
import type { Genre } from '@/src/types/media';

interface GenreBadgeRowProps {
  genres: Genre[];
  max?: number;
}

export function GenreBadgeRow({ genres, max = 4 }: GenreBadgeRowProps) {
  const shown = genres.slice(0, max);
  return (
    <ul className="flex flex-wrap items-center gap-2">
      {shown.map((g) => (
        <li key={g.id}>
          <Badge variant="secondary" className="font-normal px-3 py-1 hover:bg-muted">
            {g.name}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
