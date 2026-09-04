#!/usr/bin/env bash
set -euo pipefail

# OmniRoute Installation Script
# Automates initial project setup with environment configuration and validation

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly ENV_EXAMPLE="${PROJECT_ROOT}/.env.example"
readonly ENV_FILE="${PROJECT_ROOT}/.env"
readonly NODE_VERSION_REQUIRED="22"

# Color output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}ℹ${NC} $*"
}

log_success() {
  echo -e "${GREEN}✓${NC} $*"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $*"
}

log_error() {
  echo -e "${RED}✗${NC} $*" >&2
}

# Check Node.js version
check_node_version() {
  log_info "Checking Node.js version..."

  if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    log_info "Visit https://nodejs.org/ to install Node.js ≥${NODE_VERSION_REQUIRED}"
    return 1
  fi

  local node_version
  node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)

  if [[ ! "$node_version" =~ ^(22|24|25|26)$ ]]; then
    log_error "Node.js version $node_version is not supported"
    log_info "Required: Node.js ≥22.0.0 <23 OR ≥24.0.0 <27"
    return 1
  fi

  log_success "Node.js $(node -v) detected"
}

# Check npm availability
check_npm() {
  log_info "Checking npm..."

  if ! command -v npm &> /dev/null; then
    log_error "npm is not installed"
    return 1
  fi

  log_success "npm $(npm -v) available"
}

# Setup .env file
setup_env_file() {
  log_info "Setting up .env file..."

  if [[ ! -f "$ENV_EXAMPLE" ]]; then
    log_error ".env.example not found at $ENV_EXAMPLE"
    return 1
  fi

  if [[ -f "$ENV_FILE" ]]; then
    log_warning ".env already exists"
    read -p "Do you want to regenerate secrets? (y/N) " -r regenerate
    if [[ "$regenerate" != "y" && "$regenerate" != "Y" ]]; then
      log_info "Keeping existing .env file"
      return 0
    fi
  fi

  cp "$ENV_EXAMPLE" "$ENV_FILE"
  log_success "Created .env from .env.example"

  # Generate JWT_SECRET
  local jwt_secret
  jwt_secret=$(openssl rand -base64 48)
  if grep -q "^JWT_SECRET=" "$ENV_FILE"; then
    sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=$jwt_secret|" "$ENV_FILE"
    rm -f "${ENV_FILE}.bak"
  else
    echo "JWT_SECRET=$jwt_secret" >> "$ENV_FILE"
  fi
  log_success "Generated JWT_SECRET"

  # Generate API_KEY_SECRET
  local api_key_secret
  api_key_secret=$(openssl rand -hex 32)
  if grep -q "^API_KEY_SECRET=" "$ENV_FILE"; then
    sed -i.bak "s|^API_KEY_SECRET=.*|API_KEY_SECRET=$api_key_secret|" "$ENV_FILE"
    rm -f "${ENV_FILE}.bak"
  else
    echo "API_KEY_SECRET=$api_key_secret" >> "$ENV_FILE"
  fi
  log_success "Generated API_KEY_SECRET"

  log_info ".env file configured at $ENV_FILE"
}

# Install dependencies
install_dependencies() {
  log_info "Installing dependencies..."

  cd "$PROJECT_ROOT"

  if ! npm ci; then
    log_error "Failed to install dependencies"
    return 1
  fi

  log_success "Dependencies installed"
}

# Validate installation
validate_installation() {
  log_info "Validating installation..."

  cd "$PROJECT_ROOT"

  # Check key files exist
  local required_files=(
    "package.json"
    "tsconfig.json"
    ".env"
  )

  for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
      log_error "Required file missing: $file"
      return 1
    fi
  done

  # Check node_modules
  if [[ ! -d "node_modules" ]]; then
    log_error "node_modules directory not found"
    return 1
  fi

  log_success "Installation validation passed"
}

# Display setup summary
print_summary() {
  cat << EOF

${GREEN}✓ OmniRoute installation complete!${NC}

${BLUE}Next steps:${NC}

1. ${YELLOW}Development server${NC}
   cd ${PROJECT_ROOT}
   npm run dev
   → API & Dashboard: http://localhost:20128

2. ${YELLOW}Build for production${NC}
   npm run build

3. ${YELLOW}Run quality checks${NC}
   npm run lint          # ESLint check
   npm run typecheck:core # TypeScript check
   npm run test:coverage  # Unit tests with coverage gate

4. ${YELLOW}Full check suite${NC}
   npm run check         # Runs lint + test combined

${BLUE}Configuration:${NC}
   .env file: ${ENV_FILE}
   Data directory: \${DATA_DIR:-~/.omniroute/}
   Default port: 20128

${BLUE}Documentation:${NC}
   Architecture: docs/architecture/ARCHITECTURE.md
   Quick reference: CLAUDE.md
   API reference: docs/reference/API_REFERENCE.md

EOF
}

# Main installation flow
main() {
  echo ""
  log_info "OmniRoute Installation Script"
  echo ""

  check_node_version || exit 1
  check_npm || exit 1
  setup_env_file || exit 1
  install_dependencies || exit 1
  validate_installation || exit 1

  echo ""
  print_summary
  log_success "Installation complete!"
}

main "$@"
