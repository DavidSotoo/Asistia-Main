#!/bin/bash

# Script de conveniencia para Asistia
# Uso: ./start.sh [comando]

case "$1" in
  "start")
    echo "🚀 Iniciando Asistia..."
    node dev.js start
    ;;
  "stop")
    echo "🛑 Deteniendo Asistia..."
    node dev.js stop
    ;;
  "restart")
    echo "🔄 Reiniciando Asistia..."
    node dev.js restart
    ;;
  "kill")
    echo "💀 Matando procesos..."
    node dev.js kill
    ;;
  *)
    echo "🚀 Asistia Development Helper"
    echo ""
    echo "Comandos disponibles:"
    echo "  ./start.sh start    - Inicia backend y frontend"
    echo "  ./start.sh stop     - Detiene todos los servicios"
    echo "  ./start.sh restart  - Reinicia todos los servicios"
    echo "  ./start.sh kill     - Mata procesos en puertos 3000 y 3001"
    echo ""
    echo "Ejemplos:"
    echo "  ./start.sh start    # Iniciar todo"
    echo "  ./start.sh kill     # Si algo se queda colgado"
    ;;
esac
