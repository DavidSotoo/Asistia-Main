#!/bin/bash

# Script para iniciar la base de datos PostgreSQL con Docker
# Uso: ./db-start.sh

echo "🚀 Iniciando base de datos PostgreSQL con Docker..."
docker-compose up -d

echo "⏳ Esperando a que la base de datos esté lista..."
sleep 5

echo "✅ Base de datos iniciada!"
echo "📊 Puedes conectarte con:"
echo "   Host: localhost"
echo "   Puerto: 5432"
echo "   Base de datos: asistia_db"
echo "   Usuario: asistia_user"
echo "   Contraseña: asistia_password"

echo ""
echo "🔧 Para detener la base de datos: docker-compose down"
echo "📋 Para ver logs: docker-compose logs -f postgres"
