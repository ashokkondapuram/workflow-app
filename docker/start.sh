#!/bin/sh
set -e

uvicorn app.main:app --host 127.0.0.1 --port 8011 &
exec nginx -g "daemon off;"
