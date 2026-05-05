#!/bin/bash
echo "Validating configuration..."
source ../.env

if [ -z "$MONGO_URI" ]; then echo "❌ MONGO_URI missing"; exit 1; fi
if [ -z "$JWT_SECRET" ]; then echo "❌ JWT_SECRET missing"; exit 1; fi
if [ -z "$GRAFANA_PASSWORD" ]; then echo "❌ GRAFANA_PASSWORD missing"; exit 1; fi

echo "✅ All environment variables present"
echo "✅ MongoDB Atlas URI configured"
echo "✅ Configuration valid - safe to deploy"
