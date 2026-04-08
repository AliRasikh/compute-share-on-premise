#!/usr/bin/env bash
# ============================================================================
# Sovereign Compute Engine — Node Installer
# One-command installer to join a machine to the compute cluster
#
# Usage:
#   curl -sSL https://your-domain/install.sh | bash -s -- \
#     --server 10.0.0.1:4647 \
#     --company "acme-corp" \
#     --datacenter "eu-west"
#
# Or download and run:
#   chmod +x install.sh
#   ./install.sh --server 10.0.0.1:4647 --company "acme-corp"
# ============================================================================

set -euo pipefail

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# ── Branding ────────────────────────────────────────────────────────────────
print_banner() {
    echo -e "${CYAN}"
    echo "  ╔═══════════════════════════════════════════════════════════╗"
    echo "  ║                                                           ║"
    echo "  ║   ⚡ SOVEREIGN COMPUTE ENGINE ⚡                          ║"
    echo "  ║                                                           ║"
    echo "  ║   Federated • Sovereign • Open Source                     ║"
    echo "  ║   Peer-to-Peer Compute Sharing for the EU                 ║"
    echo "  ║                                                           ║"
    echo "  ╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log_info()    { echo -e "${BLUE}[INFO]${NC}    $1"; }
log_success() { echo -e "${GREEN}[✓]${NC}       $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}    $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC}   $1"; }
log_step()    { echo -e "\n${BOLD}${CYAN}━━━ $1 ━━━${NC}\n"; }

# ── Defaults ────────────────────────────────────────────────────────────────
NOMAD_VERSION="1.9.7"
NODE_EXPORTER_VERSION="1.8.2"
NOMAD_SERVER=""
COMPANY_NAME="default"
DATACENTER="dc1"
NODE_POOL="shared"
DATA_DIR="/opt/nomad"
SKIP_DOCKER=false
SKIP_EXPORTER=false
DRY_RUN=false

# ── Parse Args ──────────────────────────────────────────────────────────────
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Required:"
    echo "  --server ADDR         Nomad server address (e.g., 10.0.0.1:4647)"
    echo ""
    echo "Optional:"
    echo "  --company NAME        Company/org name for node tagging (default: default)"
    echo "  --datacenter DC       Datacenter name (default: dc1)"
    echo "  --node-pool POOL      Node pool name (default: shared)"
    echo "  --data-dir DIR        Nomad data directory (default: /opt/nomad)"
    echo "  --nomad-version VER   Nomad version to install (default: ${NOMAD_VERSION})"
    echo "  --skip-docker         Skip Docker installation"
    echo "  --skip-exporter       Skip node_exporter installation"
    echo "  --dry-run             Show what would be done without executing"
    echo "  -h, --help            Show this help message"
    exit 0
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --server)        NOMAD_SERVER="$2"; shift 2 ;;
        --company)       COMPANY_NAME="$2"; shift 2 ;;
        --datacenter)    DATACENTER="$2"; shift 2 ;;
        --node-pool)     NODE_POOL="$2"; shift 2 ;;
        --data-dir)      DATA_DIR="$2"; shift 2 ;;
        --nomad-version) NOMAD_VERSION="$2"; shift 2 ;;
        --skip-docker)   SKIP_DOCKER=true; shift ;;
        --skip-exporter) SKIP_EXPORTER=true; shift ;;
        --dry-run)       DRY_RUN=true; shift ;;
        -h|--help)       usage ;;
        *)               log_error "Unknown option: $1"; usage ;;
    esac
done

# ── Validation ──────────────────────────────────────────────────────────────
if [[ -z "$NOMAD_SERVER" ]]; then
    log_error "Missing required --server argument"
    echo ""
    usage
fi

if [[ $EUID -ne 0 ]]; then
    log_error "This script must be run as root (use sudo)"
    exit 1
fi

