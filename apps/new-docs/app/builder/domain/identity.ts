import type { Spec } from "./spec";

type Json = string | number | boolean | null | readonly Json[] | { readonly [key: string]: Json };

const sortKeys = (_key: string, value: Json): Json => {
  if (Array.isArray(value) || !(value instanceof Object)) return value;
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
};

export const identity = (spec: Spec): string => JSON.stringify(spec, sortKeys);
