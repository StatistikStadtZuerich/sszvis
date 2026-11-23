import { Link } from "react-router";
import { catalog, examples } from "virtual:examples";
import { typefaceCodeLabel } from "~/components/tokens/typeface";

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
  // The examples plugin fails the build when a page names an unknown id.
  if (example === undefined) throw new Error(`Unknown example: ${id}`);

  return (
    <li className="min-w-0">
      <Link
        to={page}
        title={example.title}
        className="group flex flex-col gap-1.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <div className="thumbnail aspect-square overflow-hidden rounded-lg border border-border bg-white transition-colors group-hover:border-foreground/30">
          <iframe
            src={example.url}
            title={example.title}
            loading="lazy"
            tabIndex={-1}
            className="pointer-events-none block border-0"
          />
        </div>
        <span
          className={typefaceCodeLabel(
            "truncate text-muted-foreground group-hover:text-foreground",
          )}
        >
          {example.title}
        </span>
      </Link>
    </li>
  );
};
