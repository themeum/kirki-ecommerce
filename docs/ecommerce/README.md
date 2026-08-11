# Bruno API Client — Developer Setup

Guide for installing Bruno and running the **Kirki Ecommerce** API collection in this repo.

---

## Prerequisites

1. Local WordPress stack is running (see root [`README.md`](../../README.md)):

```bash
docker compose up -d --build
```

2. Default local site:

| Item | Value |
|------|--------|
| WordPress | http://localhost:20100 |
| Admin login | `admin` / `demo` |
| API base | `http://localhost:20100/wp-json/kirki/ecommerce/v1` |

---

## 1. Install Bruno

### macOS (Homebrew)

```bash
brew install --cask bruno
```

### Manual download

1. Open [https://www.usebruno.com/downloads](https://www.usebruno.com/downloads)
2. Download the installer for your OS
3. Install and launch Bruno

Bruno is a local-first API client. Collections live as files on disk (this repo already has one).

---

## 2. Locate the collection

The OpenCollection lives at:

```text
docs/ecommerce/
├── opencollection.yml          # collection root (Kirki Ecommerce)
├── .env.example                # credential / base URL template
├── environments/
│   └── kirki-ecommerce-env.yml # environment variables
├── products/
├── orders/
├── brands/
└── …                           # other resource folders
```

Do **not** open a single `.yml` request file. Open the **collection folder**.

---

## 3. Open the collection in Bruno

1. Launch Bruno
2. **Open Collection** (or **File → Open Collection**)
3. Select:

```text
<repo-root>/docs/ecommerce
```

4. You should see the collection named **Kirki Ecommerce** with folders such as Products, Brands, Orders, Settings, etc.

If the UI looks stale after a git pull that renamed files, close and reopen the collection.

---

## 4. Configure environment variables (`.env`)

Auth and `baseUrl` come from a local `.env` file next to `opencollection.yml`. Credentials are **not** committed.

### Create `.env`

```bash
cd docs/ecommerce
cp .env.example .env
```

### Edit `docs/ecommerce/.env`

```env
auth_username=admin
auth_password=demo
base_url=http://localhost:20100/wp-json/kirki/ecommerce/v1
```

| Variable | Purpose |
|----------|---------|
| `base_url` | REST API root (`{{baseUrl}}` in requests) |
| `auth_username` | WordPress user for Basic Auth |
| `auth_password` | That user’s password |

If you changed `NGINX_HTTP_PORT` or admin credentials in the project root `.env`, update these values to match.

> Keep `docs/ecommerce/.env` local. Root `.gitignore` already ignores `.env`.

---

## 5. Select the environment in Bruno

1. In Bruno, open the environment dropdown (top-right)
2. Choose **Kirki Ecommerce Env**

That environment maps:

```yaml
baseUrl        → {{process.env.base_url}}
auth_username  → {{process.env.auth_username}}
auth_password  → {{process.env.auth_password}}
```

Bruno loads `process.env.*` from `docs/ecommerce/.env`.

---

## 6. Auth (already wired)

Collection-level auth in `opencollection.yml`:

- Type: **Basic Auth**
- Username: `{{auth_username}}`
- Password: `{{auth_password}}`

Folders and requests use `auth: inherit`, so they pick this up automatically. You do **not** need to set auth on each request.

---

## 7. Smoke test

1. Confirm WordPress is up: http://localhost:20100
2. In Bruno, select environment **Kirki Ecommerce Env**
3. Open **App Config** → **App Config** (or **Test** → **Test API**)
4. Click **Send**

Expected: `200` JSON response.  
If you get `401`, check `.env` username/password.  
If you get connection errors, check Docker and `base_url`.

---

## 8. Day-to-day usage

1. Start Docker if needed: `docker compose up -d`
2. Open Bruno → collection `docs/ecommerce`
3. Ensure **Kirki Ecommerce Env** is selected
4. Run requests under the relevant folder (Products, Orders, Carts, …)

Request URLs look like:

```text
{{baseUrl}}/products
→ http://localhost:20100/wp-json/kirki/ecommerce/v1/products
```

---

## Troubleshooting

| Problem | What to check |
|---------|----------------|
| Collection won’t open | Select the `docs/ecommerce` folder (must contain `opencollection.yml`) |
| `{{baseUrl}}` empty / wrong host | `docs/ecommerce/.env` exists; env **Kirki Ecommerce Env** is selected |
| `401 Unauthorized` | `auth_username` / `auth_password` match a WP user with API access |
| Connection refused | `docker compose ps`; port matches `base_url` (default `20100`) |
| Env vars not updating | Restart Bruno or reopen the collection after editing `.env` |
| Folders/files look wrong after git pull | Close and reopen the collection |

---

## Optional: custom remote / staging

Point `.env` at another site:

```env
auth_username=your-user
auth_password=your-app-password-or-password
base_url=https://staging.example.com/wp-json/kirki/ecommerce/v1
```

Prefer an [Application Password](https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/) for non-local environments.
