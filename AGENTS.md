<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Just Allah frontend agent instructions

This repository is the Next.js frontend for the Islamic sources RAG app. The current scaffold is a minimal App Router app created with `create-next-app` and should stay lean until later plan parts add the real user interface.

## Actual structure

- `app/page.tsx` is the current homepage entry point.
- `app/layout.tsx` defines the root layout and metadata.
- `app/globals.css` contains base styling.
- `package.json` uses Next.js 16, React 19, TypeScript, ESLint, and Tailwind v4.
- `public/` contains static assets shipped with the app.
- There is no custom component library or app-specific folder structure yet beyond the default App Router layout.

## Tooling and commands

- Run the app with `npm run dev`.
- Build with `npm run build`.
- Lint with `npm run lint`.
- Start the production build with `npm run start`.

## Conventions

- Keep the app in the App Router (`app/`) structure.
- Do not add a separate `src/` tree unless a later plan step explicitly requires it.
- Prefer simple, explicit components and page-level organization until the interface grows.
- Preserve the generated Next.js metadata pattern in `app/layout.tsx` unless intentionally replacing it.
- Keep the custom project rule set in this file rather than inventing a wider repo structure.

## Working style

- Match the current Next.js conventions and avoid introducing unrelated frameworks or patterns.
- Keep code minimal and focused on the later app requirements from the product plan.
- Do not add auth, backend calls, or heavy UI scaffolding until the project reaches the appropriate Part in the plan.

