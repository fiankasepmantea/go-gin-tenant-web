# Deploying the web console

The console is a Next.js server (the `Dockerfile` builds a small standalone image). The browser only talks to this
server; this server talks to the Go API. Tokens never reach the browser.

```text
browser ──HTTPS──> reverse proxy ──HTTP──> web console (port 3000) ──HTTP──> Go API (port 8080)
```

## Settings

All settings are environment variables, read when the server starts. One image serves every environment.

| Variable | Default | Meaning |
|---|---|---|
| `API_URL` | `http://localhost:8080` | Base URL of the Go API, as the **web server** reaches it (a private address is fine) |
| `TENANT_BASE_DOMAIN` | empty | Turns on tenant by subdomain, for example `app.example.com` (see below) |
| `CSP_REPORT_ONLY` | `false` | `true` sends the Content-Security-Policy as report-only: violations are logged in the browser, nothing is blocked |
| `PORT`, `HOSTNAME` | `3000`, `0.0.0.0` | Where the server listens (set in the image) |

Do not put secrets in the image or in `NEXT_PUBLIC_*` variables. The console has no secrets of its own.

## Reverse proxy

The proxy ends TLS and **must set these headers, overwriting any value the client sent**:

- `X-Forwarded-Host`: the address the browser used. Subdomain mode reads the tenant from it.
- `X-Forwarded-For`: the browser's address. The console passes it to the API, which rate limits logins per address.
- `X-Forwarded-Proto`: `https`.

nginx example:

```nginx
upstream web {
    server web:3000;
}

server {
    listen 443 ssl;
    server_name app.example.com *.app.example.com;
    # ssl_certificate / ssl_certificate_key: a wildcard certificate when subdomain mode is on

    location / {
        proxy_pass http://web;
        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-Host  $host;
        proxy_set_header X-Forwarded-For   $remote_addr;   # overwrite, do not append, on the edge proxy
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Keep the Go API on a private network, reachable only from the web server (and your proxy). The API trusts the
address it is given; an API open to the internet would let a client choose its own address. Check how the API is
configured for trusted proxies (backend `docs/authentication.md`) before going live.

## Tenant by subdomain

With `TENANT_BASE_DOMAIN=app.example.com`, `https://acme.app.example.com` means tenant `acme` and the login form does
not ask for a code. You need:

1. DNS: a wildcard record `*.app.example.com` pointing to the proxy.
2. TLS: a wildcard certificate for `*.app.example.com` (DNS challenge with Let's Encrypt, cert-manager, or Caddy).
3. The proxy headers above.

Cookies are host-only, so each tenant address has its own session and its own language choice. Reserved names that
are never tenants: `www`, `api`, `admin`, `platform`.

## Password reset links

The e-mail link is built by the **API**. Set `PASSWORD_RESET_URL` in the API to the console's page:

```text
# subdomain mode
PASSWORD_RESET_URL=https://{tenant}.app.example.com/reset-password?token={token}
# one address for all tenants
PASSWORD_RESET_URL=https://app.example.com/reset-password?token={token}
```

The API also needs SMTP. Without it, the forgot-password form still answers "sent" (the API never says whether an
account exists) but no e-mail leaves.

## HTTPS and cookies

In production the session cookies are `Secure`, so the console must be served over HTTPS (browsers make an exception
for `http://localhost`). Over plain HTTP on another host, login appears to work but the session is lost.

## More than one replica

A refresh token can be used once, and the API revokes every session of a user when one is used twice. The console
shares one refresh between requests that arrive together, but it does so **in the memory of one process**. With
several replicas, two parallel requests can land on different replicas, refresh twice, and sign the user out.

Pick one:

- run **one** replica (enough for most installations); or
- route each browser to the same replica: nginx `hash $cookie_tc_refresh consistent;` in the `upstream` block, or
  your load balancer's cookie stickiness.

Moving the shared refresh to Redis would remove this limit; it is not built.

## Health check

`GET /login` answers 200 without calling the API. The image uses it for its `HEALTHCHECK`. A check that also needs the
API should call the API's own health endpoint instead.

## Before and after each release

- CI runs typecheck, lint, tests, build, `npm audit --omit=dev --audit-level=high` and a Docker build.
- Dependabot opens weekly update PRs (`.github/dependabot.yml`). A new Next.js major is a planned upgrade.
- When a new Content-Security-Policy source is needed (an analytics script, a font host), add it in
  `src/lib/csp.ts`, first with `CSP_REPORT_ONLY=true`.
