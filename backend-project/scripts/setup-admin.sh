#!/bin/bash

# Script para crear usuario administrador
# Uso: ./setup-admin.sh [email] [password]

EMAIL=${1:-admin@travelbrain.com}
PASSWORD=${2:-Admin123!}

echo "🚀 Configurando usuario administrador..."
echo ""

cd "$(dirname "$0")/.." || exit 1

node scripts/setup-admin.js "$EMAIL" "$PASSWORD"
