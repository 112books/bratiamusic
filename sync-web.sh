#!/bin/bash

# sync-web.sh - Git + Hugo + Deploy complet

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuració
BRANCH="main"
REMOTE="origin"
PAGES_BRANCH="gh-pages"
BUILD_DIR="public"

# Credencials FTP — carregades des de fitxer local (mai al repo)
CONF_FILE="$HOME/.bratiamusic-deploy.conf"
if [ -f "$CONF_FILE" ]; then
    source "$CONF_FILE"
else
    FTP_USER=""
    FTP_HOST=""
    FTP_PATH="/www"
fi

# Missatges
print_message() { echo -e "${BLUE}[sync-web]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Verificar repo
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "No és un repositori Git"
        exit 1
    fi
}

# Info ràpida
show_header() {
    echo ""
    echo "======================================"
    echo " Projecte: $(basename $(pwd))"
    echo " Branca: $(git branch --show-current)"
    echo "======================================"
    echo ""
}

# Estat
show_status() {
    print_message "Estat del repositori"
    echo ""
    if [[ -n $(git status -s) ]]; then
        print_warning "Canvis locals:"
        git status -s
    else
        print_success "Repositori net"
    fi
    echo ""
}

# Pull
do_pull() {
    print_message "Pull..."
    git pull $REMOTE $BRANCH --rebase || exit 1
    print_success "Pull correcte"
}

# Push
do_push() {
    print_message "Push..."
    if [[ -n $(git status -s) ]]; then
        print_warning "Canvis detectats:"
        git status -s
        echo ""
        read -p "Missatge del commit: " msg
        git add .
        git commit -m "$msg"
    fi
    git push $REMOTE $BRANCH || exit 1
    print_success "Push correcte"
}

# Deploy GitHub Pages
do_deploy() {
    print_message "Deploy GitHub Pages"
    do_push
    print_message "Build Hugo..."
    hugo || exit 1
    print_message "Publicant a gh-pages..."
    git subtree push --prefix $BUILD_DIR $REMOTE $PAGES_BRANCH || exit 1
    print_success "Deploy GitHub completat"
}

# Deploy servidor real
do_publish() {
    print_message "Publicant al servidor via FTPS"

    if [ -z "$FTP_USER" ] || [ -z "$FTP_HOST" ]; then
        print_error "Credencials FTP no trobades."
        print_error "Crea el fitxer: ~/.bratiamusic-deploy.conf"
        print_error "Contingut mínim:"
        print_error "  FTP_USER=\"bratiamusic\""
        print_error "  FTP_HOST=\"bratiamusic-com.espacioseguro.com\""
        print_error "  FTP_PATH=\"/www\""
        exit 1
    fi

    do_push

    print_message "Build Hugo producció..."
    hugo --config hugo.toml,hugo.prod.toml || exit 1

    print_warning "Contrasenya FTP de Dinahosting:"
    read -s FTP_PASS
    echo ""

print_message "Enviant fitxers via FTPS..."
LFTP_CONF=$(mktemp)
cat > "$LFTP_CONF" << EOF
set ftp:ssl-force true
set ftp:ssl-auth TLS
set ssl:verify-certificate no
open ftp://${FTP_HOST}
user ${FTP_USER} ${FTP_PASS}
mirror --reverse --delete --verbose --parallel=4 ${BUILD_DIR}/ ${FTP_PATH}/
bye
EOF
lftp -f "$LFTP_CONF"
rm -f "$LFTP_CONF"

    if [ $? -eq 0 ]; then
        print_success "Web publicada a https://bratiamusic.com"
    else
        print_error "Error en la pujada. Comprova credencials i connexió."
        exit 1
    fi
}

# Force push
do_force() {
    print_warning "Forçarà el repositori remot"
    git push $REMOTE $BRANCH --force-with-lease
    print_success "Force push completat"
}

# Menú interactiu
interactive_menu() {
    show_header

    echo "Què vols fer?"
    echo ""
    echo "1) Status    → Veure estat del repositori"
    echo "2) Pull      → Descarregar canvis de GitHub"
    echo "3) Push      → Pujar canvis locals a GitHub"
    echo "4) Deploy    → Publicar a GitHub Pages (previsualització)"
    echo "5) Publish   → Publicar al servidor real (bratiamusic.com)"
    echo "6) Force     → Forçar push (perillós)"
    echo "0) Sortir"
    echo ""

    read -p "Opció: " opt
    echo ""

    case $opt in
        1) show_status ;;
        2) do_pull ;;
        3) do_push ;;
        4) do_deploy ;;
        5)
            print_warning "Això SOBREESCRIURÀ el servidor de producció (bratiamusic.com)"
            read -p "Segur? (s/N): " confirm
            if [[ "$confirm" =~ ^[Ss]$ ]]; then
                do_publish
            else
                print_message "Cancel·lat"
            fi
            ;;
        6)
            print_warning "Això pot trencar el repositori remot"
            read -p "Segur? (s/N): " confirm
            if [[ "$confirm" =~ ^[Ss]$ ]]; then
                do_force
            else
                print_message "Cancel·lat"
            fi
            ;;
        0)
            print_message "Sortint..."
            exit 0
            ;;
        *)
            print_error "Opció no vàlida"
            ;;
    esac
}

# Main
check_git_repo

if [ -z "$1" ]; then
    interactive_menu
else
    case $1 in
        status)  show_status ;;
        pull)    do_pull ;;
        push)    do_push ;;
        deploy)  do_deploy ;;
        publish) do_publish ;;
        force)   do_force ;;
        *)
            print_error "Opció no vàlida"
            echo "Ús: ./sync-web.sh {status|pull|push|deploy|publish|force}"
            ;;
    esac
fi

print_message "Fi del procés"