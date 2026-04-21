# Executive Banking UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the `apps/web` experience into a premium executive-banking product with equal-quality light and dark themes, improved page composition, and safer responsive behavior without changing business workflows.

**Architecture:** Start with the shared design foundation so every later page change inherits the same palette, spacing, typography, and elevation rules. Then rebuild the shell and reusable UI primitives, followed by focused page passes for each major workflow. Execute in an isolated worktree if possible, or stage only the files listed in each task because the current repository already contains unrelated local changes.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, CSS custom properties, Framer Motion, TanStack Query, React Router, Vitest, Testing Library

---

## File Map

### Foundation

- Modify: `apps/web/src/index.css`
  Purpose: define the executive-banking light and dark CSS tokens, typography imports, surface utilities, focus states, table variables, and responsive spacing helpers.
- Modify: `apps/web/tailwind.config.js`
  Purpose: expose the new token aliases to Tailwind, switch fonts, and align shadow/radius utilities with the redesign.
- Modify: `apps/web/src/lib/design-tokens/index.ts`
  Purpose: replace the dark-only token model with dual-theme semantic token exports used by TypeScript-driven components.
- Modify: `apps/web/src/lib/theme-provider.tsx`
  Purpose: normalize theme persistence and root attribute updates for the new token set.
- Create: `apps/web/src/tests/theme-parity.test.tsx`
  Purpose: regression tests for shared light/dark tokens and root theme behavior.
- Modify: `apps/web/src/tests/dark-mode-verification.test.tsx`
  Purpose: expand the old dark-only checks so they validate the upgraded theme system.

### Shell and test harness

- Modify: `apps/web/src/components/layout.tsx`
  Purpose: rebuild the sidebar, top bar, page-heading framing, and visible theme toggle around the executive-banking system.
- Create: `apps/web/src/components/layout.test.tsx`
  Purpose: verify navigation state, shell headings, and top-bar controls.
- Create: `apps/web/src/test/render-page.tsx`
  Purpose: reusable test renderer with router, query client, theme provider, accessibility provider, and undo provider.
- Modify: `apps/web/src/App.tsx`
  Purpose: align the outer app frame and loading fallback with the new shell behavior.

### Shared primitives

- Modify: `apps/web/src/components/ui/atoms/Button.tsx`
- Modify: `apps/web/src/components/ui/atoms/Input.tsx`
- Modify: `apps/web/src/components/ui/atoms/Select.tsx`
- Modify: `apps/web/src/components/ui/atoms/Badge.tsx`
- Modify: `apps/web/src/components/ui/molecules/Card.tsx`
- Modify: `apps/web/src/components/ui/molecules/Modal.tsx`
- Modify: `apps/web/src/components/ui/organisms/Table.tsx`
- Modify: `apps/web/src/components/ui/feedback.tsx`
- Modify: `apps/web/src/components/ui/metrics.tsx`
- Modify: `apps/web/src/components/ui/section-title.tsx`
- Modify tests: `apps/web/src/components/ui/atoms/Button.test.tsx`, `apps/web/src/components/ui/molecules/Card.test.tsx`, `apps/web/src/components/ui/organisms/Table.test.tsx`
  Purpose: move shared controls from hard-coded dark cockpit styling to semantic, dual-theme banking components.

### Page layer

- Modify: `apps/web/src/pages/AuthPage.tsx`
- Modify: `apps/web/src/pages/DashboardPage.tsx`
- Modify: `apps/web/src/pages/DatasetsPage.tsx`
- Modify: `apps/web/src/pages/ModelsPage.tsx`
- Modify: `apps/web/src/pages/PredictPage.tsx`
- Modify: `apps/web/src/pages/LoanDetailPage.tsx`
- Modify: `apps/web/src/pages/AdminPage.tsx`
- Modify: `apps/web/src/pages/ProfilePage.tsx`
- Create tests: `apps/web/src/pages/AuthPage.test.tsx`, `apps/web/src/pages/DashboardPage.test.tsx`, `apps/web/src/pages/DatasetsPage.test.tsx`, `apps/web/src/pages/ModelsPage.test.tsx`, `apps/web/src/pages/PredictPage.test.tsx`, `apps/web/src/pages/LoanDetailPage.test.tsx`, `apps/web/src/pages/AdminPage.test.tsx`, `apps/web/src/pages/ProfilePage.test.tsx`
  Purpose: redesign each major workflow around the approved layout rules while preserving data flow and user actions.

### Verification

- Run: `npm run test -w apps/web`
- Run: `npm run build -w apps/web`
- Run: `npx tsx apps/web/src/tests/run-contrast-check.ts`
  Purpose: prove that the redesign still builds, still behaves, and still meets contrast goals.

## Task 1: Build the dual-theme executive foundation

**Files:**
- Create: `apps/web/src/tests/theme-parity.test.tsx`
- Modify: `apps/web/src/index.css`
- Modify: `apps/web/src/lib/design-tokens/index.ts`
- Modify: `apps/web/tailwind.config.js`
- Modify: `apps/web/src/lib/theme-provider.tsx`
- Test: `apps/web/src/tests/dark-mode-verification.test.tsx`

- [ ] **Step 1: Write the failing theme-parity regression test**

