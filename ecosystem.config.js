// ecosystem.config.js
module.exports = {
  apps: [
    {
      // Configuração para HOMOLOGAÇÃO
      name: 'backend-miracle-homolog',
      script: './src/app.ts',
      cwd: '/var/www/backend-homolog',
      interpreter: 'node',
      interpreter_args: '--loader tsx/esm',
      instances: 1,
      exec_mode: 'fork',

      // Variáveis de ambiente
      env: {
        NODE_ENV: 'staging',
        PORT: 3000,
        NODE_OPTIONS: '--openssl-legacy-provider'
      },

      // Configurações de restart
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log', '.git'],

      // Logs
      log_file: '/var/www/backend-homolog/logs/combined.log',
      out_file: '/var/www/backend-homolog/logs/out.log',
      error_file: '/var/www/backend-homolog/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Auto restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',

      // Recursos
      max_memory_restart: '512M',

      // Health check
      health_check_grace_period: 3000,

      // Deploy hooks
      post_update: ['npm install', 'npm run build']
    }
  ]
}
