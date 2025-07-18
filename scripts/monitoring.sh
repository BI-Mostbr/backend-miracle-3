log "Status do Sistema - HOMOLOGAÇÃO:"

echo "Node.js Version:"
node --version

echo "PM2 Status:"
pm2 status

echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo "Disk Usage:"
df -h /var/www

echo "Memory Usage:"
free -h

echo "System Load:"
uptime

echo "Recent Logs (Homolog):"
tail -n 10 /var/www/backend-homolog/logs/error.log 2>/dev/null || echo "No error logs"

echo "Health Checks:"
echo "Homolog HTTP: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)"
echo "Homolog HTTPS: $(curl -s -o /dev/null -w "%{http_code}" https://api-homolog.seudominio.com/health 2>/dev/null || echo "SSL not configured")"

echo "Application Status:"
pm2 show backend-miracle-homolog