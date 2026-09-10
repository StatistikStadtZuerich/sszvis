/**
 * A one-line progress indicator for the long-running sweep.
 *
 * A sweep is a few thousand page loads; a line per load would bury the summary
 * that matters. So on a terminal the line is rewritten in place, and when
 * output is redirected - CI, a pipe, a log file - it is dropped entirely rather
 * than writing a few thousand carriage returns into the file.
 */
import { Context, Effect, Layer, Stream } from "effect";
import { Stdio } from "effect/Stdio";

export interface ProgressShape {
  readonly show: (line: string) => Effect.Effect<void>;
  readonly done: Effect.Effect<void>;
}

export class Progress extends Context.Service<Progress, ProgressShape>()(
  "regression-cli/services/Progress",
) {
  static readonly layer = Layer.effect(Progress)(
    Effect.gen(function* () {
      const stdio = yield* Stdio;
      const interactive = yield* stdio.stdoutIsTerminal;

      const write = (text: string) =>
        Stream.make(text).pipe(Stream.run(stdio.stdout({ endOnDone: false })), Effect.ignore);

      return Progress.of({
        show: (line) => (interactive ? write(`\r${line.padEnd(78)}`) : Effect.void),
        done: interactive ? write("\n") : Effect.void,
      });
    }),
  );
}
