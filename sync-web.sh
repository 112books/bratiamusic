#!/bin/bash

# sync-web.sh - Script per sincronitzar el projecte amb GitHub i desplegar Hugo
# Ús: ./sync-web.sh [opció]
# Opcions:
#   push    - Puja els canvis locals a GitHub
#   pull    - Descarrega els canvis remots
#   status  - Mostra l'estat actual (per defecte)
#   deploy  - Commit + push + build Hugo + deploy gh-pages
#   force   - Força la sincronització (amb precaució)

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

# Missatges
print_message() {
    echo -e "${BLUE}[sync-web]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Verificar repo
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Aquest directori no és un repositori Git"
        exit 1
    fi
}

# Estat
show_status() {
    print_message "Estat del repositori:"
    echo ""

    current_branch=$(git branch --show-current)
    echo "📁 Branca actual: $current_branch"

    if [[ -n $(git status -s) ]]; then
        print_warning "Canvis locals no commitats:"
        git status -s
        echo ""
    else
        print_success "No hi ha canvis locals pendents"
        echo ""
    fi

    git fetch $REMOTE $BRANCH 2>/dev/null

    local_commit=$(git rev-parse $BRANCH)
    remote_commit=$(git rev-parse $REMOTE/$BRANCH 2>/dev/null)
    base_commit=$(git merge-base $BRANCH $REMOTE/$BRANCH 2>/dev/null)

    if [ -z "$remote_commit" ]; then
        print_warning "El repositori remot encara no existeix"
    elif [ "$local_commit" = "$remote_commit" ]; then
        print_success "Local i remot estan sincronitzats"
    elif [ "$local_commit" = "$base_commit" ]; then
        print_warning "El remot té canvis nous (necessites fer pull)"
        git log $BRANCH..$REMOTE/$BRANCH --oneline
    elif [ "$remote_commit" = "$base_commit" ]; then
        print_warning "El local té canvis nous (necessites fer push)"
        git log $REMOTE/$BRANCH..$BRANCH --oneline
    else
        print_error "Les branques han divergit"
    fi
    echo ""
}

# Pull
do_pull() {
    print_message "Descarregant canvis..."

    if [[ -n $(git status -s) ]]; then
        print_warning "Tens canvis locals"
        git status -s
        echo ""
        read -p "Fer commit abans? (s/n): " response

        if [[ "$response" =~ ^[Ss]$ ]]; then
            read -p "Missatge: " commit_msg
            git add .
            git commit -m "$commit_msg"
        else
            git stash push -m "auto-stash $(date)"
            stashed=true
        fi
    fi

    if git pull $REMOTE $BRANCH --rebase; then
        print_success "Pull correcte"

        if [ "$stashed" = true ]; then
            git stash pop
        fi
    else
        print_error "Error en pull"
        exit 1
    fi
}

# Push
do_push() {
    print_message "Preparant push..."

    if [[ -n $(git status -s) ]]; then
        print_warning "Canvis no commitats:"
        git status -s
        echo ""
        read -p "Fer commit? (s/n): " response

        if [[ "$response" =~ ^[Ss]$ ]]; then
            read -p "Missatge: " commit_msg
            git add .
            git commit -m "$commit_msg"
        else
            print_error "Cancel·lat"
            exit 1
        fi
    fi

    if git push $REMOTE $BRANCH; then
        print_success "Push correcte"
    else
        print_error "Error en push"
        exit 1
    fi
}

# Deploy complet
do_deploy() {
    print_message "Deploy complet iniciat..."

    # Commit si cal
    if [[ -n $(git status -s) ]]; then
        print_warning "Canvis detectats:"
        git status -s
        echo ""
        read -p "Fer commit? (s/n): " response

        if [[ "$response" =~ ^[Ss]$ ]]; then
            read -p "Missatge: " commit_msg
            git add .
            git commit -m "$commit_msg"
        else
            print_error "Cancel·lat"
            exit 1
        fi
    fi

    # Push main
    print_message "Push a main..."
    git push $REMOTE $BRANCH || exit 1

    # Build Hugo
    print_message "Executant Hugo..."
    hugo || exit 1

    # Deploy gh-pages
    print_message "Deploy a gh-pages..."
    git subtree push --prefix $BUILD_DIR $REMOTE $PAGES_BRANCH || exit 1

    print_success "Deploy completat"
}

# Force
do_force() {
    print_warning "Forçarà el repositori remot"
    read -p "Segur? (s/N): " response

    if [[ "$response" =~ ^[Ss]$ ]]; then
        git push $REMOTE $BRANCH --force-with-lease
        print_success "Forçat completat"
    fi
}

# Main
check_git_repo

ACTION=${1:-status}

case $ACTION in
    status)
        show_status
        ;;
    pull)
        do_pull
        ;;
    push)
        do_push
        ;;
    deploy)
        do_deploy
        ;;
    force)
        do_force
        ;;
    *)
        print_error "Opció no vàlida"
        echo "Ús: ./sync-web.sh {status|pull|push|deploy|force}"
        exit 1
        ;;
esac

print_message "Script finalitzat"