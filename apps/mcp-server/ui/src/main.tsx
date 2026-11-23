import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChartApp } from "./app.tsx";
import { installChartRuntime } from "./runtime.ts";
import "./style.css";

installChartRuntime();

const root = document.getElementById("root");
if (root === null) throw new Error("#root is missing from the page");
createRoot(root).render(
  <StrictMode>
    <ChartApp />
  </StrictMode>,
);
