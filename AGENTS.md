# AGENTS.md

> **Note:** This file is the authoritative source for coding agent instructions.
> If in doubt, prefer AGENTS.md over README.md.

## 🚦 Quick Reference

- **Install dependencies:** `npm install`
- **Run all tests:** `npm run test`
- **Type check:** `npm run type-check`
- **Lint & format:** `npm run lint` / `npm run check`
- **Test a single file:** `npm run test -- test/color.test.ts`
- **Search code:** `rg "pattern"`

---

This file provides comprehensive guidance for coding agents when working with
the SSZVIS D3.js-based data visualization library for Statistik Stadt Zürich.

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)

Simplicity should be a key goal in design. Choose straightforward solutions over
complex ones whenever possible. Simple solutions are easier to understand,
maintain, and debug.

### YAGNI (You Aren't Gonna Need It)

Avoid building functionality on speculation. Implement features only when they
are needed, not when you anticipate they might be useful in the future.

### Design Principles

- **Functional Composition**: Prefer functional patterns and composition over
  OOP
- **D3.js Method Chaining**: Components follow D3's fluent interface pattern
- **Responsive-First**: All components support responsive breakpoints via
  `sszvis.responsiveProps()`
- **Modular Architecture**: Clear separation between components, behaviors,
  layouts, and utilities
- **Accessibility**: Charts should be accessible and provide fallback images

## 🧱 Project Structure & Library Architecture

SSZVIS is a D3.js-based data visualization library with a modular component
architecture. Components are designed for composition and follow functional
programming principles while maintaining D3's familiar method chaining API.

### Directory Structure

```txt
├── src/               - TypeScript/JavaScript source (mixed legacy and modern code)
│   ├── annotation/    - Chart annotations (tooltips, rulers, confidence intervals)
│   ├── behavior/      - Interaction behaviors (move, panning, voronoi)
│   ├── component/     - Chart components (bar, line, pie, sankey, etc.)
│   ├── control/       - UI controls (slider, buttonGroup, select)
│   ├── layout/        - Layout algorithms (sankey, sunburst, smallMultiples)
│   ├── legend/        - Legend components (color scales, radius)
│   ├── map/           - Map renderers and Swiss geography utilities
│   ├── maps/          - High-level map components (choropleth)
│   └── svgUtils/      - SVG utilities (crisp lines, text wrapping)
├── test/              - Vitest unit tests + Playwright visual regression
├── docs/              - 11ty documentation with live interactive examples
├── build/             - Compiled library output (JS + TypeScript declarations)
├── contrib/           - Example projects and experiments
└── geodata/           - GeoJSON/TopoJSON data for Swiss administrative regions
```

### Library Design Patterns

**Component Pattern**: All chart components follow D3's method chaining:

```javascript
const barChart = sszvis
  .bar()
  .x(sszvis.compose(xScale, xAccessor))
  .y(sszvis.compose(yScale, yAccessor))
  .width(xScale.bandwidth())
  .height(sszvis.compose(heightScale, yAccessor));
```

**State/Actions Pattern**: Examples use simple state management:

```javascript
const state = { data: [], selection: [] };
const actions = {
  prepareState(data) {
    /* update state */ render();
  },
  showTooltip(datum) {
    /* update state */ render();
  },
};
```

**Layer Architecture**: Separate concerns with different layers:

- `sszvis.createSvgLayer()` - Charts and visualizations
- `sszvis.createHtmlLayer()` - Tooltips and HTML overlays

**Functional Composition**: Heavy use of `sszvis.compose()` for data
transformations:

```javascript
.x(sszvis.compose(xScale, xAccessor))  // compose(f, g)(x) = f(g(x))
```

## 🧪 Testing Strategy

**Unit Testing**: Vitest with browser mode (Playwright/Chromium) for
DOM-dependent tests

- Test files: `test/**/*.test.{js,ts}`
- Run all: `npm test` or `npm run test:unit`
- Single file: `npm test -- test/color.test.ts`
- Watch mode: `npm run test:watch`

**Visual Regression Testing**: Playwright snapshots of all documentation
examples

- Location: `test/snapshot/snapshot.spec.js`
- Run: `npm run test:snapshot`
- Compares rendered charts against stored screenshots
- Tests interactive states (button clicks, tooltips)

**CI Pipeline**: `npm run test:ci` runs lint + type-check + format check

## 🛠️ Development Environment

**Preferred Setup**: Nix with direnv for reproducible environment

```bash
nix develop  # Enter development shell
```

**Package Manager**: npm (see `package-lock.json`)

**Build System**:

- **Rollup** for library bundling (`npm run build:lib`)
- **TypeScript** for type checking and compilation (`npm run build:ts`)
- **11ty** for documentation site (`npm run build:docs`)

**Development Commands**:

- `npm start` - Start documentation server (port 8000)
- `npm run build:watch` - Watch mode for library and docs
- `npm run build` - Full build (TS + lib + topo + docs + contrib)

**Editor**: VSCode recommended (no specific config files found)

## 📋 Style & Conventions

**Code Style**: Enforced by Biome (`biome.jsonc`)

- **Formatting**: 2 spaces, 100 char lines, double quotes, semicolons always
- **Commands**: `npm run format`, `npm run lint`, `npm run check`

