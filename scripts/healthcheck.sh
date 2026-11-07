#!/bin/sh
# Bind wildcard addresses use loopback; IPv6 URL authorities require brackets (RFC 3986).
set -eu
host=${KIOSK_HOST:-0.0.0.0}
case "$host" in 0.0.0.0) host=127.0.0.1;; ::) host=::1;; esac
case "$host" in \[*\]) ;; *:*) host="[$host]";; esac
exec wget -q -T 3 -O /dev/null "http://$host:${PORT:-8080}/healthz"