```tsx
// apps/web/src/tests/theme-parity.test.tsx
import "../index.css";
import { beforeEach, describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ThemeProvider } from "../lib/theme-provider";

function TokenProbe() {
  return <div data-testid="probe" className="bg-base-950 text-base-50" />;
}

describe("theme parity", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("defines executive banking surface tokens for light mode", () => {
    localStorage.setItem("app-theme", "light");
    render(
      <ThemeProvider>
        <TokenProbe />
      </ThemeProvider>
    );

    const rootStyles = getComputedStyle(document.documentElement);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(rootStyles.getPropertyValue("--surface-canvas").trim()).not.toBe("");
    expect(rootStyles.getPropertyValue("--surface-panel").trim()).not.toBe("");
    expect(rootStyles.getPropertyValue("--text-strong").trim()).not.toBe("");
  });

  it("keeps the same semantic token names in dark mode", () => {
    localStorage.setItem("app-theme", "dark");
    render(
      <ThemeProvider>
        <TokenProbe />
      </ThemeProvider>
    );

    const rootStyles = getComputedStyle(document.documentElement);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(rootStyles.getPropertyValue("--surface-canvas").trim()).not.toBe("");
    expect(rootStyles.getPropertyValue("--surface-panel").trim()).not.toBe("");
    expect(rootStyles.getPropertyValue("--text-strong").trim()).not.toBe("");
  });
});
```

- [ ] **Step 2: Run the targeted theme tests and verify they fail**

Run: `npm run test -w apps/web -- src/tests/theme-parity.test.tsx src/tests/dark-mode-verification.test.tsx`

Expected: FAIL because `--surface-canvas`, `--surface-panel`, and `--text-strong` do not exist yet and the old dark-only verification file does not understand the new token model.

- [ ] **Step 3: Implement the executive-banking token system**

```ts
// apps/web/src/lib/design-tokens/index.ts
export const themePalettes = {
  light: {
    surfaceCanvas: "244 239 230",
    surfacePanel: "255 252 246",
    surfaceRaised: "236 230 221",
    borderSubtle: "205 195 181",
    textStrong: "31 38 47",
    textMuted: "95 103 115",
    accentPrimary: "33 76 128",
  },
  dark: {
    surfaceCanvas: "9 18 28",
    surfacePanel: "16 28 41",
    surfaceRaised: "27 42 58",
    borderSubtle: "58 76 96",
    textStrong: "240 243 247",
    textMuted: "151 163 176",
    accentPrimary: "111 154 214",
  },
} as const;

export const typography = {
  ...typography,
  fontFamilies: {
    sans: ['"Manrope"', "Inter", "system-ui", "sans-serif"],
    mono: ['"IBM Plex Mono"', '"JetBrains Mono"', "monospace"],
  },
} as const;
```

```js
// apps/web/tailwind.config.js
fontFamily: {
  sans: designTokens.typography.fontFamilies.sans,
  mono: designTokens.typography.fontFamilies.mono,
},
colors: {
  primary: {
    DEFAULT: "rgb(var(--accent-primary) / <alpha-value>)",
  },
  base: {
    50: "rgb(var(--text-strong) / <alpha-value>)",
    300: "rgb(var(--text-muted) / <alpha-value>)",
    900: "rgb(var(--surface-panel) / <alpha-value>)",
    950: "rgb(var(--surface-canvas) / <alpha-value>)",
  },
},
boxShadow: {
  bank: "0 18px 50px rgba(15, 23, 42, 0.10)",
  "bank-dark": "0 18px 50px rgba(2, 6, 23, 0.45)",
},
```

```css
/* apps/web/src/index.css */
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap");

:root {
  --surface-canvas: 9 18 28;
  --surface-panel: 16 28 41;
  --surface-raised: 27 42 58;
  --border-subtle: 58 76 96;
  --text-strong: 240 243 247;
  --text-muted: 151 163 176;
  --accent-primary: 111 154 214;
}

html[data-theme="light"] {
  --surface-canvas: 244 239 230;
  --surface-panel: 255 252 246;
  --surface-raised: 236 230 221;
  --border-subtle: 205 195 181;
  --text-strong: 31 38 47;
  --text-muted: 95 103 115;
  --accent-primary: 33 76 128;
  color-scheme: light;
}

html[data-theme="dark"] {
  color-scheme: dark;
}

body {
  background: rgb(var(--surface-canvas));
  color: rgb(var(--text-strong));
  font-family: "Manrope", Inter, system-ui, sans-serif;
}
```

```ts
// apps/web/src/lib/theme-provider.tsx
useEffect(() => {
  const root = document.documentElement;
  const nextTheme = theme === "system" ? getSystemTheme() : theme;
  setResolvedTheme(nextTheme);
  root.dataset.theme = nextTheme;
  root.style.colorScheme = nextTheme;
}, [theme]);
```

- [ ] **Step 4: Re-run the theme checks and contrast script**

Run: `npm run test -w apps/web -- src/tests/theme-parity.test.tsx src/tests/dark-mode-verification.test.tsx`

Expected: PASS with both test files green.

Run: `npx tsx apps/web/src/tests/run-contrast-check.ts`

Expected: contrast output completes without any failing entries for the updated semantic tokens.

- [ ] **Step 5: Commit only the foundation files**

```bash
git add -- \
  apps/web/src/index.css \
  apps/web/src/lib/design-tokens/index.ts \
  apps/web/tailwind.config.js \
  apps/web/src/lib/theme-provider.tsx \
  apps/web/src/tests/theme-parity.test.tsx \
  apps/web/src/tests/dark-mode-verification.test.tsx
git commit -m "feat(web): add executive dual-theme foundation"
```

## Task 2: Rebuild the shell and add the page-test harness

**Files:**
- Create: `apps/web/src/test/render-page.tsx`
- Create: `apps/web/src/components/layout.test.tsx`
- Modify: `apps/web/src/components/layout.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Write the failing shell regression test**

```tsx
// apps/web/src/components/layout.test.tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../lib/theme-provider";
import { AppShell } from "./layout";

const auth = {
  session: {
    token: "token",
    user: {
      id: "user-1",
      email: "analyst@example.com",
      fullName: "Ari Analyst",
      role: "ADMIN" as const,
      tenantId: "tenant-1",
    },
  },
};

