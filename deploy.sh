#!/bin/bash
cd ~/webapps/2026-teamC/ || exit 1

output=$(git pull)

if [ "$output" = "Already up to date." ]; then
    echo "Already up to date."
else
    docker compose down
    docker compose up -d --build
    echo "Done"
fi
