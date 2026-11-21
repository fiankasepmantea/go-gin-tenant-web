# Rules for AI assistants and contributors

Backend: https://github.com/fiankasepmantea/go-gin-tenant-template (its `docs/http-api.md` and `/openapi.json` are the API contract).

## Required

- Everything in this repository is written in English: code, comments, documentation, commit messages, pull request descriptions.
  The only exception is the UI text in `src/i18n/messages.ts`, which holds Indonesian and English side by side. Add every string to both.
- Follow `DESIGN.md` for colors, type, spacing and states. Do not add colors or fonts that are not in it.
- Tokens never reach the browser. Calls to the API go through `src/app/api/bff` (server side); the browser code in `src/lib/api.ts` only talks to the same origin.
- Branch on `error.code` of the API envelope, never on the message text.
- Every interactive target is at least 44px; every screen works at 375, 768 and 1280 px and in both themes.
- Run `npm run check` before finishing.

## Forbidden

- Reading, creating or committing real env files (`.env`, `.env.local`, ...). Only `*.example` files, without secrets.
- Storing tokens in `localStorage`, `sessionStorage` or any non-httpOnly cookie.
- Adding a dependency without a reason in the pull request description.
- Copying third-party designs, wordmarks, images or licensed fonts.
