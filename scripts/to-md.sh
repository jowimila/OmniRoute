#!/bin/bash
# Convert documents to markdown using MarkItDown MCP server
#
# Usage:
#   ./scripts/to-md.sh <file-or-url> [output-dir]
#   ./scripts/to-md.sh document.pdf
#   ./scripts/to-md.sh https://example.com
#   ./scripts/to-md.sh document.docx ./docs/

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INPUT="${1:-}"
OUTPUT_DIR="${2:-.}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Helper functions
log() {
  echo -e "${BLUE}[to-md]${NC} $*"
}

success() {
  echo -e "${GREEN}✓${NC} $*"
}

error() {
  echo -e "${RED}✗${NC} $*" >&2
}

warn() {
  echo -e "${YELLOW}⚠${NC} $*"
}

show_help() {
  cat << 'EOF'
Convert documents to markdown using MarkItDown MCP server

Usage:
  ./scripts/to-md.sh <file-or-url> [output-dir]

Examples:
  # Convert local document
  ./scripts/to-md.sh document.pdf

  # Convert web page
  ./scripts/to-md.sh https://example.com

  # Specify output directory
  ./scripts/to-md.sh document.docx ./output/

  # Convert all PDFs in directory
  find . -name "*.pdf" -exec ./scripts/to-md.sh {} \;

Supported Formats:
  - Documents: PDF, DOCX, PPTX, XLSX
  - Web pages: HTTP/HTTPS URLs
  - Images: PNG, JPG, GIF, WebP, BMP (with OCR)
  - Local files: file:// URIs
  - Data URIs

Requirements:
  - Python 3.7+
  - markitdown-mcp package (pip install -r requirements-markitdown.txt)
  - System dependencies: pandoc, poppler-utils

Options:
  -h, --help     Show this help message
  -v, --verbose  Verbose output

EOF
}

# Parse arguments
case "${INPUT}" in
  -h|--help)
    show_help
    exit 0
    ;;
  "")
    error "Missing input file or URL"
    show_help
    exit 1
    ;;
esac

# Validate input
if [[ "${INPUT}" != http://* ]] && [[ "${INPUT}" != https://* ]] && [[ ! -f "${INPUT}" ]]; then
  error "Input file not found: ${INPUT}"
  exit 1
fi

# Create output directory if needed
mkdir -p "${OUTPUT_DIR}"

# Determine output filename
if [[ "${INPUT}" == http://* ]] || [[ "${INPUT}" == https://* ]]; then
  # For URLs, use domain name or a safe filename
  DOMAIN=$(echo "${INPUT}" | sed -E 's|https?://||' | cut -d'/' -f1 | sed 's/\./-/g')
  OUTPUT_FILE="${OUTPUT_DIR}/${DOMAIN}.md"
  INPUT_TYPE="URL"
  INPUT_DISPLAY="${INPUT}"
else
  # For files, use basename with .md extension
  BASENAME=$(basename "${INPUT%.*}")
  OUTPUT_FILE="${OUTPUT_DIR}/${BASENAME}.md"
  INPUT_TYPE="File"
  INPUT_DISPLAY="${INPUT}"
fi

log "Converting ${INPUT_TYPE}: ${INPUT_DISPLAY}"
log "Output: ${OUTPUT_FILE}"

# Check Python and markitdown-mcp
if ! command -v python3 &> /dev/null; then
  error "Python 3 is not installed"
  exit 1
fi

if ! python3 -m markitdown_mcp --help &>/dev/null 2>&1; then
  error "markitdown-mcp is not installed"
  error "Install with: pip install -r ${PROJECT_ROOT}/requirements-markitdown.txt"
  exit 1
fi

# Create temporary Python script to convert
TEMP_SCRIPT=$(mktemp)
trap "rm -f ${TEMP_SCRIPT}" EXIT

cat > "${TEMP_SCRIPT}" << 'PYTHON_EOF'
import sys
import json
from pathlib import Path

# Handle markitdown-mcp import with fallback
try:
  import markitdown
except ImportError:
  try:
    from markitdown_mcp import markitdown
  except ImportError:
    print("Error: markitdown module not found", file=sys.stderr)
    sys.exit(1)

input_uri = sys.argv[1]
output_path = sys.argv[2]

try:
  md = markitdown.MarkItDown()
  result = md.convert(input_uri)

  Path(output_path).write_text(result.text_content)
  print(json.dumps({
    "success": True,
    "output": output_path,
    "size": len(result.text_content)
  }))
except Exception as e:
  print(json.dumps({
    "success": False,
    "error": str(e)
  }), file=sys.stderr)
  sys.exit(1)
PYTHON_EOF

# Run conversion
RESULT=$(python3 "${TEMP_SCRIPT}" "${INPUT}" "${OUTPUT_FILE}" 2>&1 || echo '{"success":false,"error":"Conversion failed"}')

if echo "${RESULT}" | python3 -c "import sys, json; d=json.load(sys.stdin); sys.exit(0 if d.get('success') else 1)" 2>/dev/null; then
  SIZE=$(echo "${RESULT}" | python3 -c "import sys, json; print(json.load(sys.stdin).get('size', 0))")
  success "Converted to markdown ($(numfmt --to=iec-i --suffix=B -- $SIZE 2>/dev/null || echo "${SIZE} bytes"))"
  success "Output: ${OUTPUT_FILE}"
  exit 0
else
  ERROR=$(echo "${RESULT}" | python3 -c "import sys, json; print(json.load(sys.stdin).get('error', 'Unknown error'))" 2>/dev/null || echo "Conversion failed")
  error "${ERROR}"
  exit 1
fi
