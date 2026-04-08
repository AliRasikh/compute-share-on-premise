#!/usr/bin/env bash
# ============================================================================
# Sovereign Compute Engine — Start Nomad Server
#
# Quick start script for the Nomad server (control plane).
#
# Usage:
#   ./start-server.sh              # Start with config file
#   ./start-server.sh --dev        # Start in dev mode (no persistence)
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ⚡ Sovereign Compute Engine — Server"
echo -e "${NC}"

# Check if Nomad is installed
if ! command -v nomad &> /dev/null; then
    echo -e "${RED}[ERROR] Nomad is not installed.${NC}"
    echo "  Install it from: https://developer.hashicorp.com/nomad/install"
    echo ""
    echo "  Quick install (Linux):"
    echo "    wget https://releases.hashicorp.com/nomad/1.9.7/nomad_1.9.7_linux_amd64.zip"
    echo "    unzip nomad_1.9.7_linux_amd64.zip"
    echo "    sudo mv nomad /usr/local/bin/"
    exit 1
fi

if [[ "${1:-}" == "--dev" ]]; then
    echo -e "${GREEN}[✓] Starting Nomad in DEV mode${NC}"
    echo -e "    UI:  ${BOLD}http://localhost:4646/ui${NC}"
    echo -e "    API: ${BOLD}http://localhost:4646/v1/${NC}"
    echo ""
    echo "  Press Ctrl+C to stop."
    echo ""
    
    # Dev mode with CORS enabled for local dashboard development
    nomad agent -dev \
        -bind=0.0.0.0 \
        -network-interface=lo \
        -cors-allowed-origins="*" \
        -cors-allowed-headers="*"
else
    echo -e "${GREEN}[✓] Starting Nomad server with config${NC}"
    echo -e "    Config: ${BOLD}${SCRIPT_DIR}/nomad-server.hcl${NC}"
    echo -e "    UI:     ${BOLD}http://localhost:4646/ui${NC}"
    echo -e "    API:    ${BOLD}http://localhost:4646/v1/${NC}"
    echo ""
    
    # Create data directory
    sudo mkdir -p /opt/nomad/data
    
    nomad agent -config="${SCRIPT_DIR}/nomad-server.hcl"
fi