# ── System Detection ────────────────────────────────────────────────────────
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    elif [ -f /etc/redhat-release ]; then
        OS="centos"
    else
        log_error "Unsupported operating system"
        exit 1
    fi
    
    ARCH=$(uname -m)
    case $ARCH in
        x86_64)  ARCH="amd64" ;;
        aarch64) ARCH="arm64" ;;
        *)       log_error "Unsupported architecture: $ARCH"; exit 1 ;;
    esac
    
    # Detect system resources
    CPU_CORES=$(nproc)
    TOTAL_MEM_MB=$(free -m | awk '/^Mem:/{print $2}')
    TOTAL_DISK_GB=$(df -BG / | awk 'NR==2{print $2}' | tr -d 'G')
    
    # Detect GPU
    GPU_PRESENT=false
    GPU_TYPE="none"
    if command -v nvidia-smi &> /dev/null; then
        GPU_PRESENT=true
        GPU_TYPE="nvidia"
    elif command -v rocm-smi &> /dev/null; then
        GPU_PRESENT=true
        GPU_TYPE="amd"
    fi
    
    log_info "OS: ${OS} ${OS_VERSION} (${ARCH})"
    log_info "CPU: ${CPU_CORES} cores"
    log_info "Memory: ${TOTAL_MEM_MB} MB"
    log_info "Disk: ${TOTAL_DISK_GB} GB"
    log_info "GPU: ${GPU_TYPE}"
}

# ── Install Docker ──────────────────────────────────────────────────────────
install_docker() {
    if $SKIP_DOCKER; then
        log_warn "Skipping Docker installation (--skip-docker)"
        return
    fi
    
    if command -v docker &> /dev/null; then
        log_success "Docker already installed: $(docker --version)"
        return
    fi
    
    log_step "Installing Docker"
    
    case $OS in
        ubuntu|debian)
            apt-get update -qq
            apt-get install -y -qq ca-certificates curl gnupg lsb-release
            
            install -m 0755 -d /etc/apt/keyrings
            curl -fsSL "https://download.docker.com/linux/${OS}/gpg" | \
                gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            chmod a+r /etc/apt/keyrings/docker.gpg
            
            echo "deb [arch=${ARCH} signed-by=/etc/apt/keyrings/docker.gpg] \
                https://download.docker.com/linux/${OS} $(lsb_release -cs) stable" | \
                tee /etc/apt/sources.list.d/docker.list > /dev/null
            
            apt-get update -qq
            apt-get install -y -qq docker-ce docker-ce-cli containerd.io
            ;;
        centos|rhel|fedora|rocky|almalinux)
            yum install -y yum-utils
            yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            yum install -y docker-ce docker-ce-cli containerd.io
            ;;
        *)
            log_error "Unsupported OS for Docker installation: $OS"
            exit 1
            ;;
    esac
    
    systemctl enable docker
    systemctl start docker
    log_success "Docker installed and started"
}

# ── Install Nomad ───────────────────────────────────────────────────────────
install_nomad() {
    if command -v nomad &> /dev/null; then
        INSTALLED_VERSION=$(nomad version | head -1 | grep -oP 'v\K[0-9.]+')
        if [[ "$INSTALLED_VERSION" == "$NOMAD_VERSION" ]]; then
            log_success "Nomad ${NOMAD_VERSION} already installed"
            return
        fi
        log_warn "Nomad ${INSTALLED_VERSION} found, upgrading to ${NOMAD_VERSION}"
    fi
    
    log_step "Installing Nomad ${NOMAD_VERSION}"
    
    NOMAD_URL="https://releases.hashicorp.com/nomad/${NOMAD_VERSION}/nomad_${NOMAD_VERSION}_linux_${ARCH}.zip"
    
    # Install unzip if needed
    if ! command -v unzip &> /dev/null; then
        case $OS in
            ubuntu|debian) apt-get install -y -qq unzip ;;
            centos|rhel|fedora|rocky|almalinux) yum install -y unzip ;;
        esac
    fi
    
    TMP_DIR=$(mktemp -d)
    log_info "Downloading Nomad from ${NOMAD_URL}"
    curl -sSL "$NOMAD_URL" -o "${TMP_DIR}/nomad.zip"
    unzip -o "${TMP_DIR}/nomad.zip" -d "${TMP_DIR}"
    install -m 0755 "${TMP_DIR}/nomad" /usr/local/bin/nomad
    rm -rf "$TMP_DIR"
    
    # Create nomad user
    if ! id nomad &>/dev/null; then
        useradd --system --home "$DATA_DIR" --shell /bin/false nomad
    fi
    
    # Create directories
    mkdir -p "$DATA_DIR"/{data,config}
    chown -R nomad:nomad "$DATA_DIR"
    
    log_success "Nomad ${NOMAD_VERSION} installed to /usr/local/bin/nomad"
}

