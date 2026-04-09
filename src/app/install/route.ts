/**
 * GET /install
 *
 * Serves a bash bootstrap script that downloads the full installer from GitHub
 * and runs it with --server pre-configured.
 *
 * Usage:
 *   curl -fsSL https://corimb.garden/install | sudo bash -s -- \
 *     --company "your-company" \
 *     --datacenter "eu-west"
 */

import { resolve } from 'path';
import { readFile } from 'fs/promises';

const SERVER_ADDR = "95.179.248.242:4647";
const INSTALLER_URL =
  "https://raw.githubusercontent.com/AliRasikh/compute-share-on-premise/main/backend/installer/install.sh";

export async function GET() {
  let headscaleKey = "";
  try {
    const keyPath = resolve(process.cwd(), 'backend', 'headscale', 'data', 'current_auth_key.txt');
    headscaleKey = await readFile(keyPath, "utf-8");
    headscaleKey = headscaleKey.trim();
  } catch (e) {
    console.warn("Headscale key not found natively on disk, running without it.");
  }

  const script = `#!/usr/bin/env bash
# ============================================================================
# Corimb Compute — Node Bootstrap
# Downloads and runs the full installer with the cluster server pre-configured.
#
# Usage:
#   curl -fsSL https://corimb.garden/install | sudo bash -s -- \\
#     --company "your-company" --datacenter "eu-west"
# ============================================================================

set -euo pipefail

RED='\\033[0;31m'
GREEN='\\033[0;32m'
CYAN='\\033[0;36m'
BOLD='\\033[1m'
NC='\\033[0m'

echo -e "\${CYAN}"
echo "  ╔═══════════════════════════════════════════════╗"
echo "  ║                                               ║"
echo "  ║   ⚡ Corimb Compute — Node Installer ⚡       ║"
echo "  ║                                               ║"
echo "  ║   corimb.garden                               ║"
echo "  ║                                               ║"
echo "  ╚═══════════════════════════════════════════════╝"
echo -e "\${NC}"

# Ensure running as root
if [ "\$(id -u)" -ne 0 ]; then
  echo -e "\${RED}[ERROR]\${NC}   This installer must be run as root (use sudo)."
  exit 1
fi

# Check for curl or wget
if command -v curl &>/dev/null; then
  FETCH="curl -fsSL"
elif command -v wget &>/dev/null; then
  FETCH="wget -qO-"
else
  echo -e "\${RED}[ERROR]\${NC}   Neither curl nor wget found. Please install one first."
  exit 1
fi

INSTALLER_URL="${INSTALLER_URL}"
SERVER="${SERVER_ADDR}"
TMPFILE="$(mktemp /tmp/corimb-install-XXXXXX.sh)" 2>/dev/null || TMPFILE="/tmp/corimb-install-$$.sh"

echo -e "\${GREEN}[✓]\${NC}       Downloading installer from GitHub..."
$FETCH "\${INSTALLER_URL}" > "\${TMPFILE}"
chmod +x "\${TMPFILE}"

echo -e "\${GREEN}[✓]\${NC}       Server pre-configured: \${BOLD}\${SERVER}\${NC}"
echo -e "\${GREEN}[✓]\${NC}       Starting installation...\\n"

# Run the full installer, injecting --server and forwarding all user args
if [ -n "${headscaleKey}" ]; then
  bash "\${TMPFILE}" --server "\${SERVER}" --headscale-url "https://headscale.corimb.garden" --headscale-key "${headscaleKey}" "$@"
else
  bash "\${TMPFILE}" --server "\${SERVER}" "$@"
fi
EXIT_CODE=$?

# Cleanup
rm -f "\${TMPFILE}" 2>/dev/null || true

exit \${EXIT_CODE}
`;

  return new Response(script, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'inline; filename="install.sh"',
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
