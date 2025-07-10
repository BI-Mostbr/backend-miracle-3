set -e

echo "Configurando Servidor EC2 para Backend Miracle - HOMOLOGAÇÃO..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# 1. Atualizar sistema
log "Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js 24
log "Instalando Node.js 24..."
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar PM2 e TSX
log "Instalando PM2 e TSX..."
sudo npm install -g pm2 tsx

# 4. Instalar Nginx
log "Instalando Nginx..."
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# 5. Configurar firewall
log "Configurando firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw --force enable

# 6. Instalar Git
log "Instalando Git..."
sudo apt install git -y

# 7. Instalar Certbot
log "Instalando Certbot..."
sudo apt install certbot python3-certbot-nginx -y

# 8. Criar estrutura de diretórios (APENAS HOMOLOGAÇÃO)
log "Criando estrutura de diretórios..."
sudo mkdir -p /var/www/backend-homolog
sudo chown -R ubuntu:ubuntu /var/www/

# 9. Configurar PM2 para inicializar com sistema
log "Configurando PM2 startup..."
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# 10. Criar configuração do Nginx para HOMOLOGAÇÃO
log "Criando configuração do Nginx para homologação..."

sudo tee /etc/nginx/sites-available/backend-homolog > /dev/null << 'EOF'
server {
    listen 80;
    server_name api-miracle-hml.mostbr.com;

    access_log /var/log/nginx/backend-homolog.access.log;
    error_log /var/log/nginx/backend-homolog.error.log;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }

    location /api-docs {
        proxy_pass http://localhost:3001/api-docs;
    }
}
EOF

# Ativar site
sudo ln -sf /etc/nginx/sites-available/backend-homolog /etc/nginx/sites-enabled/

# Remover site padrão
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração do Nginx
sudo nginx -t && sudo systemctl reload nginx

# 11. Verificar versões instaladas
log "Verificando instalações..."
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "PM2 version: $(pm2 --version)"
echo "Nginx version: $(nginx -v 2>&1)"

log "Configuração inicial concluída!"
log "Próximos passos:"
log "   1. Configure o domínio no seu DNS"
log "   2. Clone o repositório em /var/www/backend-homolog"
log "   3. Configure as variáveis de ambiente (.env)"
log "   4. Configure as secrets no GitHub"
log "   5. Configure SSL com certbot"