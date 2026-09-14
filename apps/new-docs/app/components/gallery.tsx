import { Link } from "react-router";
import { catalog, examples } from "virtual:examples";

export const Gallery = () => (
  <div className="breakout my-8">
    <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-5">
      {catalog.map((entry) => (
        <Thumbnail key={entry.id} id={entry.id} page={entry.page} />
      ))}
    </ul>
  </div>
);

const Thumbnail = ({ id, page }: { readonly id: string; readonly page: string }) => {
  const example = examples[id];

  return (
    <li className="min-w-0">
      <Link
        to={page}
        title={example ? example.title : `${id} — not ported yet`}
        className="group flex flex-col gap-1.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {example ? (
          <div className="thumbnail aspect-square overflow-hidden rounded-lg border border-border bg-white transition-colors group-hover:border-foreground/30">
            <iframe
              src={example.url}
              title={example.title}
              loading="lazy"
              tabIndex={-1}
              className="pointer-events-none block border-0"
            />
          </div>
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-lg border border-border border-dashed bg-muted/30 text-center text-muted-foreground text-xs">
            <span className="px-4">Not ported yet</span>
          </div>
        )}
        <span className="truncate font-mono text-muted-foreground text-xs group-hover:text-foreground">
          {example ? example.title : id}
        </span>
      </Link>
    </li>
  );
};