# ── Install Node Exporter ───────────────────────────────────────────────────
install_node_exporter() {
    if $SKIP_EXPORTER; then
        log_warn "Skipping node_exporter installation (--skip-exporter)"
        return
    fi
    
    if command -v node_exporter &> /dev/null || [ -f /usr/local/bin/node_exporter ]; then
        log_success "node_exporter already installed"
        return
    fi
    
    log_step "Installing Prometheus node_exporter ${NODE_EXPORTER_VERSION}"
    
    NE_URL="https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/node_exporter-${NODE_EXPORTER_VERSION}.linux-${ARCH}.tar.gz"
    
    TMP_DIR=$(mktemp -d)
    curl -sSL "$NE_URL" -o "${TMP_DIR}/node_exporter.tar.gz"
    tar xzf "${TMP_DIR}/node_exporter.tar.gz" -C "${TMP_DIR}"
    install -m 0755 "${TMP_DIR}/node_exporter-${NODE_EXPORTER_VERSION}.linux-${ARCH}/node_exporter" /usr/local/bin/node_exporter
    rm -rf "$TMP_DIR"
    
    # Create systemd service
    cat > /etc/systemd/system/node_exporter.service << 'EOF'
[Unit]
Description=Prometheus Node Exporter
Documentation=https://prometheus.io/docs/guides/node-exporter/
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=nobody
Group=nobody
ExecStart=/usr/local/bin/node_exporter \
    --web.listen-address=":9100" \
    --collector.cpu \
    --collector.meminfo \
    --collector.diskstats \
    --collector.filesystem \
    --collector.loadavg \
    --collector.netdev
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable node_exporter
    systemctl start node_exporter
    
    log_success "node_exporter installed and listening on :9100"
}

# ── Configure Nomad Client ──────────────────────────────────────────────────
configure_nomad() {
    log_step "Configuring Nomad Client"
    
    # Calculate reserved resources (~10% for OS)
    RESERVED_CPU=$((CPU_CORES * 100))  # Reserve 100MHz per core
    RESERVED_MEM=$((TOTAL_MEM_MB / 10))  # Reserve 10% memory
    
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    CONFIG_FILE="${DATA_DIR}/config/client.hcl"
    
    cat > "$CONFIG_FILE" << NOMADEOF
# ============================================================================
# Sovereign Compute Engine — Nomad Client Configuration
# Generated by install.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Company: ${COMPANY_NAME}
# ============================================================================

# Datacenter and region
datacenter = "${DATACENTER}"
data_dir   = "${DATA_DIR}/data"

# Bind to all interfaces
bind_addr = "0.0.0.0"

# ── Client Configuration ────────────────────────────────────────────────────
client {
  enabled = true

  # Connect to Nomad server(s)
  servers = ["${NOMAD_SERVER}"]

  # Node pool for workload placement
  node_pool = "${NODE_POOL}"

  # Node metadata — used for scheduling constraints & dashboard display
  meta {
    "company"       = "${COMPANY_NAME}"
    "datacenter"    = "${DATACENTER}"
    "cpu_cores"     = "${CPU_CORES}"
    "memory_mb"     = "${TOTAL_MEM_MB}"
    "disk_gb"       = "${TOTAL_DISK_GB}"
    "gpu_type"      = "${GPU_TYPE}"
    "gpu_present"   = "${GPU_PRESENT}"
    "install_date"  = "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    "node_exporter" = "http://{{ env "attr.unique.network.ip-address" }}:9100"
  }

  # Reserve resources for the OS
  reserved {
    cpu    = ${RESERVED_CPU}
    memory = ${RESERVED_MEM}
  }
}

# ── Docker Plugin Configuration ─────────────────────────────────────────────
plugin "docker" {
  config {
    # Allow privileged containers (needed for some AI workloads)
    allow_privileged = false

    # Volume configuration
    volumes {
      enabled = true
    }

    # Pull timeout for large AI model images
    pull_activity_timeout = "30m"
  }
}

# ── Telemetry — Prometheus Metrics ───────────────────────────────────────────
telemetry {
  publish_allocation_metrics = true
  publish_node_metrics       = true
  prometheus_metrics         = true
  collection_interval        = "5s"

  # Disable hostname prefix for cleaner metric names
  disable_hostname = true
}

# ── Logging ──────────────────────────────────────────────────────────────────
log_level = "INFO"
log_file  = "${DATA_DIR}/logs/nomad.log"

# ── CORS — Allow dashboard to query Nomad directly if needed ─────────────────
# Note: In production, the API gateway should proxy these requests
NOMADEOF
    
    # Create log directory
    mkdir -p "${DATA_DIR}/logs"
    chown -R nomad:nomad "$DATA_DIR"
    
    log_success "Nomad client config written to ${CONFIG_FILE}"
}

