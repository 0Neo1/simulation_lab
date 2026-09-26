#!/usr/bin/env bash
# Build ZeroLab and deploy it to an Ubuntu EC2 instance behind nginx.
#
# Usage: deploy/deploy.sh <host-ip> <path-to-pem> [ssh-user]
#   e.g. deploy/deploy.sh 3.231.223.17 ~/Downloads/zerolab.pem
#
# Requires locally: node/npm, ssh, scp, tar. Put REACT_APP_* values in .env
# before running (see .env.example). The instance's security group must allow
# inbound TCP 22 (from you) and 80 (from anywhere).
set -euo pipefail

HOST="${1:?host ip required}"
KEY="${2:?pem path required}"
USER_NAME="${3:-ubuntu}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SSH_OPTS=(-i "$KEY" -o StrictHostKeyChecking=accept-new)

chmod 600 "$KEY"
cd "$ROOT"

echo "==> Building"
[ -d node_modules ] || npm install --legacy-peer-deps
NODE_OPTIONS=--openssl-legacy-provider npm run build

echo "==> Uploading"
tar -czf /tmp/zerolab-build.tgz -C build .
scp "${SSH_OPTS[@]}" /tmp/zerolab-build.tgz deploy/nginx.conf "$USER_NAME@$HOST:/tmp/"

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
sudo cp /tmp/nginx.conf /etc/nginx/sites-available/zerolab
sudo ln -sf /etc/nginx/sites-available/zerolab /etc/nginx/sites-enabled/zerolab
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
rm -f /tmp/zerolab-build.tgz /tmp/nginx.conf
REMOTE

echo "==> Deployed: http://$HOST/"
