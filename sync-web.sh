#!/bin/bash

# sync-web.sh - Script per sincronitzar el projecte amb GitHub
# Ús: ./sync-web.sh [opció]
# Opcions:
#   push    - Puja els canvis locals a GitHub
#   pull    - Descarrega els canvis remots
#   status  - Mostra l'estat actual (per defecte)
#   force   - Força la sincronització (amb precaució)

# Colors per a millor visualització
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuració
BRANCH="main"
REMOTE="origin"

# Funció per mostrar missatges
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

# Funció per verificar si estem dins d'un repositori git
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Aquest directori no és un repositori Git"
        exit 1
    fi
}

# Funció per mostrar l'estat actual
show_status() {
    print_message "Estat del repositori:"
    echo ""
    
    # Branca actual
    current_branch=$(git branch --show-current)
    echo "📁 Branca actual: $current_branch"
    
    # Canvis locals no commitats
    if [[ -n $(git status -s) ]]; then
        print_warning "Canvis locals no commitats:"
        git status -s
        echo ""
    else
        print_success "No hi ha canvis locals pendents"
        echo ""
    fi
    
    # Diferència amb el remot
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
        echo "   Commits nous al remot:"
        git log $BRANCH..$REMOTE/$BRANCH --oneline
    elif [ "$remote_commit" = "$base_commit" ]; then
        print_warning "El local té canvis nous (necessites fer push)"
        echo "   Commits locals per pujar:"
        git log $REMOTE/$BRANCH..$BRANCH --oneline
    else
        print_error "Les branques han divergit! Cal resoldre conflictes manualment"
        echo "   Commits locals: $(git log $REMOTE/$BRANCH..$BRANCH --oneline | wc -l)"
        echo "   Commits remots: $(git log $BRANCH..$REMOTE/$BRANCH --oneline | wc -l)"
    fi
    echo ""
}

# Funció per fer pull (descarregar canvis)
do_pull() {
    print_message "Descarregant canvis des de GitHub..."
    
    # Verificar si hi ha canvis locals no commitats
    if [[ -n $(git status -s) ]]; then
        print_warning "Tens canvis locals no guardats"
        echo "   Canvis pendents:"
        git status -s
        echo ""
        read -p "Vols fer commit abans de fer pull? (s/n): " response
        if [[ "$response" =~ ^[Ss]$ ]]; then
            read -p "Missatge del commit: " commit_msg
            git add .
            git commit -m "$commit_msg"
            print_success "Commit realitzat"
        else
            print_warning "Fent stash dels canvis locals..."
            git stash push -m "stash abans de pull $(date '+%Y-%m-%d %H:%M:%S')"
            print_success "Canvis desats temporalment"
            stashed=true
        fi
    fi
    
    # Fer pull
    if git pull $REMOTE $BRANCH --rebase; then
        print_success "Pull completat correctament"
        
        # Si vam fer stash, recuperar canvis
        if [ "$stashed" = true ]; then
            print_message "Recuperant canvis locals..."
            git stash pop
            if [ $? -eq 0 ]; then
                print_success "Canvis locals recuperats"
            else
                print_warning "Hi ha conflictes per resoldre manualment"
                print_message "Executa 'git status' per veure els conflictes"
            fi
        fi
    else
        print_error "Error en fer pull"
        if [ "$stashed" = true ]; then
            print_message "Recuperant canvis del stash..."
            git stash pop
        fi
        exit 1
    fi
}

# Funció per fer push (pujar canvis)
do_push() {
    print_message "Preparant per pujar canvis a GitHub..."
    
    # Verificar canvis pendents
    if [[ -n $(git status -s) ]]; then
        print_warning "Tens canvis locals no commitats:"
        git status -s
        echo ""
        read -p "Vols fer commit abans de pujar? (s/n): " response
        if [[ "$response" =~ ^[Ss]$ ]]; then
            read -p "Missatge del commit: " commit_msg
            git add .
            git commit -m "$commit_msg"
            print_success "Commit realitzat"
        else
            print_error "No es pot fer push amb canvis pendents"
            print_message "Executa './sync-web.sh status' per veure els canvis"
            exit 1
        fi
    fi
    
    # Verificar si hi ha canvis al remot abans de push
    git fetch $REMOTE $BRANCH 2>/dev/null
    local_commit=$(git rev-parse $BRANCH)
    remote_commit=$(git rev-parse $REMOTE/$BRANCH 2>/dev/null)
    
    if [ "$local_commit" != "$remote_commit" ] && [ -n "$remote_commit" ]; then
        base_commit=$(git merge-base $BRANCH $REMOTE/$BRANCH)
        if [ "$local_commit" != "$base_commit" ] && [ "$remote_commit" != "$base_commit" ]; then
            print_error "El repositori remot té canvis nous que no tens"
            print_message "Executa primer './sync-web.sh pull' per actualitzar"
            exit 1
        fi
    fi
    
    # Fer push
    print_message "Pujant canvis a GitHub..."
    if git push $REMOTE $BRANCH; then
        print_success "Push completat correctament"
        print_message "GitHub Actions s'encarregarà del desplegament automàtic"
    else
        print_error "Error en fer push"
        exit 1
    fi
}

# Funció per forçar sincronització (amb precaució)
do_force() {
    print_warning "Això sobreescriurà el repositori remot amb el local"
    read -p "Estàs segur? (s/N): " response
    if [[ "$response" =~ ^[Ss]$ ]]; then
        print_message "Forçant push..."
        git push $REMOTE $BRANCH --force-with-lease
        print_success "Forçat completat"
    else
        print_message "Operació cancel·lada"
    fi
}

# Script principal
check_git_repo

# Determinar acció
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
    force)
        do_force
        ;;
    *)
        print_error "Opció no vàlida: $ACTION"
        echo "Ús: ./sync-web.sh {status|pull|push|force}"
        exit 1
        ;;
esac

print_message "Script finalitzat"