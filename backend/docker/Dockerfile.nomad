FROM python:3.11-slim

# ── Install Nomad ────────────────────────────────────────────────────────────
ARG NOMAD_VERSION=1.9.7
ARG TARGETARCH=amd64

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl unzip ca-certificates procps iproute2 stress-ng \
    && rm -rf /var/lib/apt/lists/*

RUN curl -sSL "https://releases.hashicorp.com/nomad/${NOMAD_VERSION}/nomad_${NOMAD_VERSION}_linux_${TARGETARCH}.zip" \
    -o /tmp/nomad.zip \
    && unzip /tmp/nomad.zip -d /usr/local/bin/ \
    && rm /tmp/nomad.zip \
    && chmod +x /usr/local/bin/nomad

# ── Install Python packages for demo workloads ──────────────────────────────
RUN pip install --no-cache-dir numpy requests psutil

# ── Create directories ──────────────────────────────────────────────────────
RUN mkdir -p /opt/nomad/data /opt/nomad/config /opt/nomad/logs /opt/nomad/alloc

# ── Entrypoint script (generates config from env vars) ───────────────────────
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 4646 4647 4648

ENTRYPOINT ["/entrypoint.sh"]