# ── Create Nomad systemd service ────────────────────────────────────────────
create_nomad_service() {
    log_step "Creating Nomad systemd service"
    
    cat > /etc/systemd/system/nomad.service << EOF
[Unit]
Description=HashiCorp Nomad - Sovereign Compute Engine Client
Documentation=https://www.nomadproject.io/docs/
Wants=network-online.target
After=network-online.target docker.service
Requires=docker.service

[Service]
Type=simple
User=root
Group=root
ExecReload=/bin/kill -HUP \$MAINPID
ExecStart=/usr/local/bin/nomad agent -config ${DATA_DIR}/config
KillMode=process
KillSignal=SIGINT
LimitNOFILE=65536
LimitNPROC=infinity
Restart=on-failure
RestartSec=5
TasksMax=infinity
OOMScoreAdjust=-1000

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable nomad
    systemctl start nomad
    
    log_success "Nomad client service started"
}

# ── Health Check ────────────────────────────────────────────────────────────
health_check() {
    log_step "Running health checks"
    
    # Wait for Nomad to start
    log_info "Waiting for Nomad to initialize..."
    for i in {1..30}; do
        if nomad node status &>/dev/null; then
            break
        fi
        sleep 1
    done
    
    # Check Docker
    if docker info &>/dev/null; then
        log_success "Docker: running"
    else
        log_error "Docker: not running"
    fi
    
    # Check Nomad
    if nomad node status &>/dev/null; then
        NODE_ID=$(nomad node status -self -json 2>/dev/null | grep -o '"ID":"[^"]*"' | head -1 | cut -d'"' -f4)
        log_success "Nomad: connected (Node ID: ${NODE_ID:0:8}...)"
    else
        log_warn "Nomad: waiting for server connection (this is normal if server isn't running yet)"
    fi
    
    # Check node_exporter
    if ! $SKIP_EXPORTER; then
        if curl -s http://localhost:9100/metrics > /dev/null 2>&1; then
            log_success "node_exporter: serving metrics on :9100"
        else
            log_warn "node_exporter: not responding yet"
        fi
    fi
}

# ── Print Summary ───────────────────────────────────────────────────────────
print_summary() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}              ${GREEN}${BOLD}Installation Complete! 🎉${NC}                  ${CYAN}║${NC}"
    echo -e "${CYAN}╠═══════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC}                                                           ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  Company:      ${BOLD}${COMPANY_NAME}${NC}"
    echo -e "${CYAN}║${NC}  Datacenter:   ${BOLD}${DATACENTER}${NC}"
    echo -e "${CYAN}║${NC}  Server:       ${BOLD}${NOMAD_SERVER}${NC}"
    echo -e "${CYAN}║${NC}  Resources:    ${BOLD}${CPU_CORES} CPUs, ${TOTAL_MEM_MB}MB RAM, ${TOTAL_DISK_GB}GB Disk${NC}"
    echo -e "${CYAN}║${NC}  GPU:          ${BOLD}${GPU_TYPE}${NC}"
    echo -e "${CYAN}║${NC}                                                           ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${BOLD}Services:${NC}"
    echo -e "${CYAN}║${NC}    Nomad:          systemctl status nomad"
    echo -e "${CYAN}║${NC}    Docker:         systemctl status docker"
    if ! $SKIP_EXPORTER; then
    echo -e "${CYAN}║${NC}    node_exporter:  systemctl status node_exporter"
    fi
    echo -e "${CYAN}║${NC}                                                           ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${BOLD}Useful Commands:${NC}"
    echo -e "${CYAN}║${NC}    nomad node status           # Check node status"
    echo -e "${CYAN}║${NC}    nomad job status <name>     # Check job status"
    echo -e "${CYAN}║${NC}    journalctl -u nomad -f      # Follow Nomad logs"
    echo -e "${CYAN}║${NC}                                                           ${CYAN}║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# ── Main ────────────────────────────────────────────────────────────────────
main() {
    print_banner
    
    if $DRY_RUN; then
        log_warn "DRY RUN MODE — no changes will be made"
    fi
    
    detect_os
    install_docker
    install_nomad
    install_node_exporter
    configure_nomad
    create_nomad_service
    health_check
    print_summary
}

main "$@"
