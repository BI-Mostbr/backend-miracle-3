APP_NAME="backend-miracle-homolog"

case "$1" in
    "error")
        echo "Error logs:"
        pm2 logs $APP_NAME --err --lines 50
        ;;
    "out")
        echo "Output logs:"
        pm2 logs $APP_NAME --out --lines 50
        ;;
    "all")
        echo "All logs:"
        pm2 logs $APP_NAME --lines 50
        ;;
    "follow")
        echo "Following logs (Ctrl+C to stop):"
        pm2 logs $APP_NAME --follow
        ;;
    "nginx")
        echo "Nginx logs:"
        echo "=== ACCESS LOG ==="
        tail -n 20 /var/log/nginx/backend-homolog.access.log
        echo "=== ERROR LOG ==="
        tail -n 20 /var/log/nginx/backend-homolog.error.log
        ;;
    *)
        echo "Usage: $0 {error|out|all|follow|nginx}"
        echo "Examples:"
        echo "  $0 error   - Show error logs"
        echo "  $0 out     - Show output logs"
        echo "  $0 all     - Show all logs"
        echo "  $0 follow  - Follow logs in real-time"
        echo "  $0 nginx   - Show nginx logs"
        ;;
esac