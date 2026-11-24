# How to change how a chart renders

Use this guide when you mean to change what a component draws. Intended visual
changes are rare. The snapshot suite exists to catch accidental rendering changes,
not to review design.

1. Treat the change as possibly breaking. Consumer charts may depend on the current
   rendering.
2. Run the [consumer chart check](check-consumer-charts.md). Its verdicts do not
   compare pixels, and it takes screenshots only of flagged charts. So also open the
   affected charts side by side with `pnpm run regression`, even when their verdict
   is clean.
3. If the change touches scales, time handling or axes, compare old and new renders
   side by side. The 5% snapshot tolerance can hide a real shift. See
   [pitfalls.md](../pitfalls.md#snapshot-tolerance-hides-real-changes).
4. Regenerate only the affected PNG baselines, in the Linux Playwright container, as
   `AGENTS.md` describes under "Testing". Never regenerate a PNG baseline on a Mac.
5. Say in the changeset what a consumer will see differently.
