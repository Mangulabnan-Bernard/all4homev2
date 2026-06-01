# All4Home V2 — Verified Stack Cheatsheet

> Ground-truth APIs extracted from the **installed** packages & local `node_modules/next/dist/docs`
> (not training data). Every code file in this repo MUST conform to this. When in doubt, re-read the
> package's `.d.ts`. Installed: Next **16.2.6**, React **19.2.4**, next-auth **5.0.0-beta.31**,
> @prisma/client **7.8.0**, zod **3.25.76**, tailwindcss **4.3.0**, lucide-react **1.17.0**,
> sonner **2.0.7**, Node **24**.

## Next.js 16 (App Router) — BREAKING vs older versions

- **`params` and `searchParams` are `Promise`s.** Page/layout components that use them must be `async`
  and `await` them:
  ```ts
  export default async function Page({ params, searchParams }: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
  }) {
    const { id } = await params;
  }
  ```
- **`cookies()`, `headers()`, `draftMode()` are `async`** — `const c = await cookies()`. Using them
  opts the route into dynamic rendering.
- **Route Handler** dynamic params are a Promise too:
  ```ts
  export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  }
  ```
  `req` is NOT a promise. Don't await it.
- **Middleware** (renamed "Proxy" internally, file is still `src/middleware.ts`): `export function
  middleware(req: NextRequest)` + `export const config = { matcher: [...] }`. Still fully supported.
- `redirect`, `notFound` from `next/navigation`. `revalidatePath`, `revalidateTag` from `next/cache`.
  `revalidatePath('/x/[id]', 'page')` REQUIRES the 2nd arg when the path has a dynamic segment.
- `NextRequest`/`NextResponse` from `next/server`. Type helpers `PageProps`, `LayoutProps`,
  `RouteContext`, `Metadata` from `next`.
- `fetch()` is NOT cached by default (`'auto'`). We mostly use Prisma, not fetch, so N/A.

## next-auth v5 (5.0.0-beta.31)

- Single source `src/auth.ts`: `export const { handlers, auth, signIn, signOut } = NextAuth({...})`.
- Route handler `src/app/api/auth/[...nextauth]/route.ts`:
  ```ts
  import { handlers } from "@/auth";
  export const { GET, POST } = handlers;
  ```
- Middleware: import `auth` from the **edge-safe** config and wrap. We use a 2-file split:
  `src/auth.config.ts` (edge-safe: providers list minus Credentials' bcrypt, callbacks, pages — NO
  PrismaAdapter, NO bcrypt) and `src/auth.ts` (Node: spreads config + adapter + Credentials authorize).
- Provider imports: `import Google from "next-auth/providers/google"`, `.../github`,
  `.../credentials`. `PrismaAdapter` from `@auth/prisma-adapter`.
- **Credentials `authorize(credentials, request)` receives UNVALIDATED input** → validate with Zod,
  return `User | null` (throwing anything but `CredentialsSignin` => 500).
- PrismaAdapter is compatible with `session: { strategy: "jwt" }` (sessions live in JWT, Account/User
  still in DB). `AUTH_SECRET` required.
- Module augmentation: `declare module "next-auth" { interface Session { user: { id; role; ... } } }`
  and `declare module "next-auth/jwt" { interface JWT { id; role; ... } }`.
- `getServerSession` is REMOVED — use `auth()` everywhere.

## Prisma 7 (7.8.0) — REAL breaking changes (verified by running the CLI)

- **`datasource.url` is REMOVED from `schema.prisma`.** The block is just
  `datasource db { provider = "mysql" }`. The connection URL moves to **`prisma.config.ts`**
  (`defineConfig({ schema, datasource: { url: env("DATABASE_URL") }, migrations: { seed } })`).
- **The CLI does NOT auto-load `.env`** when `prisma.config.ts` is present. We call Node 24's native
  `process.loadEnvFile()` at the top of `prisma.config.ts` (wrapped in try/catch).
- **The runtime client REQUIRES a driver adapter** (no more built-in engine URL connection). We use
  `@prisma/adapter-mariadb` (`PrismaMariaDb`, MySQL-wire compatible) constructed from `DATABASE_URL`:
  ```ts
  import { PrismaClient } from "@prisma/client";
  import { PrismaMariaDb } from "@prisma/adapter-mariadb";
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!) });
  ```
- Generator unchanged: `generator client { provider = "prisma-client-js" }` → output
  `node_modules/@prisma/client`, `import { PrismaClient, Prisma } from "@prisma/client"`.
- Requires Node ≥ 20.19 / 22.12 / 24 (we have 24 ✓).
- `$transaction(async (tx) => {...}, { isolationLevel, timeout, maxWait })` and
  `$transaction([...])` (batch — isolationLevel only) unchanged.
- `$executeRaw` / `$queryRaw` tagged templates unchanged. Decimal columns return `Decimal` instances.
- `prisma generate` works offline (no DB). `prisma migrate dev` / `db push` need a live MySQL.

## Tailwind v4 (4.3.0) + shadcn/ui

- **Config-less / CSS-first.** Do NOT create `tailwind.config.js`. `globals.css` uses
  `@import "tailwindcss"` + `@theme inline { ... }`. `postcss.config.mjs` uses `@tailwindcss/postcss`.
- shadcn CSS variables (`--primary`, `--muted`, `--accent`, `--border`, `--ring`, etc.) are declared
  as CSS custom properties under `:root` / `.dark` and mapped in `@theme inline`.
- `src/lib/utils.ts` must export `cn = (...i) => twMerge(clsx(i))` (clsx + tailwind-merge).
- shadcn components are hand-authored here (no network); use `class-variance-authority` `cva`.

## zod 3.25.76

- **Use `z.string().email()` / `.url()` / `.uuid()`** — the top-level `z.email()` creator does NOT
  exist in v3.25. Schemas are `.strict()` to block mass-assignment.

## lucide-react 1.17.0 / sonner 2.0.7

- Named icon imports work: `import { Home, Bell } from "lucide-react"`.
- `import { Toaster, toast } from "sonner"`; import `sonner/dist/styles.css` once (in root layout).
