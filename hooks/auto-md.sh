#!/bin/bash
# Git hook: Auto-convert documents to markdown on commit
#
# Install as pre-commit hook:
#   cp hooks/auto-md.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# This hook detects when document files are added/modified and automatically
# converts them to markdown, staging the generated .md files for commit.

set -e

# Colors for output
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TO_MD_SCRIPT="${PROJECT_ROOT}/scripts/to-md.sh"
CONVERTED_DIR="docs/converted"
LOG_FILE=".git/hooks/auto-md.log"

# Supported document extensions
DOCUMENT_EXTS=("pdf" "docx" "doc" "pptx" "ppt" "xlsx" "xls")

log() {
  echo -e "${BLUE}[auto-md]${NC} $*" | tee -a "${LOG_FILE}"
}

success() {
  echo -e "${GREEN}✓${NC} $*" | tee -a "${LOG_FILE}"
}

warn() {
  echo -e "${YELLOW}⚠${NC} $*" | tee -a "${LOG_FILE}"
}

error() {
  echo -e "${RED}✗${NC} $*" | tee -a "${LOG_FILE}"
}

# Check if to-md.sh exists
if [[ ! -f "${TO_MD_SCRIPT}" ]]; then
  warn "to-md.sh not found at ${TO_MD_SCRIPT} - skipping auto-md hook"
  exit 0
fi

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)

if [[ -z "${STAGED_FILES}" ]]; then
  exit 0
fi

# Track if any conversions were done
CONVERTED_COUNT=0
FAILED_COUNT=0

log "Checking staged files for document conversion..."

while IFS= read -r FILE; do
  # Skip if file doesn't exist (deleted files show in diff)
  [[ ! -f "${FILE}" ]] && continue

  # Extract file extension
  EXT="${FILE##*.}"
  EXT="${EXT,,}" # Convert to lowercase

  # Check if file matches supported document types
  if [[ ! " ${DOCUMENT_EXTS[@]} " =~ " ${EXT} " ]]; then
    continue
  fi

  log "Found document: ${FILE}"

  # Create output directory
  mkdir -p "${CONVERTED_DIR}"

  # Convert to markdown
  if "${TO_MD_SCRIPT}" "${FILE}" "${CONVERTED_DIR}" 2>>"${LOG_FILE}"; then
    BASENAME=$(basename "${FILE%.*}")
    MD_FILE="${CONVERTED_DIR}/${BASENAME}.md"

    if [[ -f "${MD_FILE}" ]]; then
      # Stage the generated markdown file
      git add "${MD_FILE}"
      success "Converted and staged: ${MD_FILE}"
      ((CONVERTED_COUNT++))
    fi
  else
    error "Failed to convert: ${FILE}"
    ((FAILED_COUNT++))
  fi
done <<< "${STAGED_FILES}"

# Print summary
if [[ ${CONVERTED_COUNT} -gt 0 ]] || [[ ${FAILED_COUNT} -gt 0 ]]; then
  echo ""
  log "Conversion Summary:"
  [[ ${CONVERTED_COUNT} -gt 0 ]] && success "${CONVERTED_COUNT} document(s) converted and staged"
  [[ ${FAILED_COUNT} -gt 0 ]] && error "${FAILED_COUNT} conversion(s) failed"

  if [[ ${FAILED_COUNT} -gt 0 ]]; then
    warn "Review ${LOG_FILE} for details"
    exit 0  # Non-blocking: don't prevent commit if conversions fail
  fi
fi

exit 0
