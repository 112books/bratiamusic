#!/bin/bash
# =============================================================================
# sync-web.sh — Bratia Music / LinuxBCN workflow
# =============================================================================
# Ús: ./sync-web.sh [status|push|pull|force|log|deploy]
#     Sense arguments → mode interactiu
# =============================================================================

set -euo pipefail

# ── COLORS & ESTIL ────────────────────────────────────────────────────────────
RESET='\033[0m'
BOLD='\033[1m'
DIM='\033[2m'

BLACK='\033[0;30m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'

BG_BLUE='\033[44m'
BG_GREEN='\033[42m'
BG_RED='\033[41m'

# ── CONFIGURACIÓ ──────────────────────────────────────────────────────────────
BRANCH="main"
REMOTE="origin"
DEPLOY_BRANCH="gh-pages"
REPO_URL="https://github.com/112books/bratiamusic"
LIVE_URL="https://112books.github.io/bratiamusic/"
SCRIPT_VERSION="2.0"

# ── HELPERS D'IMPRESSIÓ ───────────────────────────────────────────────────────
header() {
    echo ""
    echo -e "${BG_BLUE}${WHITE}${BOLD}  $1  ${RESET}"
    echo ""
}

info()    { echo -e "  ${BLUE}→${RESET}  $1"; }
success() { echo -e "  ${GREEN}✓${RESET}  ${GREEN}$1${RESET}"; }
warning() { echo -e "  ${YELLOW}⚠${RESET}  ${YELLOW}$1${RESET}"; }
error()   { echo -e "  ${RED}✗${RESET}  ${RED}${BOLD}$1${RESET}"; }
dim()     { echo -e "  ${DIM}$1${RESET}"; }
blank()   { echo ""; }

divider() { echo -e "  ${DIM}─────────────────────────────────────────${RESET}"; }

confirm() {
    # confirm "Missatge" → retorna 0 si s/S/y/Y, 1 si no
    local msg="$1"
    local default="${2:-n}"
    local prompt
    [[ "$default" == "s" || "$default" == "y" ]] && prompt="[S/n]" || prompt="[s/N]"
    echo -ne "  ${CYAN}?${RESET}  $msg $prompt: "
    read -r resp
    resp="${resp:-$default}"
    [[ "$resp" =~ ^[SsYy]$ ]]
}

ask() {
    # ask "Missatge" → llegeix string i retorna via $REPLY
    echo -ne "  ${CYAN}›${RESET}  $1: "
    read -r REPLY
}

# ── VERIFICACIONS ─────────────────────────────────────────────────────────────
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Aquest directori no és un repositori Git"
        exit 1
    fi
}

check_branch() {
    local current
    current=$(git branch --show-current)
    if [[ "$current" != "$BRANCH" ]]; then
        warning "Estàs a la branca '${current}', no a '${BRANCH}'"
        if confirm "Canviar a '${BRANCH}'?"; then
            git checkout "$BRANCH"
            success "Canviat a $BRANCH"
        else
            error "Opera des de la branca correcta i torna a executar"
            exit 1
        fi
    fi
}