describe("AppShell", () => {
  it("shows a visible page heading and top-bar theme toggle", () => {
    render(
      <MemoryRouter initialEntries={["/app/dashboard"]}>
        <ThemeProvider defaultTheme="light">
          <AppShell auth={auth} onLogout={() => {}}>
            <div>Body</div>
          </AppShell>
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
  });

  it("marks the current nav item with aria-current", () => {
    render(
      <MemoryRouter initialEntries={["/app/dashboard"]}>
        <ThemeProvider defaultTheme="dark">
          <AppShell auth={auth} onLogout={() => {}}>
            <div>Body</div>
          </AppShell>
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("aria-current", "page");
  });
});
```

- [ ] **Step 2: Run the shell test and verify it fails**

Run: `npm run test -w apps/web -- src/components/layout.test.tsx`

Expected: FAIL because the current shell has no visible page heading, no visible theme toggle button in the header, and the nav links do not expose `aria-current`.

- [ ] **Step 3: Add the shared render helper and implement the executive shell**

```tsx
// apps/web/src/test/render-page.tsx
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { render } from "@testing-library/react";
import { ThemeProvider } from "../lib/theme-provider";
import { AccessibilityProvider } from "../lib/accessibility/AccessibilityProvider";
import { UndoProvider } from "../lib/undo-provider";
import { ToastProvider } from "../components/ui/molecules/Toast";

export function renderPage(ui: React.ReactElement, route = "/app/dashboard") {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider defaultTheme="light">
        <QueryClientProvider client={client}>
          <ToastProvider>
            <AccessibilityProvider>
              <UndoProvider>{ui}</UndoProvider>
            </AccessibilityProvider>
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}
```

```tsx
// apps/web/src/components/layout.tsx
const pageMeta = {
  "/app/dashboard": { title: "Dashboard", subtitle: "Portfolio health and review flow" },
  "/app/datasets": { title: "Datasets", subtitle: "Source portfolios and mapping governance" },
  "/app/models": { title: "Models", subtitle: "Champion performance and production readiness" },
  "/app/predict": { title: "Predict", subtitle: "Underwriting workspace and batch scoring" },
  "/app/admin": { title: "Admin", subtitle: "Operations, telemetry, and audit oversight" },
  "/app/profile": { title: "Profile", subtitle: "Account, security, and appearance settings" },
} as const;

function NavItem({ to, icon: Icon, label, collapsed, onClick }: NavItemProps) {
  return (
    <NavLink to={to} onClick={onClick} className="block" end>
      {({ isActive }) => (
        <div
          className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition-all ${
            isActive
              ? "bg-white/80 text-slate-950 shadow-bank dark:bg-white/10 dark:text-white"
              : "text-[rgb(var(--text-muted))] hover:bg-black/5 hover:text-[rgb(var(--text-strong))] dark:hover:bg-white/5"
          }`}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="truncate text-sm font-semibold">{label}</span>}
        </div>
      )}
    </NavLink>
  );
}

const { title, subtitle } = pageMeta[location.pathname as keyof typeof pageMeta] ?? {
  title: "Workspace",
  subtitle: "Operational surface",
};
```

```tsx
// apps/web/src/components/layout.tsx
<header className="sticky top-0 z-30 border-b border-black/10 bg-[rgb(var(--surface-panel))]/90 backdrop-blur-xl dark:border-white/10">
  <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 lg:px-8">
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-muted))]">
        Executive Banking
      </p>
      <h1 className="truncate text-xl font-semibold text-[rgb(var(--text-strong))]">{title}</h1>
      <p className="truncate text-sm text-[rgb(var(--text-muted))]">{subtitle}</p>
    </div>
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Toggle theme"
        onClick={toggleTheme}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/70 text-[rgb(var(--text-strong))] dark:border-white/10 dark:bg-white/5"
      >
        {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <NotificationsMenu />
      <UserProfileMenu auth={auth} onLogout={onLogout} />
    </div>
  </div>
</header>
```

```tsx
// apps/web/src/App.tsx
return (
  <div className="min-h-screen bg-[rgb(var(--surface-canvas))] text-[rgb(var(--text-strong))]">
    <OfflineBanner />
    <ScrollToTop />
    <Suspense fallback={<GlobalSkeleton />}>
      <Routes>{/* existing routes stay unchanged */}</Routes>
    </Suspense>
  </div>
);
```

- [ ] **Step 4: Re-run the shell test**

Run: `npm run test -w apps/web -- src/components/layout.test.tsx`

Expected: PASS with a visible heading, visible theme toggle, and active navigation state.

- [ ] **Step 5: Commit the shell layer**

```bash
git add -- \
  apps/web/src/components/layout.tsx \
  apps/web/src/components/layout.test.tsx \
  apps/web/src/test/render-page.tsx \
  apps/web/src/App.tsx
git commit -m "feat(web): redesign executive shell and page chrome"
```

## Task 3: Convert shared primitives to semantic banking components

**Files:**
- Modify: `apps/web/src/components/ui/atoms/Button.tsx`
- Modify: `apps/web/src/components/ui/atoms/Input.tsx`
- Modify: `apps/web/src/components/ui/atoms/Select.tsx`
- Modify: `apps/web/src/components/ui/atoms/Badge.tsx`
- Modify: `apps/web/src/components/ui/molecules/Card.tsx`
- Modify: `apps/web/src/components/ui/molecules/Modal.tsx`
- Modify: `apps/web/src/components/ui/organisms/Table.tsx`
- Modify: `apps/web/src/components/ui/feedback.tsx`
- Modify: `apps/web/src/components/ui/metrics.tsx`
- Modify: `apps/web/src/components/ui/section-title.tsx`
- Test: `apps/web/src/components/ui/atoms/Button.test.tsx`
- Test: `apps/web/src/components/ui/molecules/Card.test.tsx`
- Test: `apps/web/src/components/ui/organisms/Table.test.tsx`

- [ ] **Step 1: Write the failing primitive-regression assertions**

```tsx
// apps/web/src/components/ui/atoms/Button.test.tsx
it("exposes semantic variant data instead of hard-coded color assumptions", () => {
  render(<Button variant="secondary">Review</Button>);
  expect(screen.getByRole("button", { name: /review/i })).toHaveAttribute("data-variant", "secondary");
});
```

```tsx
// apps/web/src/components/ui/molecules/Card.test.tsx
it("marks the executive card header as its own section", () => {
  render(<Card header={<h3>Portfolio Health</h3>}>Body</Card>);
  expect(screen.getByText("Portfolio Health").closest('[data-card-section="header"]')).toBeInTheDocument();
});
```

```tsx
// apps/web/src/components/ui/organisms/Table.test.tsx
it("renders the table surface with executive density metadata", () => {
  render(<Table data={mockData} columns={mockColumns} />);
  expect(screen.getByRole("table")).toHaveAttribute("data-density", "comfortable");
});
```

- [ ] **Step 2: Run the primitive tests and verify they fail**

Run: `npm run test -w apps/web -- src/components/ui/atoms/Button.test.tsx src/components/ui/molecules/Card.test.tsx src/components/ui/organisms/Table.test.tsx`

Expected: FAIL because the current primitives use hard-coded dark-mode styles and do not expose the semantic structure asserted by the tests.

- [ ] **Step 3: Rebuild the primitives around semantic classes and data attributes**

```tsx
// apps/web/src/components/ui/atoms/Button.tsx
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full border text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
  {
    variants: {
      variant: {
        primary: "bg-[rgb(var(--accent-primary))] text-white border-transparent hover:brightness-105",
        secondary: "bg-[rgb(var(--surface-panel))] text-[rgb(var(--text-strong))] border-black/10 hover:bg-[rgb(var(--surface-raised))] dark:border-white/10",
        ghost: "bg-transparent text-[rgb(var(--text-muted))] border-transparent hover:bg-black/5 hover:text-[rgb(var(--text-strong))] dark:hover:bg-white/5",
        danger: "bg-[rgb(var(--danger-strong,185_28_28))] text-white border-transparent hover:brightness-105",
        outline: "bg-transparent text-[rgb(var(--text-strong))] border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5",
      },
      size: {
        xs: "h-7 px-3",
        sm: "h-9 px-4",
        md: "h-10 px-5",
        lg: "h-11 px-6",
        xl: "h-12 px-7",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

<motion.button data-variant={variant} data-size={activeSize} className={cn(buttonVariants({ variant, size: activeSize }), className)} />
```

```tsx
// apps/web/src/components/ui/molecules/Card.tsx
<motion.div
  ref={ref as any}
  data-surface="panel"
  className={cn(
    "overflow-hidden rounded-[28px] bg-[rgb(var(--surface-panel))] text-[rgb(var(--text-strong))] shadow-bank dark:shadow-bank-dark",
    border && "border border-black/10 dark:border-white/10",
    hoverable && "transition-transform duration-200 hover:-translate-y-0.5"
  )}
>
  {header ? <div data-card-section="header" className="border-b border-black/10 px-6 py-5 dark:border-white/10">{header}</div> : null}
  <div data-card-section="body" className={padded ? "p-6" : ""}>{children}</div>
  {footer ? <div data-card-section="footer" className="border-t border-black/10 px-6 py-5 dark:border-white/10">{footer}</div> : null}
</motion.div>
```

```tsx
// apps/web/src/components/ui/organisms/Table.tsx
<table
  data-density="comfortable"
  className="min-w-full overflow-hidden rounded-[24px] border border-black/10 bg-[rgb(var(--surface-panel))] text-sm dark:border-white/10"
>
```

```tsx
// apps/web/src/components/ui/atoms/Input.tsx and Select.tsx
className="h-11 rounded-2xl border border-black/10 bg-[rgb(var(--surface-panel))] px-4 text-sm text-[rgb(var(--text-strong))] focus:border-[rgb(var(--accent-primary))] focus:ring-4 focus:ring-primary/10 dark:border-white/10"
```

```tsx
// apps/web/src/components/ui/metrics.tsx and section-title.tsx
export function SectionTitle({ eyebrow, title, description, className }: SectionTitleProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-muted))]">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight text-[rgb(var(--text-strong))]">{title}</h2>
      {description ? <p className="max-w-2xl text-sm text-[rgb(var(--text-muted))]">{description}</p> : null}
    </div>
  );
}
```

```tsx
// apps/web/src/components/ui/feedback.tsx and Modal.tsx
export function InlineNotice({ message, tone = "info", className }: InlineNoticeProps) {
  return (
    <div
      data-tone={tone}
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        tone === "info" && "border-black/10 bg-white/80 text-[rgb(var(--text-strong))] dark:border-white/10 dark:bg-white/5",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100",
        className
      )}
    >
      {message}
    </div>
  );
}

<div className="rounded-[28px] border border-black/10 bg-[rgb(var(--surface-panel))] shadow-bank dark:border-white/10 dark:shadow-bank-dark">
  {children}
</div>
```

- [ ] **Step 4: Re-run the primitive tests**

Run: `npm run test -w apps/web -- src/components/ui/atoms/Button.test.tsx src/components/ui/molecules/Card.test.tsx src/components/ui/organisms/Table.test.tsx`

Expected: PASS with semantic `data-*` hooks and no hard-coded dark-only behavior.

- [ ] **Step 5: Commit the primitive layer**

```bash
git add -- \
  apps/web/src/components/ui/atoms/Button.tsx \
  apps/web/src/components/ui/atoms/Input.tsx \
  apps/web/src/components/ui/atoms/Select.tsx \
  apps/web/src/components/ui/atoms/Badge.tsx \
  apps/web/src/components/ui/molecules/Card.tsx \
  apps/web/src/components/ui/molecules/Modal.tsx \
  apps/web/src/components/ui/organisms/Table.tsx \
  apps/web/src/components/ui/feedback.tsx \
  apps/web/src/components/ui/metrics.tsx \
  apps/web/src/components/ui/section-title.tsx \
  apps/web/src/components/ui/atoms/Button.test.tsx \
  apps/web/src/components/ui/molecules/Card.test.tsx \
  apps/web/src/components/ui/organisms/Table.test.tsx
git commit -m "feat(web): restyle shared primitives for executive banking"
```

## Task 4: Redesign Auth and Dashboard

**Files:**
- Create: `apps/web/src/pages/AuthPage.test.tsx`
- Create: `apps/web/src/pages/DashboardPage.test.tsx`
- Modify: `apps/web/src/pages/AuthPage.tsx`
- Modify: `apps/web/src/pages/DashboardPage.tsx`

- [ ] **Step 1: Write failing page-smoke tests for Auth and Dashboard**

```tsx
// apps/web/src/pages/AuthPage.test.tsx
import { describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "../lib/theme-provider";
import { AuthPage } from "./AuthPage";

const auth = { session: null, setSession: () => {} };

describe("AuthPage", () => {
  it("renders the secure workspace heading and trust copy", () => {
    render(
      <MemoryRouter>
        <ThemeProvider defaultTheme="light">
          <QueryClientProvider client={new QueryClient()}>
            <AuthPage auth={auth} />
          </QueryClientProvider>
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/secure loan intelligence workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/institutional underwriting access/i)).toBeInTheDocument();
  });
});
```

```tsx
// apps/web/src/pages/DashboardPage.test.tsx
import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { DashboardPage } from "./DashboardPage";
import { renderPage } from "../test/render-page";

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual("../lib/api");
  return {
    ...actual,
    apiFetch: vi.fn().mockResolvedValue({
      analytics: {
        metrics: {
          totalDatasets: 4,
          totalModels: 3,
          totalPredictions: 212,
          creditsUsed: 0,
          fraudAlerts: 2,
          lastTrainingStatus: "completed",
        },
        activities: [],
      },
      balance: { tenantId: "tenant-1", balance: 1000, reserved: 0, available: 1000, used: 0 },
      datasets: [],
      models: [{
        id: "model-1",
        datasetId: "dataset-1",
        championFamily: "Gradient Boosting",
        championMetrics: { rocAuc: 0.91, f1Score: 0.88, precision: 0.9, recall: 0.87, accuracy: 0.89 },
        pinnedVersionId: "version-1",
        lastTrainingStatus: "completed",
        lastTrainingError: null,
        updatedAt: "2026-04-21T10:00:00.000Z",
      }],
      pendingPredictions: [{
        id: "loan-1",
        datasetId: "dataset-1",
        modelVersionId: "version-1",
        decision: null,
        probability: 0.82,
        features: { applicant_name: "Maya Patel", loan_amount: 250000 },
        fraudScore: 0.14,
        fraudSignals: null,
        explanation: null,
        reviewStatus: "pending",
        createdAt: "2026-04-21T10:00:00.000Z",
      }],
      recentDecisions: [],
    }),
  };
});

const auth = {
  session: {
    token: "token",
    user: { id: "u1", email: "analyst@example.com", fullName: "Ari Analyst", role: "ADMIN" as const, tenantId: "tenant-1" },
  },
  setSession: () => {},
};

describe("DashboardPage", () => {
  it("shows the portfolio health summary and pending loans workspace", async () => {
    renderPage(<DashboardPage auth={auth} />);
    await waitFor(() => expect(screen.getByText(/portfolio health/i)).toBeInTheDocument());
    expect(screen.getByText(/pending loans/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the page-smoke tests and verify they fail**

Run: `npm run test -w apps/web -- src/pages/AuthPage.test.tsx src/pages/DashboardPage.test.tsx`

Expected: FAIL because the current auth page uses the old "Originate" gateway copy and the dashboard does not expose the new "Portfolio Health" summary structure.

- [ ] **Step 3: Implement the Auth and Dashboard page redesign**

```tsx
// apps/web/src/pages/AuthPage.tsx
<div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
  <section className="hidden bg-[rgb(var(--surface-raised))] lg:flex lg:flex-col lg:justify-between lg:p-12">
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-muted))]">
        Institutional underwriting access
      </p>
      <h1 className="mt-4 max-w-md text-5xl font-semibold tracking-tight text-[rgb(var(--text-strong))]">
        Secure loan intelligence workspace
      </h1>
      <p className="mt-6 max-w-lg text-base text-[rgb(var(--text-muted))]">
        Review model-driven decisions, govern datasets, and keep every approval traceable in one premium operating console.
      </p>
    </div>
  </section>
  <section className="flex items-center justify-center p-6 lg:p-10">
    <Card border padded className="w-full max-w-[460px] rounded-[32px]">
      {/* existing form logic stays intact */}
    </Card>
  </section>
</div>
```

```tsx
// apps/web/src/pages/DashboardPage.tsx
<div className="space-y-8">
  <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
    <Card border padded>
      <SectionTitle
        eyebrow="Portfolio Health"
        title="Decision flow at a glance"
        description="Track pending review load, current model readiness, and risk concentration before acting."
      />
      {/* summary metrics */}
    </Card>
    <Card border padded>
      <h3 className="text-sm font-semibold">Review velocity</h3>
      {/* avg review time and alerts */}
    </Card>
  </section>

  <section className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-muted))]">Pending loans</p>
        <h2 className="text-2xl font-semibold text-[rgb(var(--text-strong))]">Pending loans</h2>
      </div>
      {/* existing risk filter stays intact */}
    </div>
    {/* existing queue table */}
  </section>
