import { enableES5, setAutoFreeze } from "immer";
import "promise-polyfill/src/polyfill";
import "whatwg-fetch";
import "./d3-request.js";
import "./innersvg.js";
import "./isnan.js";

enableES5();

// d3 mutates state in many places, which is why we have to turn this off.
setAutoFreeze(false);
