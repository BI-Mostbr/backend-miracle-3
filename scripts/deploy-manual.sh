set -e

log "Iniciando deploy manual para HOMOLOGAÇÃO..."

APP_DIR="/var/www/backend-homolog"
PM2_APP="backend-miracle-homolog"
PORT="3000"

cd $APP_DIR

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    error "Não encontrou package.json. Verifique se está no diretório correto."
    exit 1
fi

# Backup do .env
if [ -f ".env" ]; then
    cp .env .env.backup
    log "Backup do .env criado"
fi

# Mostrar informações atuais
log "Informações atuais:"
echo "Diretório: $(pwd)"
echo "Branch atual: $(git branch --show-current)"
echo "Commit atual: $(git rev-parse --short HEAD)"

# Pull das alterações
log "Baixando alterações..."
git fetch origin
git reset --hard origin/main
git clean -fd

# Mostrar novas informações
log "Novas informações:"
echo "Novo commit: $(git rev-parse --short HEAD)"
echo "Mensagem: $(git log -1 --pretty=%B)"

# Restaurar .env
if [ -f ".env.backup" ]; then
    cp .env.backup .env
    log ".env restaurado"
fi

# Instalar dependências
log "Instalando dependências..."
npm ci

# Build
log "Fazendo build..."
npm run build

# Criar logs
mkdir -p logs

# Restart PM2
log "Reiniciando aplicação..."
pm2 reload ecosystem.config.js --only $PM2_APP || pm2 start ecosystem.config.js --only $PM2_APP

# Health check
log "Verificando saúde da aplicação..."
sleep 10

if curl -f http://localhost:$PORT/health; then
    log "Deploy realizado com sucesso!"
    log "Aplicação disponível em: http://localhost:$PORT"
    log "Status PM2:"
    pm2 status
else
    error "Health check falhou!"
    error "Logs recentes:"
    pm2 logs $PM2_APP --lines 20
    exit 1
fi