# ── ESTAT ─────────────────────────────────────────────────────────────────────
show_status() {
    header "ESTAT DEL REPOSITORI  sync-web v${SCRIPT_VERSION}"

    # Info bàsica
    local current_branch
    current_branch=$(git branch --show-current)
    local last_commit
    last_commit=$(git log -1 --format="%h %s ${DIM}(%ar)${RESET}" 2>/dev/null || echo "sense commits")
    local repo_dir
    repo_dir=$(basename "$(git rev-parse --show-toplevel)")

    info "${BOLD}Projecte:${RESET}  $repo_dir"
    info "${BOLD}Branca:${RESET}    $current_branch"
    info "${BOLD}Últim commit:${RESET}"
    echo -e "     ${DIM}$last_commit${RESET}"
    blank

    # Canvis locals
    local staged unstaged untracked
    staged=$(git diff --cached --name-only 2>/dev/null | wc -l | tr -d ' ')
    unstaged=$(git diff --name-only 2>/dev/null | wc -l | tr -d ' ')
    untracked=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d ' ')

    divider
    echo -e "  ${BOLD}Canvis locals${RESET}"
    divider

    if [[ "$staged" -gt 0 ]]; then
        info "${GREEN}Preparats per commit (staged): $staged fitxers${RESET}"
        git diff --cached --name-only | while read -r f; do
            echo -e "     ${GREEN}+${RESET} $f"
        done
        blank
    fi

    if [[ "$unstaged" -gt 0 ]]; then
        warning "Modificats (no staged): $unstaged fitxers"
        git diff --name-only | while read -r f; do
            echo -e "     ${YELLOW}~${RESET} $f"
        done
        blank
    fi

    if [[ "$untracked" -gt 0 ]]; then
        info "Nous fitxers (untracked): $untracked"
        git ls-files --others --exclude-standard | while read -r f; do
            echo -e "     ${CYAN}?${RESET} $f"
        done
        blank
    fi

    if [[ "$staged" -eq 0 && "$unstaged" -eq 0 && "$untracked" -eq 0 ]]; then
        success "Working tree net — cap canvi local pendent"
        blank
    fi

    # Sincronització amb remot
    divider
    echo -e "  ${BOLD}Sincronització remota${RESET}"
    divider

    if ! git fetch "$REMOTE" "$BRANCH" --quiet 2>/dev/null; then
        warning "No s'ha pogut connectar amb el remot (sense xarxa?)"
        return
    fi

    local local_ref remote_ref base_ref
    local_ref=$(git rev-parse "$BRANCH" 2>/dev/null)
    remote_ref=$(git rev-parse "$REMOTE/$BRANCH" 2>/dev/null || echo "")
    base_ref=$(git merge-base "$BRANCH" "$REMOTE/$BRANCH" 2>/dev/null || echo "")

    if [[ -z "$remote_ref" ]]; then
        warning "El remot no té la branca '$BRANCH' encara"
    elif [[ "$local_ref" == "$remote_ref" ]]; then
        success "Local i remot sincronitzats  ${DIM}($LIVE_URL)${RESET}"
    elif [[ "$local_ref" == "$base_ref" ]]; then
        local ahead
        ahead=$(git log "$BRANCH".."$REMOTE/$BRANCH" --oneline | wc -l | tr -d ' ')
        warning "El remot té $ahead commit(s) nous → fes pull"
        git log "$BRANCH".."$REMOTE/$BRANCH" --oneline --format="     ${DIM}%h${RESET} %s" | head -5
    elif [[ "$remote_ref" == "$base_ref" ]]; then
        local behind
        behind=$(git log "$REMOTE/$BRANCH".."$BRANCH" --oneline | wc -l | tr -d ' ')
        info "${BOLD}$behind commit(s) llestos per pujar${RESET}  → fes push"
        git log "$REMOTE/$BRANCH".."$BRANCH" --oneline --format="     ${GREEN}%h${RESET} %s" | head -5
    else
        error "Les branques han divergit — cal resoldre conflictes manualment"
        dim "Local: $(git log "$REMOTE/$BRANCH".."$BRANCH" --oneline | wc -l | tr -d ' ') commits ahead"
        dim "Remot: $(git log "$BRANCH".."$REMOTE/$BRANCH" --oneline | wc -l | tr -d ' ') commits ahead"
    fi
    blank

    # GitHub Actions status (última build)
    divider
    echo -e "  ${BOLD}Deploy${RESET}"
    divider
    info "Accions:   ${CYAN}${REPO_URL}/actions${RESET}"
    info "Web live:  ${CYAN}${LIVE_URL}${RESET}"
    blank
}

