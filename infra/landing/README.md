# bookkeeping.chadacus.dev — landing page

Single static HTML page served by `nginx:alpine` behind Traefik on the linode VPS.

## Deploy

```bash
# from your dev box
scp -r infra/landing root@linode:/opt/sites/bookkeeping-mcp

# on the linode
ssh root@linode <<'EOF'
  cd /opt/sites/bookkeeping-mcp
  docker network ls | grep -q traefik_proxy || echo "WARNING: traefik_proxy network missing"
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
ssh root@linode "cd /opt/sites/bookkeeping-mcp && docker compose restart bookkeeping-landing"
```

The container mounts `index.html` read-only — no rebuild needed.

## Assumptions

- linode VPS already has Traefik v3.x running on the `traefik_proxy` Docker network.
- Cloudflare cert resolver named `cloudflare` is configured for `*.chadacus.dev` wildcard.
- DNS A record `bookkeeping.chadacus.dev` → linode IP exists (or wildcard `*.chadacus.dev` covers it).

If any of those are off, edit `docker-compose.yml` accordingly — the labels are the only Traefik
contract. The container itself is just nginx serving a single HTML file.