</div>
```

- [ ] **Step 4: Re-run the Auth and Dashboard tests**

Run: `npm run test -w apps/web -- src/pages/AuthPage.test.tsx src/pages/DashboardPage.test.tsx`

Expected: PASS with the new headings and summary structure rendered.

- [ ] **Step 5: Commit the Auth and Dashboard work**

```bash
git add -- \
  apps/web/src/pages/AuthPage.tsx \
  apps/web/src/pages/DashboardPage.tsx \
  apps/web/src/pages/AuthPage.test.tsx \
  apps/web/src/pages/DashboardPage.test.tsx
git commit -m "feat(web): redesign auth and dashboard surfaces"
```

## Task 5: Redesign Datasets and Models

**Files:**
- Create: `apps/web/src/pages/DatasetsPage.test.tsx`
- Create: `apps/web/src/pages/ModelsPage.test.tsx`
- Modify: `apps/web/src/pages/DatasetsPage.tsx`
- Modify: `apps/web/src/pages/ModelsPage.tsx`

- [ ] **Step 1: Write failing page-smoke tests for Datasets and Models**

```tsx
// apps/web/src/pages/DatasetsPage.test.tsx
import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { DatasetsPage } from "./DatasetsPage";
import { renderPage } from "../test/render-page";

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual("../lib/api");
  return {
    ...actual,
    apiFetch: vi.fn().mockResolvedValue([
      { id: "dataset-1", fileName: "loan-book-q1.csv", status: "mapped", rowCount: 4200, profileStatus: "completed", mapping: null },
    ]),
  };
});

