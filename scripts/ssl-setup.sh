STAGING_DOMAIN="api-miracle-hml.mostbr.com"
EMAIL="luis.pires@mostbr.com"

log "Configurando SSL para HOMOLOGAÇÃO..."

# Verificar se o domínio está apontando para o servidor
log "🔍 Verificando DNS..."
if nslookup $STAGING_DOMAIN | grep -q "$(curl -s ifconfig.me)"; then
    log "DNS configurado corretamente"
else
    warn "⚠️ DNS pode não estar propagado ainda"
    warn "Verifique se $STAGING_DOMAIN está apontando para $(curl -s ifconfig.me)"
fi

# SSL para homologação
log "Configurando SSL para $STAGING_DOMAIN..."
sudo certbot --nginx -d $STAGING_DOMAIN --email $EMAIL --agree-tos --non-interactive

# Configurar renovação automática
log "Configurando renovação automática..."
sudo crontab -l | grep -q 'certbot renew' || (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -

# Verificar certificado
log "Verificando certificado..."
sudo certbot certificates

log "SSL configurado com sucesso!"
log "Aplicação disponível em: https://$STAGING_DOMAIN"