# ── PUSH ──────────────────────────────────────────────────────────────────────
do_push() {
    header "PUJAR CANVIS A GITHUB"

    check_branch

    # Calcular totals
    local staged unstaged untracked total_changes
    staged=$(git diff --cached --name-only 2>/dev/null | wc -l | tr -d ' ')
    unstaged=$(git diff --name-only 2>/dev/null | wc -l | tr -d ' ')
    untracked=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d ' ')
    total_changes=$((staged + unstaged + untracked))

    if [[ "$total_changes" -gt 0 ]]; then
        warning "$total_changes fitxer(s) amb canvis pendents de commit"
        blank

        # Mostrar preview complet
        git status -s | while IFS= read -r line; do
            local status="${line:0:2}"
            local file="${line:3}"
            case "$status" in
                "M ")  echo -e "     ${GREEN}M ${RESET} $file  ${DIM}(staged)${RESET}" ;;
                " M")  echo -e "     ${YELLOW}M ${RESET} $file  ${DIM}(modificat)${RESET}" ;;
                "MM")  echo -e "     ${YELLOW}MM${RESET} $file  ${DIM}(staged+modificat)${RESET}" ;;
                "A ")  echo -e "     ${GREEN}A ${RESET} $file  ${DIM}(nou staged)${RESET}" ;;
                "??")  echo -e "     ${CYAN}? ${RESET} $file  ${DIM}(nou)${RESET}" ;;
                "D ")  echo -e "     ${RED}D ${RESET} $file  ${DIM}(eliminat staged)${RESET}" ;;
                " D")  echo -e "     ${RED}D ${RESET} $file  ${DIM}(eliminat)${RESET}" ;;
                *)     echo -e "     ${DIM}$status${RESET} $file" ;;
            esac
        done
        blank

        if ! confirm "Fer commit de tots els canvis i pujar?"; then
            info "Operació cancel·lada"
            exit 0
        fi

        blank
        ask "Missatge del commit"
        local commit_msg="$REPLY"

        if [[ -z "$commit_msg" ]]; then
            error "El missatge del commit no pot estar buit"
            exit 1
        fi

        # Afegir tots els canvis
        git add -A

        # Commit amb stats
        git commit -m "$commit_msg"
        blank
        success "Commit realitzat: ${DIM}$(git log -1 --format='%h')${RESET} $commit_msg"
        blank
    else
        # Comprovar si hi ha commits pendents de pujar
        git fetch "$REMOTE" "$BRANCH" --quiet 2>/dev/null || true
        local pending
        pending=$(git log "$REMOTE/$BRANCH".."$BRANCH" --oneline 2>/dev/null | wc -l | tr -d ' ')

        if [[ "$pending" -eq 0 ]]; then
            success "No hi ha res per pujar — tot sincronitzat"
            blank
            exit 0
        fi

        info "$pending commit(s) pendents de push:"
        git log "$REMOTE/$BRANCH".."$BRANCH" --oneline --format="     ${GREEN}%h${RESET} %s  ${DIM}(%ar)${RESET}"
        blank
    fi

    # Verificar divergència
    git fetch "$REMOTE" "$BRANCH" --quiet 2>/dev/null || true
    local local_ref remote_ref base_ref
    local_ref=$(git rev-parse "$BRANCH")
    remote_ref=$(git rev-parse "$REMOTE/$BRANCH" 2>/dev/null || echo "")
    base_ref=$(git merge-base "$BRANCH" "$REMOTE/$BRANCH" 2>/dev/null || echo "")

    if [[ -n "$remote_ref" && "$local_ref" != "$base_ref" && "$remote_ref" != "$base_ref" ]]; then
        error "El remot té canvis nous — fes pull primer"
        dim "Executa: ./sync-web.sh pull"
        exit 1
    fi

    # Push
    info "Pujant a ${REMOTE}/${BRANCH}..."
    blank

    if git push "$REMOTE" "$BRANCH"; then
        blank
        success "Push completat!"
        blank
        divider
        info "GitHub Actions iniciarà el deploy automàticament"
        info "Segueix el progrés a:"
        echo -e "     ${CYAN}${REPO_URL}/actions${RESET}"
        info "Web live (en ~1 min):"
        echo -e "     ${CYAN}${LIVE_URL}${RESET}"
        divider
    else
        blank
        error "Error en fer push — revisa la connexió o els permisos"
        exit 1
    fi

    blank
}

# ── PULL ──────────────────────────────────────────────────────────────────────
do_pull() {
    header "DESCARREGAR CANVIS DE GITHUB"

    check_branch

    local staged unstaged untracked total_changes
    staged=$(git diff --cached --name-only 2>/dev/null | wc -l | tr -d ' ')
    unstaged=$(git diff --name-only 2>/dev/null | wc -l | tr -d ' ')
    untracked=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d ' ')
    total_changes=$((staged + unstaged + untracked))

    local stashed=false

    if [[ "$total_changes" -gt 0 ]]; then
        warning "$total_changes fitxer(s) amb canvis locals no commitats"
        blank
        echo -e "  Opcions:"
        echo -e "     ${GREEN}1)${RESET} Fer commit dels canvis primer"
        echo -e "     ${YELLOW}2)${RESET} Desar temporalment (stash) i continuar"
        echo -e "     ${RED}3)${RESET} Cancel·lar"
        blank
        echo -ne "  ${CYAN}?${RESET}  Tria una opció [1/2/3]: "
        read -r opt
        blank

        case "$opt" in
            1)
                ask "Missatge del commit"
                local commit_msg="$REPLY"
                if [[ -z "$commit_msg" ]]; then
                    error "Missatge buit — operació cancel·lada"
                    exit 1
                fi
                git add -A
                git commit -m "$commit_msg"
                success "Commit realitzat"
                blank
                ;;
            2)
                local stash_msg="stash-syncweb-$(date '+%Y%m%d-%H%M%S')"
                git stash push -u -m "$stash_msg"
                success "Canvis desats al stash: ${DIM}$stash_msg${RESET}"
                stashed=true
                blank
                ;;
            *)
                info "Operació cancel·lada"
                exit 0
                ;;
        esac
    fi

    info "Descarregant des de ${REMOTE}/${BRANCH}..."
    blank

    if git pull "$REMOTE" "$BRANCH" --rebase; then
        blank
        success "Pull completat!"

        if [[ "$stashed" == true ]]; then
            blank
            info "Recuperant canvis del stash..."
            if git stash pop; then
                success "Canvis locals recuperats correctament"
            else
                warning "Hi ha conflictes al recuperar el stash"
                dim "Executa 'git status' i resol els conflictes manualment"
                dim "Després executa 'git stash drop' per netejar"
            fi
        fi
    else
        blank
        error "Error en fer pull"
        if [[ "$stashed" == true ]]; then
            info "Recuperant canvis del stash..."
            git stash pop || warning "No s'ha pogut recuperar el stash — executa 'git stash list'"
        fi
        exit 1
    fi

    blank
}

