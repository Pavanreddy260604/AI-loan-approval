# Executive Banking UI Redesign

Date: 2026-04-21
Status: Approved for implementation planning
Owner: Codex + user
Scope: `apps/web`

## 1. Summary

Redesign the full web application into a premium dual-theme product with equal quality in light and dark mode. The redesign will keep the existing routes, backend contracts, and core workflows, but it will upgrade the visual system, page composition, responsive behavior, and shared UI primitives so the product feels consistent, calm, and expensive across every major screen.

The chosen direction is:

- Brand direction: `Executive Banking`
- Redesign depth: `Layout refresh`
- Coverage: `Everything evenly`

## 2. Goals

- Make both light and dark mode feel intentionally designed rather than one mode plus overrides.
- Replace the current mixed aesthetic with a cohesive high-trust, banking-grade visual language.
- Improve layout hierarchy across all main pages without changing the product's underlying job to be done.
- Standardize cards, tables, forms, metrics, navigation, and empty states around a shared system.
- Improve mobile and tablet behavior for dense operational screens.

## 3. Non-Goals

- No backend API changes.
- No route restructuring.
- No workflow rewrites that change the product's business logic.
- No new feature scope unrelated to the redesign.
- No visual direction that leans into neon "AI console" styling.

## 4. Product Tone

The application should feel like an internal decisioning platform used by a high-end financial institution. The tone is calm, credible, precise, and premium. It should suggest strong governance and data confidence rather than experimentation or consumer fintech playfulness.

The interface should communicate:

- trust through restraint
- intelligence through clarity
- speed through structure
- sophistication through finish

## 5. Visual System

### 5.1 Theme Strategy

The application will support two first-class themes with shared structure and different palettes:

- `Light theme`: warm ivory page background, paper-white surfaces, stone borders, ink-heavy typography, restrained blue accent, soft shadowing.
- `Dark theme`: navy-charcoal foundation, layered panel surfaces, softened borders, quieter highlights, and high readability without pure-black harshness.

Theme parity requirement:

- both themes must use the same spacing, layout, elevation, and component behavior
- both themes must feel premium on their own
- neither theme should appear to be a fallback version of the other

### 5.2 Typography

Typography should move away from the default general-purpose SaaS feel.

- Primary UI font: refined sans-serif with better character and trust cues
- Numeric and ID font: disciplined mono used only for metrics, identifiers, and technical values
- Headings: strong but not oversized; editorial, compact, and deliberate
- Labels: clearer, less noisy uppercase usage; reserve heavy tracking for metadata only

### 5.3 Color and Contrast

The redesign will reduce color noise and rely more on contrast, spacing, and surface hierarchy.

- One primary brand accent for navigation, active states, and primary actions
- Semantic colors tuned down for executive dashboards rather than developer tooling
- Higher contrast for core reading surfaces
- Lower saturation for default borders and secondary controls

### 5.4 Elevation and Surfaces

Surface hierarchy should be clearer and more refined.

- Page background defines the environment
- Panel background defines working surfaces
- Raised panels define key modules or sticky controls
- Hover and active states create motion and tactile depth without flashy glow

Cards should feel like report panels, not generic rounded containers.

### 5.5 Motion

Motion should be subtle and purposeful.

- page transitions: soft fade/slide
- card hover: small lift or border emphasis
- state changes: restrained highlight shifts
- loading: calmer skeletons and progress behavior

Pulsing and animated attention-grabbing effects should be limited to genuine live states or urgent alerts.

## 6. Information Architecture and Shell

### 6.1 App Shell

The shell becomes the product anchor.

- Sidebar: slimmer, sharper, more premium navigation rail with stronger active state treatment
- Header: cleaner top bar with notifications, theme toggle, and profile controls aligned to the banking tone
- Page frame: more deliberate page titles, subtitles, spacing, and section rhythm
- Mobile nav: drawer with calmer spacing and more stable touch targets

### 6.2 Layout Rules

The product will use consistent page composition rules:

- hero or summary band first
- primary work area second
- supporting analytics or history third
- side panels only when they materially improve focus

This avoids the current mix of dense cards, scattered metrics, and inconsistent headers.

## 7. Shared Component Architecture

Implementation will be system-first. The redesign should begin with shared primitives and theme tokens, then flow outward into pages.

### 7.1 Token Layer

Refine the token system in `apps/web/src/index.css`, `apps/web/src/lib/design-tokens`, and supporting Tailwind theme config.

The token layer should explicitly define:

- background stack per theme
- text hierarchy per theme
- border hierarchy per theme
- accent and semantic color behavior
- shadow/elevation levels
- radius scale
- spacing scale

### 7.2 Shared Primitives

The redesign should update these reusable primitives before major page rewrites:

- buttons
- badges
- inputs
- selects
- cards
- tables
- modal/drawer surfaces
- notices and error states
- metric cards

### 7.3 Component Rules

- Primary actions should feel confident but not loud
- Secondary actions should read as refined utility controls
- Filters should be compact and readable
- Form fields should be grouped by meaning, not just stacked mechanically
- Tables should emphasize clarity, row scanning, and action stability

## 8. Page-Level Design

### 8.1 Auth

Auth should feel premium and trustworthy rather than flashy or overly technical.

Changes:

- calmer background treatment
- stronger editorial hierarchy
- cleaner trust cues
- simplified decorative effects
- improved spacing around verification, reset, and notices

Result:

