#!/bin/sh
cp .env.example .env || true
docker compose up --build