const auth = {
  session: {
    token: "token",
    user: { id: "u1", email: "analyst@example.com", fullName: "Ari Analyst", role: "ADMIN" as const, tenantId: "tenant-1" },
  },
  setSession: () => {},
};

describe("DatasetsPage", () => {
  it("shows the dataset portfolio heading", async () => {
    renderPage(<DatasetsPage auth={auth} />);
    await waitFor(() => expect(screen.getByText(/dataset portfolio/i)).toBeInTheDocument());
  });
});
```

```tsx
// apps/web/src/pages/ModelsPage.test.tsx
import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { ModelsPage } from "./ModelsPage";
import { renderPage } from "../test/render-page";

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual("../lib/api");
  return {
    ...actual,
    apiFetch: vi.fn().mockImplementation((path: string) => {
      if (path === "/models") {
        return Promise.resolve([{
          id: "model-1",
          datasetId: "dataset-1",
          championFamily: "Gradient Boosting",
          championMetrics: { rocAuc: 0.91, f1Score: 0.88, precision: 0.9, recall: 0.87, accuracy: 0.89 },
          pinnedVersionId: "version-1",
          lastTrainingStatus: "completed",
          lastTrainingError: null,
          updatedAt: "2026-04-21T10:00:00.000Z",
        }]);
      }
      return Promise.resolve([]);
    }),
  };
});

