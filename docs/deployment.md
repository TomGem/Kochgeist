# Deployment

## Docker (recommended)

### Prerequisites

- Docker and Docker Compose

### Quick Start

```sh
cp .env.example .env
# Edit .env with your API keys, SMTP settings, and APP_URL
docker compose up -d --build
```

The app starts at `http://localhost:4321`. The first user to register becomes the admin.

### What's in the Stack

- **Single container** running the Astro Node.js server
- **Named volume** (`kochgeist-data`) persists the SQLite database and generated images
- **Auto-restart** (`unless-stopped`) -- survives host reboots
- Database migrations run automatically on container start

### Configuration

All configuration is done via environment variables in `.env`. See the [README](../README.md#environment-variables) for the full list.

Key settings for production:

| Variable | Notes |
|----------|-------|
| `APP_URL` | Set to your public URL (e.g. `https://kochgeist.example.com`) -- used in email links |
| `AI_PROVIDER` | Choose your AI backend |
| `IMAGE_PROVIDER` | `azure` for real images, `placeholder` for colored placeholders |
| `SMTP_*` | Required for email verification and password reset in production |

### Custom Port

To change the exposed port, edit `docker-compose.yml`:

```yaml
ports:
  - "8080:4321"  # host:container
```

### Reverse Proxy

For production, put the container behind a reverse proxy (nginx, Caddy, Traefik) that handles TLS.

Example nginx config:

```nginx
server {
    listen 443 ssl;
    server_name kochgeist.example.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:4321;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Backup

The SQLite database and images live in the `kochgeist-data` Docker volume.

To back up:

```sh
# Find the volume mount point
docker volume inspect kochgeist_kochgeist-data

# Or copy directly from the container
docker cp $(docker compose ps -q kochgeist):/app/data ./backup
```

### Updating

```sh
git pull
docker compose up -d --build
```

The container runs `drizzle-kit push` on startup, so schema migrations are applied automatically.

---

## Manual Deployment

### Prerequisites

- Node.js >= 22.12.0

### Build

```sh
npm install
cp .env.example .env   # configure environment
npm run db:push         # create/migrate the database
npm run build           # produces dist/
```

### Run

```sh
node dist/server/entry.mjs
```

The server listens on `0.0.0.0:4321` by default. Set `HOST` and `PORT` environment variables to change this.

### Process Manager

Use a process manager like systemd or PM2 to keep the app running:

```sh
# PM2
pm2 start dist/server/entry.mjs --name kochgeist
pm2 save
pm2 startup
```

### Data Directory

The app stores its SQLite database and generated images in `data/` relative to the working directory. Ensure this directory is:

- Writable by the Node.js process
- Included in your backup strategy
- On persistent storage (not a tmpfs)
