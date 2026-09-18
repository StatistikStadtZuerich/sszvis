/**
 * Listener registry
 *
 * @module sszvis/map/renderer/listenerRegistry
 *
 * Tracks which of a component's own event handlers a consumer has registered, so the component
 * can decide whether its elements should be a hit area or inert decoration.
 *
 * d3's dispatch cannot be asked what it holds: dispatch.on("over") reports only the handler
 * registered under the bare name and returns undefined for one registered as "over.tooltip", so
 * a component that wants to know whether *anything* is listening has to tally the typenames as
 * they go by.
 *
 * Shared by src/map/renderer/bubble.ts and src/map/renderer/geojson.ts, which make the same
 * decision about the same kind of element.
 */

/**
 * A d3 typename split into its two halves and put back together in one canonical form. "over.tip"
 * is type "over" and name "tip"; either half may be empty, so ".tip" carries a name alone and
 * "over" a type alone. d3 reads "over" and "over." as the same registration, which is why the two
 * are stored under one key rather than as written.
 */
interface Typename {
  type: string;
  name: string;
  key: string;
}

function parseTypename(typename: string): Typename {
  const dot = typename.indexOf(".");
  const type = dot < 0 ? typename : typename.slice(0, dot);
  const name = dot < 0 ? "" : typename.slice(dot + 1);
  return { type, name, key: `${type}.${name}` };
}

/** The name half of a canonical key, which is everything after its single separating dot. */
function nameOfKey(key: string): string {
  return key.slice(key.indexOf(".") + 1);
}

export interface ListenerRegistry {
  /** Whether any of the component's handlers is registered, under any namespace. */
  hasListeners(): boolean;
  /**
   * Records what an `on()` setter call did. Call it only once d3 has validated the typenames by
   * returning the dispatch from its own `on`, so an invalid name has already thrown.
   */
  record(typenames: unknown, handler: unknown): void;
}

export function listenerRegistry(): ListenerRegistry {
  const registered = new Set<string>();

  return {
    hasListeners: () => registered.size > 0,

    record(typenames, handler) {
      // d3 accepts a space-separated list of typenames, and a null handler removes rather than
      // registers. The rest are d3's own rules, checked against it rather than read off its
      // source: an empty or whitespace-only list does nothing at all, and for a typename carrying
      // a name but no type a null handler removes that name from every event type while a non-null
      // one is ignored.
      const list = String(typenames).trim();
      if (list === "") return;

      for (const typename of list.split(/\s+/)) {
        const { type, name, key } = parseTypename(typename);
        if (handler == null) {
          if (type === "") {
            // oxlint-disable-next-line unicorn/no-useless-spread -- the copy is required: the loop body deletes from `registered`.
            for (const held of [...registered])
              if (nameOfKey(held) === name) registered.delete(held);
          } else {
            registered.delete(key);
          }
        } else if (type !== "") {
          registered.add(key);
        }
      }
    },
  };
}