# ── LOG ───────────────────────────────────────────────────────────────────────
show_log() {
    header "HISTORIAL DE COMMITS"

    git fetch "$REMOTE" "$BRANCH" --quiet 2>/dev/null || true

    local count="${1:-10}"
    info "Últims $count commits  ${DIM}(local + remot)${RESET}"
    blank

    git log --oneline --decorate --graph \
        --format="%C(yellow)%h%Creset %C(cyan)%ar%Creset %C(white)%s%Creset %C(dim)%an%Creset" \
        -n "$count"

    blank
    divider
    info "Deploy branch (${DEPLOY_BRANCH}):"
    git log "$REMOTE/$DEPLOY_BRANCH" --oneline -3 \
        --format="     ${DIM}%h${RESET} %s  ${DIM}(%ar)${RESET}" 2>/dev/null || \
        dim "     (branch no trobat o sense accés)"
    blank
}

# ── FORCE PUSH ────────────────────────────────────────────────────────────────
do_force() {
    header "FORCE PUSH"

    blank
    error "ATENCIÓ: Aquesta operació sobreescriu l'historial remot"
    warning "Només usar si saps exactament el que fas"
    blank

    info "Commits locals que es pujaran per sobre del remot:"
    git fetch "$REMOTE" "$BRANCH" --quiet 2>/dev/null || true
    git log "$REMOTE/$BRANCH".."$BRANCH" --oneline \
        --format="     ${YELLOW}%h${RESET} %s" 2>/dev/null | head -10
    blank

    if confirm "Confirmes el force push a ${REMOTE}/${BRANCH}?" "n"; then
        if confirm "Segur? Això no es pot desfer fàcilment" "n"; then
            blank
            info "Fent force push..."
            if git push "$REMOTE" "$BRANCH" --force-with-lease; then
                blank
                success "Force push completat"
            else
                error "Error en el force push"
                exit 1
            fi
        else
            info "Operació cancel·lada"
        fi
    else
        info "Operació cancel·lada"
    fi

    blank
}

# ── DEPLOY STATUS ─────────────────────────────────────────────────────────────
show_deploy() {
    header "INFORMACIÓ DE DEPLOY"

    info "${BOLD}Repositori:${RESET}   ${CYAN}${REPO_URL}${RESET}"
    info "${BOLD}Actions:${RESET}      ${CYAN}${REPO_URL}/actions${RESET}"
    info "${BOLD}Web live:${RESET}     ${CYAN}${LIVE_URL}${RESET}"
    blank

    divider
    echo -e "  ${BOLD}Últims commits al branch '${DEPLOY_BRANCH}' (gh-pages)${RESET}"
    divider
    blank

    git fetch "$REMOTE" "$DEPLOY_BRANCH" --quiet 2>/dev/null || true
    git log "$REMOTE/$DEPLOY_BRANCH" \
        --format="     ${DIM}%h${RESET}  %s  ${DIM}(%ar — %an)${RESET}" \
        -5 2>/dev/null || dim "     No s'ha pogut accedir al branch de deploy"

    blank
    divider
    echo -e "  ${BOLD}Consells de diagnòstic${RESET}"
    divider
    dim "  Si el site no s'actualitza:"
    dim "  1. Comprova que el workflow ha passat (✓ verd) a /actions"
    dim "  2. Força un hard refresh al navegador: Cmd+Shift+R"
    dim "  3. Comprova que GitHub Pages apunta a 'gh-pages' branch"
    dim "     Settings → Pages → Source → Deploy from branch → gh-pages"
    blank
}