The auth flow should feel like entry into a secure financial workspace.

### 8.2 Dashboard

Dashboard becomes a portfolio overview and operational command surface.

Structure:

- summary band for platform health and review flow
- main pending-loans workspace as the core action area
- supporting panels for model readiness, recent decisions, and alerts
- guided premium empty state for first-run experience

Focus:

- stronger visual hierarchy
- less card clutter
- better scanability for queue actions
- improved metric framing in both themes

### 8.3 Datasets

Datasets becomes a guided onboarding and governance workspace.

List view:

- cleaner portfolio-style dataset table
- clearer lifecycle states
- stronger row actions

Upload and mapping:

- left side for schema review and data visibility
- right side sticky control panel for decisions and completion status
- more deliberate multi-step progression

### 8.4 Models

Models becomes a model portfolio page rather than a plain utility listing.

Structure:

- featured champion/active model summary
- version and training history below
- performance metrics grouped in report-style panels
- clearer distinction between ready, training, and failed states

### 8.5 Predict

Predict becomes an underwriting desk.

Single prediction:

- clearer left-column grouping for applicant identity, loan details, and model features
- stronger right-column executive summary for decision, confidence, explanation, and fraud signals
- improved visual separation between input and analysis

Batch prediction:

- dedicated upload workspace with clearer job state visibility
- calmer presentation of progress and download actions

### 8.6 Loan Detail

Loan detail becomes a case file.

- identity and status summary at top
- explanation and fraud detail grouped cleanly
- history and metadata presented in supporting panels
- better typography for metrics and traceability

### 8.7 Admin

Admin becomes an operations control center.

- clearer grouping by operational function
- stronger distinction between monitoring panels and destructive controls
- better alignment with the executive system styling

### 8.8 Profile

Profile becomes a premium settings page.

- grouped account, security, and appearance sections
- more stable form layout
- theme controls that feel native to the rest of the shell

## 9. Responsive Behavior

Responsive behavior is part of the redesign, not a cleanup pass.

### 9.1 Desktop

- preserve the executive console feel
- keep stable side navigation
- use wider grid compositions for overview and work surfaces

### 9.2 Tablet

- reduce visual clutter
- stack sections without losing order
- keep important filters and actions visible

### 9.3 Mobile

- simplify page headers
- stack metrics and controls more aggressively
- reduce horizontal overflow in dense areas
- stabilize button placement
- ensure mapping, tables, and review screens remain usable rather than merely compressed

## 10. Data Flow and Behavioral Boundaries

This redesign does not alter business workflows, but it does change how they are presented.

Behavioral rules:

- existing queries, mutations, and route flows stay intact
- state management remains in place unless small local cleanup is needed to support layout changes
- component APIs may be refined if required for consistent theming, but feature behavior should remain unchanged

Page data flow should remain:

- Dashboard: fetch and act on live operational data
- Datasets: upload, preview, map, and trigger training
- Models: monitor portfolio and versions
- Predict: submit single/batch predictions and display results
- Loan detail/Admin/Profile: preserve current data contracts and user actions

## 11. Error, Empty, and Loading States

These states should be redesigned with the same premium system instead of default utility styling.

### 11.1 Loading

- calmer skeleton rhythm
- consistent panel skeleton layouts
- less visual noise during data fetches

### 11.2 Empty States

- more guided and polished
- focused explanation of next best action
- avoid generic "nothing here" treatment

### 11.3 Errors

- high clarity, lower panic
- semantic emphasis without aggressive red overload
- actions should remain stable and legible

## 12. Accessibility and Quality Bar

The redesign must preserve or improve accessibility.

- maintain accessible contrast in both themes
- preserve visible focus treatment
- maintain keyboard reachability
- ensure touch targets remain usable on mobile
- keep reduced-motion support intact

The premium look cannot come at the cost of usability.

## 13. Implementation Sequence

Recommended sequence:

1. Rework theme tokens and global surface rules
2. Redesign shared primitives and shell
3. Update page framing and headers
4. Redesign all major pages using the new system
5. Finish responsive refinements
6. Polish empty, loading, and error states
7. Run visual and functional verification

## 14. Validation and Testing

Implementation should be verified at three levels.

### 14.1 Visual Verification

- compare light and dark parity on every major page
- verify premium consistency across cards, forms, tables, nav, and modals
- check spacing rhythm at desktop, tablet, and mobile sizes

### 14.2 Functional Verification

- auth flows still work
- dashboard actions still work
- dataset upload/mapping/training still work
- prediction flows still work
- navigation and theme switching still work

### 14.3 Accessibility Verification

- contrast review for both themes
- focus state review
- keyboard review for shell, menus, tables, and forms
- reduced motion review

## 15. Acceptance Criteria

The redesign is successful when:

- the product feels like one cohesive premium system
- light and dark mode feel equally intentional
- navigation, page framing, and component behavior are consistent
- major workflows are clearer and calmer without changing logic
- responsive behavior is visibly improved on dense pages
- the app looks trustworthy and expensive rather than generic or flashy

## 16. File Targets

Expected implementation touchpoints include:

- `apps/web/src/index.css`
- `apps/web/tailwind.config.js`
- `apps/web/src/lib/design-tokens/index.ts`
- `apps/web/src/components/layout.tsx`
- shared UI primitives under `apps/web/src/components/ui`
- page files under `apps/web/src/pages`

No backend service changes are required for this redesign.
