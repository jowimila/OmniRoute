# auto-md Skill

Automatically convert documents to markdown using the MarkItDown MCP server.

## Commands

### `/md convert`
Convert a document file or web page to markdown.

**Usage:**
```bash
/md convert <file-or-url> [output-dir]
```

**Examples:**
```bash
# Convert local PDF
/md convert document.pdf

# Convert web page
/md convert https://example.com

# Convert to specific directory
/md convert presentation.pptx ./docs/
```

### `/md setup`
Set up system dependencies and Python packages for markdown conversion.

**Usage:**
```bash
/md setup [--python-only]
```

**Options:**
- `--python-only`: Skip system package installation, install Python packages only

### `/md status`
Check if all required dependencies are installed and accessible.

**Usage:**
```bash
/md status
```

## Features

- **Multi-format support**: PDF, Word, PowerPoint, Excel, web pages, images
- **Automatic staging**: Markdown files are auto-added to git when using the pre-commit hook
- **Error handling**: Clear error messages with troubleshooting guidance
- **Progress tracking**: Real-time conversion status and file size reporting

## System Dependencies

### macOS
```bash
brew install pandoc poppler
```

### Ubuntu/Debian
```bash
sudo apt install pandoc poppler-utils
```

## Python Setup

```bash
pip install -r requirements-markitdown.txt
```

## Supported Input Formats

| Type | Formats |
|------|---------|
| Documents | PDF, DOCX, PPTX, XLSX |
| Web | HTTP/HTTPS URLs |
| Images | PNG, JPG, GIF, WebP, BMP (with OCR) |
| Local | file:// URIs |
| Embedded | Data URIs |

## Integration with Git Hooks

To enable automatic markdown conversion on commit:

```bash
./scripts/integrations/install-hooks.sh
# or manually:
cp hooks/auto-md.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

The hook will:
1. Detect staged document files
2. Convert them to markdown
3. Stage the generated `.md` files automatically
4. Allow commit to proceed (non-blocking)

## Troubleshooting

### Command not found: pandoc
- **macOS**: Run `brew install pandoc poppler`
- **Linux**: Run `sudo apt install pandoc poppler-utils`

### Python module not found
```bash
pip install -r requirements-markitdown.txt --upgrade
python3 -m markitdown_mcp --help
```

### Conversion fails for specific file type
1. Check that the file isn't corrupted
2. Verify system dependencies: `which pandoc` and `which pdftotext`
3. Review conversion logs: `.git/hooks/auto-md.log`

## Environment Variables

- `PYTHON_CMD`: Override Python executable (default: `python3`)
- `TO_MD_OUTPUT`: Default output directory for conversions (default: current dir)
- `AUTO_MD_ENABLED`: Enable/disable auto-conversion hook (`true`/`false`)

## References

- [MarkItDown MCP](https://github.com/microsoft/markitdown/tree/main/packages/markitdown-mcp)
- [Setup Guide](../../SETUP_MARKITDOWN.md)
- [Conversion Script](../../scripts/to-md.sh)
- [Git Hook](../../hooks/auto-md.sh)