# ── MODE INTERACTIU ───────────────────────────────────────────────────────────
interactive_mode() {
    clear
    echo ""
    echo -e "  ${BG_BLUE}${WHITE}${BOLD}  🎵 BRATIA MUSIC — sync-web v${SCRIPT_VERSION}  ${RESET}"
    blank

    # Resum ràpid d'estat
    local current_branch
    current_branch=$(git branch --show-current)

    local total_changes
    total_changes=$(git status -s 2>/dev/null | wc -l | tr -d ' ')

    local pending_push=0
    git fetch "$REMOTE" "$BRANCH" --quiet 2>/dev/null || true
    pending_push=$(git log "$REMOTE/$BRANCH".."$BRANCH" --oneline 2>/dev/null | wc -l | tr -d ' ')

    # Badge d'estat
    if [[ "$total_changes" -gt 0 ]]; then
        echo -e "  ${YELLOW}◉${RESET} $total_changes canvi(s) local(s) pendent(s)"
    elif [[ "$pending_push" -gt 0 ]]; then
        echo -e "  ${CYAN}◉${RESET} $pending_push commit(s) per pujar"
    else
        echo -e "  ${GREEN}◉${RESET} Tot sincronitzat"
    fi
    info "Branca: ${BOLD}$current_branch${RESET}"
    blank

    divider
    echo -e "  ${BOLD}Què vols fer?${RESET}"
    divider
    blank
    echo -e "   ${GREEN}1)${RESET}  ${BOLD}status${RESET}   — Veure l'estat complet"
    echo -e "   ${CYAN}2)${RESET}  ${BOLD}push${RESET}     — Commit + pujar canvis"
    echo -e "   ${BLUE}3)${RESET}  ${BOLD}pull${RESET}     — Descarregar canvis"
    echo -e "   ${MAGENTA}4)${RESET}  ${BOLD}log${RESET}      — Historial de commits"
    echo -e "   ${BLUE}5)${RESET}  ${BOLD}deploy${RESET}   — Info del desplegament"
    echo -e "   ${RED}6)${RESET}  ${BOLD}force${RESET}    — Force push ${DIM}(avançat)${RESET}"
    echo -e "   ${DIM}0)${RESET}  ${DIM}Sortir${RESET}"
    blank

    echo -ne "  ${CYAN}?${RESET}  Opció: "
    read -r opt
    blank

    case "$opt" in
        1) show_status  ;;
        2) do_push      ;;
        3) do_pull      ;;
        4) show_log     ;;
        5) show_deploy  ;;
        6) do_force     ;;
        0|q|Q) info "Fins aviat!" ; blank ; exit 0 ;;
        *) warning "Opció no vàlida" ; blank ;;
    esac
}

# ── AJUDA ─────────────────────────────────────────────────────────────────────
show_help() {
    blank
    echo -e "  ${BOLD}sync-web.sh${RESET} v${SCRIPT_VERSION} — Bratia Music / LinuxBCN"
    blank
    echo -e "  ${BOLD}Ús:${RESET}"
    echo -e "     ${CYAN}./sync-web.sh${RESET}             Mode interactiu"
    echo -e "     ${CYAN}./sync-web.sh status${RESET}      Estat del repositori"
    echo -e "     ${CYAN}./sync-web.sh push${RESET}        Commit + push"
    echo -e "     ${CYAN}./sync-web.sh pull${RESET}        Pull del remot"
    echo -e "     ${CYAN}./sync-web.sh log [n]${RESET}     Últims n commits (default: 10)"
    echo -e "     ${CYAN}./sync-web.sh deploy${RESET}      Info de desplegament"
    echo -e "     ${CYAN}./sync-web.sh force${RESET}       Force push (avançat)"
    blank
}

# ── MAIN ──────────────────────────────────────────────────────────────────────
check_git_repo

ACTION="${1:-}"

case "$ACTION" in
    "")         interactive_mode ;;
    status)     show_status      ;;
    push)       do_push          ;;
    pull)       do_pull          ;;
    log)        show_log "${2:-10}" ;;
    deploy)     show_deploy      ;;
    force)      do_force         ;;
    help|--help|-h) show_help   ;;
    *)
        error "Opció no vàlida: '$ACTION'"
        show_help
        exit 1
        ;;
esac

exit 0