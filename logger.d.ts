/**
 *
 * @module sszvis/logger
 *
 * A component for logging development messages and errors
 *
 * This is a custom logger which accomplishes two goals: 1) to clearly identify log messages
 * coming from sszvis, and 2) to smooth out cross-browser inconsistencies in the implementation
 * of various console functions.
 *
 * All log messages should be visible in the developer tools Javascript console for your web browser
 * of choice. For more information on how to access browser developer tools, see the browser documentation.
 *
 * The logger provides three log levels. All logging functions can accept any number of arguments of
 * any type.
 *
 * Examples:
 *
 * Logging general information:
 *
 * sszvis.logger.log('Circle coordinates: ', circle.cx, circle.cy, circle.r);
 *
 * Logging a warning:
 *
 * sszvis.logger.warn('Configuration options are incompatible: ', props.config1(), props.config2());
 *
 * Logging an error:
 *
 * sszvis.logger.error('Component X requires the "abc" property');
 *
 * @method {any...} log        The basic log level, used for informational purposes
 * @method {any...} warn       Logs a warning, which identifies a potential, but not critical problem
 *                             or informs the user about certain implementation issues which may or
 *                             may not require user attention.
 * @method {any...} error      Logs an error. This should be used when something has gone wrong in the
 *                             implementation, or when the API is used in an unsupported manner. An
 *                             error logged in this way is different from an uncaught exception, in that
 *                             it does not force an unexpected termination of code execution. Instead,
 *                             when errors are logged, it is because of a known, and noticed issue, and
 *                             the error message should provide some information towards resolving the
 *                             problem, usually by changing the use of the library. The implementation
 *                             will handle the situation gracefully, and not cause an unexpected termination
 *                             of execution.
 */
/**
 * Type for logger function that accepts any number of arguments
 */
type LoggerFunction = (...args: unknown[]) => void;
export declare const log: LoggerFunction;
export declare const warn: LoggerFunction;
export declare const error: LoggerFunction;
export {};
//# sourceMappingURL=logger.d.ts.map