const auth = {
  session: {
    token: "token",
    user: { id: "u1", email: "analyst@example.com", fullName: "Ari Analyst", role: "ADMIN" as const, tenantId: "tenant-1" },
  },
  setSession: () => {},
};

describe("ModelsPage", () => {
  it("shows the champion model summary heading", async () => {
    renderPage(<ModelsPage auth={auth} />);
    await waitFor(() => expect(screen.getByText(/champion model/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run the Datasets and Models tests and verify they fail**

Run: `npm run test -w apps/web -- src/pages/DatasetsPage.test.tsx src/pages/ModelsPage.test.tsx`

Expected: FAIL because neither page currently exposes the new portfolio-oriented headings.

- [ ] **Step 3: Implement the Datasets and Models redesign**

```tsx
// apps/web/src/pages/DatasetsPage.tsx
<div className="space-y-8">
  <SectionTitle
    eyebrow="Data Governance"
    title="Dataset portfolio"
    description="Prepare training portfolios, monitor readiness, and keep schema decisions visible."
  />
  <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
    <Card border padded>{/* dataset summary metrics */}</Card>
    <Card border padded>{/* workflow progress and selected dataset state */}</Card>
  </section>
  {/* existing list, upload, and mapping flows stay intact inside the new layout */}
</div>
```

```tsx
// apps/web/src/pages/ModelsPage.tsx
const championModel = filteredModels.find((model) => model.pinnedVersionId) ?? filteredModels[0] ?? null;

<div className="space-y-8">
  <SectionTitle
    eyebrow="Model Portfolio"
    title="Champion model and training history"
    description="Review the production champion first, then compare versions, readiness, and promotion choices."
  />

  {championModel ? (
    <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
      <Card border padded>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-muted))]">Champion model</p>
        <h2 className="mt-2 text-2xl font-semibold text-[rgb(var(--text-strong))]">{championModel.championFamily}</h2>
        {/* champion metrics */}
      </Card>
      <Card border padded>{/* production readiness summary */}</Card>
    </section>
  ) : null}

  {/* existing models table and actions stay intact below the champion summary */}
</div>
```

- [ ] **Step 4: Re-run the Datasets and Models tests**

Run: `npm run test -w apps/web -- src/pages/DatasetsPage.test.tsx src/pages/ModelsPage.test.tsx`

Expected: PASS with the portfolio headings rendered and the existing data still visible.

- [ ] **Step 5: Commit the Datasets and Models work**

```bash
git add -- \
  apps/web/src/pages/DatasetsPage.tsx \
  apps/web/src/pages/ModelsPage.tsx \
  apps/web/src/pages/DatasetsPage.test.tsx \
  apps/web/src/pages/ModelsPage.test.tsx
git commit -m "feat(web): redesign datasets and models workflows"
```

## Task 6: Redesign Predict and Loan Detail

**Files:**
- Create: `apps/web/src/pages/PredictPage.test.tsx`
- Create: `apps/web/src/pages/LoanDetailPage.test.tsx`
- Modify: `apps/web/src/pages/PredictPage.tsx`
- Modify: `apps/web/src/pages/LoanDetailPage.tsx`

- [ ] **Step 1: Write failing page-smoke tests for Predict and Loan Detail**

```tsx
// apps/web/src/pages/PredictPage.test.tsx
import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { PredictPage } from "./PredictPage";
import { renderPage } from "../test/render-page";

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual("../lib/api");
  return {
    ...actual,
    apiFetch: vi.fn().mockImplementation((path: string) => {
      if (path === "/datasets") {
        return Promise.resolve([{ id: "dataset-1", fileName: "loan-book-q1.csv" }]);
      }
      if (path.includes("/preview")) {
        return Promise.resolve({ preview: [], mapping: {}, columns: [], rowCount: 0, status: "mapped", profileStatus: "completed", statsReady: true });
      }
      if (path === "/models") {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    }),
  };
});

const auth = {
  session: {
    token: "token",
    user: { id: "u1", email: "analyst@example.com", fullName: "Ari Analyst", role: "ADMIN" as const, tenantId: "tenant-1" },
  },
  setSession: () => {},
};

describe("PredictPage", () => {
  it("shows the underwriting desk heading", async () => {
    renderPage(<PredictPage auth={auth} />);
    await waitFor(() => expect(screen.getByText(/underwriting desk/i)).toBeInTheDocument());
  });
});
```

```tsx
// apps/web/src/pages/LoanDetailPage.test.tsx
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "../lib/theme-provider";
import { AccessibilityProvider } from "../lib/accessibility/AccessibilityProvider";
import { UndoProvider } from "../lib/undo-provider";
import { ToastProvider } from "../components/ui/molecules/Toast";
import { LoanDetailPage } from "./LoanDetailPage";

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual("../lib/api");
  return {
    ...actual,
    apiFetch: vi.fn().mockResolvedValue({
      id: "loan-1",
      probability: 0.82,
      reviewStatus: "pending",
      decision: null,
      createdAt: "2026-04-21T10:00:00.000Z",
      features: { applicant_name: "Maya Patel", loan_amount: 250000 },
      explanation: { topContributors: [] },
      modelVersion: { family: "Gradient Boosting", metrics: { rocAuc: 0.91 } },
    }),
  };
});

const auth = {
  session: {
    token: "token",
    user: { id: "u1", email: "analyst@example.com", fullName: "Ari Analyst", role: "ADMIN" as const, tenantId: "tenant-1" },
  },
  setSession: () => {},
};

describe("LoanDetailPage", () => {
  it("shows the case summary heading", async () => {
    render(
      <MemoryRouter initialEntries={["/app/loan/loan-1"]}>
        <ThemeProvider defaultTheme="light">
          <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
            <ToastProvider>
              <AccessibilityProvider>
                <UndoProvider>
                  <Routes>
                    <Route path="/app/loan/:id" element={<LoanDetailPage auth={auth} />} />
                  </Routes>
                </UndoProvider>
              </AccessibilityProvider>
            </ToastProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/case summary/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run the Predict and Loan Detail tests and verify they fail**

Run: `npm run test -w apps/web -- src/pages/PredictPage.test.tsx src/pages/LoanDetailPage.test.tsx`

Expected: FAIL because the current page copy does not expose the new "Underwriting desk" and "Case summary" headings.

- [ ] **Step 3: Implement the Predict and Loan Detail redesign**

```tsx
// apps/web/src/pages/PredictPage.tsx
<div className="space-y-8">
  <SectionTitle
    eyebrow="Decisioning"
    title="Underwriting desk"
    description="Prepare a single application or batch portfolio, then review model output in an executive decision frame."
  />
  <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
    <Card border padded>{/* existing applicant + loan detail inputs */}</Card>
    <Card border padded>{/* existing decision matrix with calmer hierarchy */}</Card>
  </section>
</div>
```

```tsx
// apps/web/src/pages/LoanDetailPage.tsx
<div className="space-y-8">
  <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
    <Card border padded>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-muted))]">Case summary</p>
      <h1 className="mt-2 text-2xl font-semibold text-[rgb(var(--text-strong))]">{loanName}</h1>
      {/* status, confidence, and identity summary */}
    </Card>
    <Card border padded>{/* decision console stays functionally identical */}</Card>
  </section>
  {/* explanation, recent decisions, and audit trail keep existing data but use the new layout */}
</div>
```

- [ ] **Step 4: Re-run the Predict and Loan Detail tests**

Run: `npm run test -w apps/web -- src/pages/PredictPage.test.tsx src/pages/LoanDetailPage.test.tsx`

Expected: PASS with both pages rendered in the new executive layout.

- [ ] **Step 5: Commit the Predict and Loan Detail work**

```bash
git add -- \
  apps/web/src/pages/PredictPage.tsx \
  apps/web/src/pages/LoanDetailPage.tsx \
  apps/web/src/pages/PredictPage.test.tsx \
  apps/web/src/pages/LoanDetailPage.test.tsx
git commit -m "feat(web): redesign prediction and case review pages"
```

## Task 7: Redesign Admin and Profile, then tighten responsive behavior

**Files:**
- Create: `apps/web/src/pages/AdminPage.test.tsx`
- Create: `apps/web/src/pages/ProfilePage.test.tsx`
- Modify: `apps/web/src/pages/AdminPage.tsx`
- Modify: `apps/web/src/pages/ProfilePage.tsx`
- Modify: `apps/web/src/index.css`
- Modify: `apps/web/src/components/layout.tsx`

- [ ] **Step 1: Write failing smoke tests for Admin and Profile**

```tsx
// apps/web/src/pages/AdminPage.test.tsx
import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { AdminPage } from "./AdminPage";
import { renderPage } from "../test/render-page";

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual("../lib/api");
  return {
    ...actual,
    apiFetch: vi.fn().mockImplementation((path: string) => {
      if (path === "/telemetry") {
        return Promise.resolve({
          services: [],
          systemUsage: { cpu: 0.34, memory: 0.52 },
          users: [],
        });
      }
      return Promise.resolve([]);
    }),
  };
});

const auth = {
  session: {
    token: "token",
    user: { id: "u1", email: "analyst@example.com", fullName: "Ari Analyst", role: "ADMIN" as const, tenantId: "tenant-1" },
  },
  setSession: () => {},
};

describe("AdminPage", () => {
  it("shows the operations control center heading", async () => {
    renderPage(<AdminPage auth={auth} />);
    await waitFor(() => expect(screen.getByText(/operations control center/i)).toBeInTheDocument());
  });
});
```

```tsx
// apps/web/src/pages/ProfilePage.test.tsx
import { describe, expect, it } from "vitest";
import { ProfilePage } from "./ProfilePage";
import { renderPage } from "../test/render-page";

const auth = {
  session: {
    token: "token",
    user: { id: "u1", email: "analyst@example.com", fullName: "Ari Analyst", role: "ADMIN" as const, tenantId: "tenant-1" },
  },
  setSession: () => {},
};

describe("ProfilePage", () => {
  it("shows grouped appearance, account, and notification sections", () => {
    renderPage(<ProfilePage auth={auth} />);
    expect(screen.getByText(/appearance/i)).toBeInTheDocument();
    expect(screen.getByText(/account/i)).toBeInTheDocument();
    expect(screen.getByText(/notifications/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the Admin and Profile tests and verify they fail**

Run: `npm run test -w apps/web -- src/pages/AdminPage.test.tsx src/pages/ProfilePage.test.tsx`

Expected: FAIL because the current Admin page still uses "Command & Control" copy and the current Profile page hides its grouping behind tabs.

- [ ] **Step 3: Implement the Admin/Profile redesign and responsive cleanup**

```tsx
// apps/web/src/pages/AdminPage.tsx
<div className="space-y-8">
  <SectionTitle
    eyebrow="Operations"
    title="Operations control center"
    description="Review service health, regulated user access, and audit activity with clearer separation between telemetry and action surfaces."
  />
  <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
    <Card border padded>{/* service telemetry */}</Card>
    <Card border padded>{/* user and security summary */}</Card>
  </section>
</div>
```

```tsx
// apps/web/src/pages/ProfilePage.tsx
<div className="space-y-8">
  <SectionTitle
    eyebrow="Account"
    title="Profile and appearance"
    description="Manage appearance, account details, and notification preferences in a single calm settings surface."
  />
  <section className="grid gap-4 xl:grid-cols-[320px_1fr]">
    <Card border padded>{/* identity summary */}</Card>
    <div className="space-y-4">
      <Card border padded>{/* appearance block */}</Card>
      <Card border padded>{/* account block */}</Card>
      <Card border padded>{/* notifications block */}</Card>
    </div>
  </section>
</div>
```

```css
/* apps/web/src/index.css */
@media (max-width: 1024px) {
  .decision-engine-grid {
    padding-inline: 1rem;
  }

  .table-mobile-stack {
    display: block;
  }
}
```

```tsx
// apps/web/src/components/layout.tsx
<motion.aside className="hidden xl:flex xl:w-[280px] xl:flex-col">
  {/* keep mobile drawer, but reduce header crowding on tablet */}
</motion.aside>
```

- [ ] **Step 4: Re-run the Admin and Profile tests**

Run: `npm run test -w apps/web -- src/pages/AdminPage.test.tsx src/pages/ProfilePage.test.tsx`

Expected: PASS with the new headings and grouped settings layout.

- [ ] **Step 5: Commit the Admin/Profile and responsive pass**

```bash
git add -- \
  apps/web/src/pages/AdminPage.tsx \
  apps/web/src/pages/ProfilePage.tsx \
  apps/web/src/index.css \
  apps/web/src/components/layout.tsx \
  apps/web/src/pages/AdminPage.test.tsx \
  apps/web/src/pages/ProfilePage.test.tsx
git commit -m "feat(web): redesign admin, profile, and responsive polish"
```

## Task 8: Run full verification and ship the redesign branch cleanly

**Files:**
- Verify: `apps/web/src`

- [ ] **Step 1: Run the full web test suite**

Run: `npm run test -w apps/web`

Expected: PASS with all component tests, theme tests, and page-smoke tests green.

- [ ] **Step 2: Run the production build**

Run: `npm run build -w apps/web`

Expected: PASS with a clean Vite build and no TypeScript or Tailwind regressions.

- [ ] **Step 3: Run the contrast check and manual viewport sweep**

Run: `npx tsx apps/web/src/tests/run-contrast-check.ts`

Expected: PASS with no contrast failures in the updated theme system.

Manual QA routes:

- `/auth`
- `/app/dashboard`
- `/app/datasets`
- `/app/models`
- `/app/predict`
- `/app/loan/<existing-id>`
- `/app/admin`
- `/app/profile`

Viewport checklist:

- 1440px desktop: summary bands, tables, and side panels feel balanced
- 1024px tablet: headers do not crowd actions and tables remain readable
- 390px mobile: nav drawer works, metrics stack cleanly, primary actions remain visible

- [ ] **Step 4: Verify the worktree is clean after all task-level commits**

```bash
git status --short
```

Expected: no output beyond intentionally untracked documentation or review artifacts. If this command shows modified web files, finish the missing task-level commit before asking for review.
