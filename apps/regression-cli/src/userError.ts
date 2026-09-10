/**
 * Failures whose whole content is an instruction to the operator: build the
 * library, check out the reference charts, run a sweep first.
 *
 * `CliError.UserError` is what the CLI runner renders as a plain message and
 * exits non-zero on, instead of logging a stack trace at someone who only needs
 * to be told which command to run.
 */
import { CliError } from "effect/unstable/cli";

export const userError = (message: string): CliError.UserError =>
  new CliError.UserError({ cause: message, userMessage: message });
