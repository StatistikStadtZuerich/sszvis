/**
 * Application loop
 *
 * Sets up a self-contained application loop that coordinates state changes and rendering. This
 * reduces common errors, simplifies the setup, and allows us to optimize the render loop.
 *
 * The core functionality is based on [hyperapp](https://github.com/jorgebucaran/hyperapp).
 *
 * INIT returns a Promise containing the state, the render loop will be started once this
 * promise resolves
 *
 * ACTIONS can be of one of the following shapes:
 * - (state, props?) => nextState
 * - (state) => [nextState, ...effects]
 *
 * EFFECTS take the following shape:
 * - [(dispatch, props?) => void, prop?]
 *
 * @example
 * sszvis.app({
 *   init: function () {
 *     return d3.csv(config.data, parseRow).then(function (data) {
 *       return [
 *         {
 *           data: data,
 *           lineData: sszvis.cascade().arrayBy(cAcc, d3.ascending).apply(data),
 *           categories: sszvis.set(data, cAcc),
 *           maxY: d3.max(data, yAcc),
 *           selection: [],
 *         },
 *         sszvis.app.effect("resetDate"),
 *       ];
 *     });
 *   }
 * })
 *
 * @module sszvis/app
 */

import throttle from "nano-throttle";
import { fallbackRender } from "./fallback";
import { viewport } from "./viewport/resize";

const enqueue = typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : setTimeout;

export const app = ({ init, render, actions, fallback }) => {
  let doing;
  let state;

  const setState = (newState) => {
    // Because we mutate the state throughout, this assignment has no effect and the purity
    // implied by the `(state) => state` functions is actually a lie. However, fixing this is
    // for a next step.
    state = newState;

    // If the newState is the same as old state, this would have not to run. But we have no way
    // of knowing at the moment, so we run it anyway.
    if (render && !doing) enqueue(update, (doing = true));
  };

  const dispatch = (action, props) =>
    typeof action === "string"
      ? dispatch(actions[action](state, props))
      : typeof action === "function"
      ? dispatch(action(state, props))
      : Array.isArray(action)
      ? typeof action[0] === "string"
        ? dispatch(action[0], action[1])
        : action
            .slice(1)
            .map((fx) => fx && fx !== true && fx[0](dispatch, fx[1]), setState(action[0]))
      : setState(action);

  const actionFns = Object.keys(actions).reduce((acc, key) => {
    acc[key] = (args) => {
      dispatch(key, args);
    };
    return acc;
  }, {});

  const update = throttle(() => {
    render(state, actionFns);
    doing = false;
  }, 1000 / 60);

  init()
    .then(dispatch)
    .then(function () {
      viewport.on("resize", () => !doing && enqueue(update, (doing = true)));
    })
    .catch(function (err) {
      console.error(err);
      fallback && fallbackRender(fallback.element, { src: fallback.src });
    });
};

/**
 * Effect Creators
 */
app.effect = (action, props) => [(d, p) => d(action, p), props];

/*!
 * hyperapp license
 * Copyright © Jorge Bucaran <https://jorgebucaran.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the 'Software'), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
 * NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
