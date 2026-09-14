# MarkItDown MCP Server Setup Guide

This guide helps you set up the **MarkItDown MCP Server** for OmniRoute document-to-markdown conversion.

## System Dependencies

### macOS
```bash
brew install pandoc poppler
```

### Ubuntu / Debian
```bash
sudo apt install pandoc poppler-utils
```

### Alpine / Docker
The main `Dockerfile` includes these automatically in the `runner-base` stage.

## Python Setup

### 1. Install Python Requirements
```bash
# Install markitdown-mcp Python package
pip install -r requirements-markitdown.txt

# Or install directly
pip install markitdown-mcp
```

### 2. Verify Installation
```bash
python3 -m markitdown_mcp --help
```

## Running the MarkItDown MCP Server

### Option A: STDIO Transport (IDE Integration)
Best for Claude Desktop, Cursor, Cline, or VS Code extensions.

```bash
# Using the provided launch script
./scripts/integrations/launch-markitdown-mcp.sh

# Or directly
python3 -m markitdown_mcp
```

### Option B: HTTP/SSE Transport (OmniRoute Integration)
For integration with OmniRoute's MCP server stack.

```bash
# Using the provided launch script
./scripts/integrations/launch-markitdown-mcp.sh --http --port 3001

# Or directly
python3 -m markitdown_mcp --http --host 127.0.0.1 --port 3001
```

### Via npm Scripts
```bash
# STDIO (IDE integration)
npm run mcp:markitdown

# HTTP/SSE (OmniRoute integration)
npm run mcp:markitdown:http
```

## Supported Input Formats

The MarkItDown MCP server converts to markdown:

- **Documents**: PDF, Word (.docx), PowerPoint (.pptx), Excel (.xlsx)
- **Web pages**: HTTP/HTTPS URLs
- **Images**: PNG, JPG, GIF, WebP, BMP (with OCR)
- **Local files**: `file://` URIs
- **Data URIs**: Base64-encoded content

## Testing

### Using MCP Inspector
```bash
npx @modelcontextprotocol/inspector
```

Then connect to `http://127.0.0.1:3001` (HTTP mode) or start the STDIO server separately.

### Manual Test
```bash
# Test document conversion
python3 -c "
from markitdown_mcp.server import convert_to_markdown
result = convert_to_markdown('https://example.com')
print(result)
"
```

## Troubleshooting

### `poppler` or `pandoc` not found
- **macOS**: Run `brew install pandoc poppler`
- **Ubuntu/Debian**: Run `sudo apt install pandoc poppler-utils`
- **Docker**: Rebuild the image; dependencies are auto-installed

### Python module not found
```bash
pip install -r requirements-markitdown.txt --upgrade
```

### Port already in use (HTTP mode)
```bash
./scripts/integrations/launch-markitdown-mcp.sh --http --port 3002
```

### Verify dependencies are installed
```bash
which pandoc
which pdftotext  # Part of poppler-utils
python3 -m markitdown_mcp --help
```

## References

- [MarkItDown MCP on GitHub](https://github.com/microsoft/markitdown/tree/main/packages/markitdown-mcp)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [Pandoc Documentation](https://pandoc.org/)
- [Poppler Documentation](https://poppler.freedesktop.org/)
