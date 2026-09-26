#!/usr/bin/env bash
# Build ZeroLab and deploy it to an Ubuntu EC2 instance behind nginx.
#
# Usage: deploy/deploy.sh <host-ip> <path-to-pem> [ssh-user]
#   e.g. deploy/deploy.sh 3.231.223.17 ~/Downloads/zerolab.pem
#
# Requires locally: node/npm, ssh, scp, tar. The instance's security group
# must allow inbound TCP 22 (from you) and 80 (from anywhere).
#
# Gemini key: set GEMINI_API_KEY (and optionally GEMINI_MODEL) in your shell
# or in .env. It is uploaded to /etc/nginx/zerolab/gemini.conf (root-only)
# and injected by nginx; it is never compiled into the frontend bundle.
# If unset, an existing key on the server is kept.
set -euo pipefail

HOST="${1:?host ip required}"
KEY="${2:?pem path required}"
USER_NAME="${3:-ubuntu}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SSH_OPTS=(-i "$KEY" -o StrictHostKeyChecking=accept-new)

chmod 600 "$KEY"
cd "$ROOT"

# Load GEMINI_* from .env if not already set in the environment.
if [ -f .env ]; then
  : "${GEMINI_API_KEY:=$(sed -n 's/^GEMINI_API_KEY=//p' .env | tail -1)}"
  : "${GEMINI_MODEL:=$(sed -n 's/^GEMINI_MODEL=//p' .env | tail -1)}"
fi
GEMINI_MODEL="${GEMINI_MODEL:-gemini-3.1-pro-preview}"
if grep -q '^REACT_APP_GEMINI_API_KEY=' .env 2>/dev/null; then
  echo "ERROR: REACT_APP_GEMINI_API_KEY in .env would be compiled into the public bundle." >&2
  echo "       Rename it to GEMINI_API_KEY." >&2
  exit 1
fi
if [ -n "${GEMINI_API_KEY:-}" ] && ! [[ "$GEMINI_API_KEY" =~ ^[A-Za-z0-9_-]+$ ]]; then
  echo "ERROR: GEMINI_API_KEY contains unexpected characters" >&2; exit 1
fi
if ! [[ "$GEMINI_MODEL" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "ERROR: GEMINI_MODEL contains unexpected characters" >&2; exit 1
fi

echo "==> Building"
[ -d node_modules ] || npm install --legacy-peer-deps
NODE_OPTIONS=--openssl-legacy-provider npm run build

echo "==> Uploading"
tar -czf /tmp/zerolab-build.tgz -C build .
scp "${SSH_OPTS[@]}" /tmp/zerolab-build.tgz deploy/nginx.conf "$USER_NAME@$HOST:/tmp/"
rm -f /tmp/zerolab-build.tgz
if [ -n "${GEMINI_API_KEY:-}" ]; then
  SECRET="$(umask 077; mktemp)"
  printf 'set $gemini_key "%s";\nset $gemini_model "%s";\n' "$GEMINI_API_KEY" "$GEMINI_MODEL" > "$SECRET"
  scp "${SSH_OPTS[@]}" "$SECRET" "$USER_NAME@$HOST:/tmp/zerolab-gemini.conf"
  rm -f "$SECRET"
else
  echo "    (GEMINI_API_KEY not set; keeping any key already on the server)"
fi

echo "==> Installing on $HOST"
ssh "${SSH_OPTS[@]}" "$USER_NAME@$HOST" 'bash -s' <<'REMOTE'
set -euo pipefail
if ! command -v nginx >/dev/null; then
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nginx
fi
sudo rm -rf /var/www/zerolab.new
sudo mkdir -p /var/www/zerolab.new
sudo tar -xzf /tmp/zerolab-build.tgz -C /var/www/zerolab.new
sudo rm -rf /var/www/zerolab.old
[ -d /var/www/zerolab ] && sudo mv /var/www/zerolab /var/www/zerolab.old
sudo mv /var/www/zerolab.new /var/www/zerolab
sudo chown -R www-data:www-data /var/www/zerolab
sudo install -d -m 700 -o root -g root /etc/nginx/zerolab
if [ -f /tmp/zerolab-gemini.conf ]; then
  sudo install -m 600 -o root -g root /tmp/zerolab-gemini.conf /etc/nginx/zerolab/gemini.conf
  rm -f /tmp/zerolab-gemini.conf
elif [ ! -f /etc/nginx/zerolab/gemini.conf ]; then
  printf 'set $gemini_key "";\nset $gemini_model "gemini-3.1-pro-preview";\n' \
    | sudo tee /etc/nginx/zerolab/gemini.conf >/dev/null
  sudo chmod 600 /etc/nginx/zerolab/gemini.conf
  echo "WARNING: no Gemini key configured; Prompt Simulator will return 503"
fi
sudo cp /tmp/nginx.conf /etc/nginx/sites-available/zerolab
sudo ln -sf /etc/nginx/sites-available/zerolab /etc/nginx/sites-enabled/zerolab
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
rm -f /tmp/zerolab-build.tgz /tmp/nginx.conf
REMOTE

echo "==> Deployed: http://$HOST/"
