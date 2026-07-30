import { useParams } from 'react-router-dom';
import { useQuery } from 'urql';
import { LibraryMangasQuery } from '../operations';
import { MangaCard } from './MangaCard';
import { PageHeader, CoverGridSkeleton, EmptyState, ErrorState } from './ui';

const GRID = 'grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8';

export function GenreView() {
  const { name } = useParams();
  const genre = decodeURIComponent(name ?? '');

  const [{ data, fetching, error }] = useQuery({
    query: LibraryMangasQuery,
    variables: { first: 500 },
  });

  const matches = (data?.mangas.nodes ?? []).filter((m) => m.genre.includes(genre));

  return (
    <div className="min-h-dvh">
      <PageHeader title={genre} subtitle={data ? `${matches.length} in library` : undefined} backTo="/" />

      <main className="px-4 py-4 sm:px-6 sm:py-6">
        {error && <ErrorState message={`Failed to load: ${error.message}`} />}
        {!data && fetching && <CoverGridSkeleton />}

        {data && matches.length === 0 && (
          <EmptyState title={`No ${genre} titles`} hint="Nothing in your library matches this genre yet." />
        )}

        {matches.length > 0 && (
          <ul className={GRID}>
            {matches.map((manga) => (
              <li key={manga.id}>
                <MangaCard
                  id={manga.id}
                  title={manga.title}
                  thumbnailUrl={manga.thumbnailUrl}
                  unreadCount={manga.unreadCount}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
