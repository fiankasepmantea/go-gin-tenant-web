# go-gin-tenant-web

Admin console for [go-gin-tenant-template](https://github.com/fiankasepmantea/go-gin-tenant-template), the Go multi-tenant
API. Next.js (App Router, TypeScript). Styles are plain CSS tokens that follow [DESIGN.md](DESIGN.md). Indonesian and
English are built in (switch in the sidebar and on the login page; the choice is stored in a cookie).

What it does today: sign in as a **tenant user**, list users (filters, pages), add a user, activate or deactivate,
delete, and import users from Excel (template download, dry run, then import).

This repository only holds the website. The mobile app (Flutter) will live in its own repository, and both talk to the
same API.

## Run it

Needs Node 20.9 or newer and the API running (in the backend repository: `make run`, default `http://localhost:8080`).
Develop in the same Linux or WSL shell as the backend, inside the Linux file system (not under `/mnt/c`).

```bash
cp .env.development.example .env.local   # .env.local is ignored by git
npm install                               # commit the generated package-lock.json once
npm run dev                               # http://localhost:3000
```

Sign in with the tenant code, username and password of a tenant user (backend `docs/getting-started.md`, section 5).
The user's group must be granted the endpoints the screens call (`GET/POST/PATCH/DELETE /api/v1/users`,
`/users/import`, `/users/import/template`, `GET /api/v1/groups`); a group created with `--all` has them. Without the
groups grant the table still works, but group names show as "…" and the group filter is empty.

| Command | Does |
|---|---|
| `npm run check` | typecheck, lint and build (what CI runs) |
| `npm run gen:api` | writes `src/lib/api-schema.d.ts` from the API's `/openapi.json` (set `OPENAPI_URL` for another address). Needs a POSIX shell (Linux, WSL, macOS) |

## The API contract

The backend builds `/openapi.json` (OpenAPI 3.0.3) from its code, so it cannot drift from the API. Run
`npm run gen:api` with the backend running and commit the result when the API changes. The types in
`src/lib/types.ts` are written by hand today; moving them to the generated schema is the next cleanup.
Stable rules from the backend's `docs/http-api.md`: every answer uses the envelope `{success, code, data}`; errors carry a stable
`error.code`; lists are paginated (`total_data`, `curr_page`, ...).

## How it talks to the API

The browser never calls the Go API and never sees a token.

```text
browser --same origin--> Next.js route handlers --server to server--> Go API (API_URL)
         cookies only     /api/auth/login|logout, /api/bff/*          Bearer token added here
```

- **Login** (`/api/auth/login`) sends the tenant code as `X-Tenant-Code` and stores the access and refresh tokens in
  `httpOnly`, `SameSite=Lax` cookies (`Secure` in production). The tenant code is also kept in a readable cookie so the
  sidebar can show it; it is not a secret.
- **Proxy** (`/api/bff/*`) only forwards `users`, `groups` and `auth/me`. It adds the bearer token, and on an expired
  access token it refreshes once and repeats the call. Other paths answer 404. Add a resource by extending `ALLOWED`
  in `src/app/api/bff/[...path]/route.ts`.
- **Why a proxy:** the API has no CORS middleware, and cookies keep tokens out of reach of scripts.
- **Refresh tokens are single use** and the API revokes all sessions when one is presented twice. Parallel requests
  would race, so refreshes are shared per token inside the Node process for 30 seconds. This is correct for one
  server process. With several replicas, use sticky sessions or move the shared map to Redis before scaling out.
- **Cross-site guard:** the proxy and the auth routes refuse a request whose `Origin` host differs from the request host.
- **Rate limiting:** the API limits failed logins per client address. The login route forwards `X-Forwarded-For`; set the
  trusted proxies of the API (backend `docs/authentication.md`) or every user will share the address of this server.
- Errors are shown by `error.code` (stable), never by message text; 5xx errors show the request id.

## Known limits

- Tenant users only. Platform admins (`/auth/platform/login`) are not supported here.
- The API filters by equality, so the user filter is an **exact** username, not a search box.
- Edit user (name, email, group) is not built yet.
- No automated tests yet. No Dockerfile yet (the build output is `standalone`, ready for one).

## Layout

```text
src/app/              pages and route handlers (login, (app)/users, api/auth, api/bff)
src/components/       UsersView, dialogs, shell, login form
src/i18n/             messages.ts (id + en, same keys enforced by the compiler) and the provider
src/lib/              api.ts (browser client), server.ts (cookies, refresh), constants.ts, types.ts
src/middleware.ts     redirects to /login when there is no session cookie
DESIGN.md             design system (check with: npx @google/design.md lint DESIGN.md)
CLAUDE.md             rules for contributors and AI assistants
```

Add a UI string in `src/i18n/messages.ts` for both languages; the build fails if one language is missing a key.
