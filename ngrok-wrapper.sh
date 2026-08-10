#!/bin/bash
set -e

PORT=${1:-3000}
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

echo "[ngrok-wrapper] Résolution des hostnames ngrok (contournement DNS systemd-resolved)..."

# Résoudre tous les hostnames nécessaires via dig
NGROK_IPS=$(timeout 5 dig @8.8.8.8 connect.ngrok-agent.com A +short 2>/dev/null)
UPDATE_IPS=$(timeout 5 dig @8.8.8.8 update.ngrok-agent.com A +short 2>/dev/null | grep -v 'cname' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$')
CRL_IPS=$(timeout 5 dig @8.8.8.8 crl.ngrok-agent.com A +short 2>/dev/null)

# Fallback: utiliser la résolution via le stub si dig échoue
if [ -z "$NGROK_IPS" ]; then
    NGROK_IPS=$(timeout 5 host connect.ngrok-agent.com 2>/dev/null | grep "has address" | awk '{print $4}')
fi
if [ -z "$CRL_IPS" ]; then
    CRL_IPS=$(timeout 5 host crl.ngrok-agent.com 2>/dev/null | grep "has address" | awk '{print $4}')
fi
if [ -z "$UPDATE_IPS" ]; then
    UPDATE_IPS=$(timeout 5 host update.ngrok-agent.com 2>/dev/null | grep "has address" | awk '{print $4}' | head -1)
fi

echo "[ngrok-wrapper] connect.ngrok-agent.com: $(echo $NGROK_IPS | tr '\n' ' ')"
echo "[ngrok-wrapper] crl.ngrok-agent.com: $(echo $CRL_IPS | tr '\n' ' ')"
echo "[ngrok-wrapper] update.ngrok-agent.com: $(echo $UPDATE_IPS | tr '\n' ' ')"

# Créer /etc/hosts custom
{
    echo "127.0.0.1 localhost"
    echo "::1 localhost ip6-localhost ip6-loopback"
    for ip in $NGROK_IPS; do
        echo "$ip connect.ngrok-agent.com"
    done
    for ip in $UPDATE_IPS; do
        echo "$ip update.ngrok-agent.com"
    done
    for ip in $CRL_IPS; do
        echo "$ip crl.ngrok-agent.com"
    done
} > "$TMPDIR/hosts"

# Créer /etc/resolv.conf custom (fallback DNS public)
{
    echo "nameserver 8.8.8.8"
    echo "nameserver 1.1.1.1"
} > "$TMPDIR/resolv.conf"

exec 3< "$TMPDIR/resolv.conf"
exec 4< "$TMPDIR/hosts"

echo "[ngrok-wrapper] Lancement de ngrok via bwrap (namespace DNS corrigé)..."
exec bwrap --unshare-all --share-net --bind / / \
    --bind-data 3 /etc/resolv.conf \
    --bind-data 4 /etc/hosts \
    --proc /proc --dev /dev \
    ngrok http "$PORT" --log=stdout
