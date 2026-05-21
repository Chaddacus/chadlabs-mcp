# bookkeeping.chadacus.dev — landing page

Single static HTML page served by `nginx:alpine` behind Traefik on the linode VPS.

## Deploy

```bash
# from your dev box (ssh host alias `linode` is in ~/.ssh/config)
scp -r infra/landing linode:/root/chad-prod/bookkeeping-mcp

# on the linode
ssh linode <<'EOF'
  cd /root/chad-prod/bookkeeping-mcp
  docker network ls | grep -q '\bweb\b' || { echo "FATAL: traefik web network missing"; exit 1; }
  docker compose pull
  docker compose up -d
  docker compose ps
EOF
```

## Verify

```bash
curl -I https://bookkeeping.chadacus.dev
# expect HTTP/2 200, server: nginx
```

## Update content

Edit `index.html`, scp the updated file, then:

```bash
ssh linode "cd /root/chad-prod/bookkeeping-mcp && docker compose restart bookkeeping-landing"
```

The container mounts `index.html` read-only — no rebuild needed.

## Verified pre-conditions (2026-05-21)

- Traefik on linode runs on the `web` docker network. Entrypoints are `http` (80) and `https` (443).
- Cert resolver `cloudflare` already provisioned `*.chadacus.dev` as a SAN of the apex `chadacus.dev` cert (via the `chadacus-secure` router on the `chadacus-site` container). We ride that cert.
- DNS for `bookkeeping.chadacus.dev` resolves to the linode IP via Cloudflare proxying (wildcard `*.chadacus.dev` is in place).

If any of those drift, edit `docker-compose.yml` labels accordingly — the labels are the only Traefik contract. The container itself is plain nginx serving a single HTML file.