**Mixed Codebase**:

- **Legacy**: JavaScript files (`.js`) for established components
- **Modern**: TypeScript files (`.ts`) for new utilities and types
- **Migration**: Gradually converting JS to TS

**Import Conventions**:

- Use `.js` extensions in TypeScript imports (required for ES modules)
- Organize imports automatically (`"organizeImports": "on"`)
- Named imports from D3: `import { select, scaleLinear } from "d3"`

**Naming Conventions**:

- **camelCase**: Variables, functions, properties
- **PascalCase**: Types, interfaces, classes
- **Prefixes**: Component functions often prefixed (e.g., `sszvis.bar()`)

**Function Patterns**:

- **Accessor functions**: `const xAcc = sszvis.prop("category")`
- **Composition**: `sszvis.compose(scale, accessor)` for data transformations
- **Method chaining**: D3-style fluent interfaces for components

**Documentation**:

- **JSDoc**: Required for all public components
- **Module docs**: Use `@module` tags for module-level documentation
- **Examples**: All components should have working examples in `docs/`

## 🚨 Error Handling

**Current Approach**: Errors are thrown directly (graceful handling is a future
enhancement)

**Data Loading**: Use `sszvis.loadError` for CSV/data loading failures:

```javascript
d3.csv("data.csv", parseRow).then(actions.prepareState).catch(sszvis.loadError);
```

**Common Patterns**:

- **NaN Handling**: Use fallback functions for missing data
- **Selection Validation**: Check DOM elements exist before manipulation
- **Scale Domain**: Validate data extents before creating scales

**Future Plans**: Implement graceful error handling and user-friendly error
messages

## 🔄 Git Workflow

### Branch Strategy

- `main` - Production-ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring
- `test/*` - Test additions or fixes

### Commit Message Format

Never include "coding agent" or "written by coding agent" in commit messages

```bash
<type>(<scope>): <subject>

<body>

<footer>
```

Types: feat, fix, docs, style, refactor, test, chore

Example:

```bash
feat(component): add treemap visualization component

- Implement hierarchical treemap using D3's treemap layout
- Add responsive sizing and color scale support
- Update documentation with data binding examples

Closes #123
```

## 📝 Documentation Standards

### Code Documentation

**JSDoc Standard**: All public components require comprehensive JSDoc:

```javascript
/**
 * Bar component
 *
 * @module sszvis/component/bar
 * @property {number, function} x       The x-position accessor
 * @property {number, function} y       The y-position accessor
 * @property {number, function} width   The width accessor
 * @property {number, function} height  The height accessor
 */
```

**Documentation Site**: Live examples in `docs/` using 11ty

- Each component has working examples with real data
- Examples follow consistent patterns (state/actions/render)
- Include responsive breakpoint handling

## ℹ️ Where to Find More Information

- For human contributors: see `README.md` for project overview and contribution
  guidelines.
- For coding agents: this `AGENTS.md` is your primary source for build, test,
  and style instructions.

---

## 📝 How to Update AGENTS.md

**Keep this file current!** Update AGENTS.md whenever you add new scripts,
change test commands, or update code style rules. Treat it as living
documentation for all coding agents and future maintainers.

---

## ❓ FAQ for Coding Agents

**Q: Should I write new components in JavaScript or TypeScript?** A: Use
TypeScript for new utilities and types. Follow existing patterns for components
(many are still JS).

**Q: How do I test components that depend on DOM/SVG?** A: Use Vitest's browser
mode with Playwright. Tests run in real browser environment.

**Q: What's the difference between `sszvis.createSvgLayer()` and
`sszvis.createHtmlLayer()`?** A: SVG layers for charts/visualizations, HTML
layers for tooltips and overlays.

**Q: How do I handle responsive behavior?** A: Use `sszvis.responsiveProps()` to
define breakpoint-specific values.

**Q: Where do I find Swiss geodata?** A: Check `geodata/` directory for
GeoJSON/TopoJSON files of Swiss administrative regions.

---

## 📚 Useful Resources

### Essential Tools

- **D3.js Documentation**: <https://d3js.org/> - Core dependency
- **Biome**: <https://biomejs.dev/> - Linting and formatting
- **Vitest**: <https://vitest.dev/> - Unit testing framework
- **Playwright**: <https://playwright.dev/> - Visual regression testing
- **11ty**: <https://www.11ty.dev/> - Documentation site generator
- **Rollup**: <https://rollupjs.org/> - Library bundling

## ⚠️ Important Notes

- **NEVER ASSUME OR GUESS** - When in doubt, ask for clarification
- **Always verify file paths and module names** before use
- **Keep AGENTS.md updated** when adding new patterns or dependencies
- **Test your code** - No feature is complete without tests
- **Focus on pure functions** - This library emphasizes functional composition
  over effectful operations

## 🔍 Search Command Requirements

**CRITICAL**: Always use `rg` (ripgrep) for search operations:

```bash
# ✅ Use rg for pattern searches
rg "pattern"

# ✅ Use rg for file filtering
rg --files -g "*.ts"
rg --files -g "*.test.ts"
```

---

_This document is a living guide. Update it as the project evolves and new
patterns emerge._
