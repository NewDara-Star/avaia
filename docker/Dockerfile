# Avaia Onboarding Test Container
# Simulates a fresh user with no Claude CLI or config
#
# Usage (run from project root, not docker/ dir):
#   docker build -f docker/Dockerfile -t avaia-test .
#   docker run -it --rm avaia-test

FROM ubuntu:22.04

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 (required for Claude CLI and MCP)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Create test user (simulates fresh user)
RUN useradd -m -s /bin/bash testuser
USER testuser
WORKDIR /home/testuser

# Create app directory
RUN mkdir -p /home/testuser/avaia

# Copy only what we need for onboarding test
# Note: Build context should be project root
COPY --chown=testuser:testuser gui/setup_wizard.py /home/testuser/avaia/
COPY --chown=testuser:testuser gui/test_onboarding.py /home/testuser/avaia/

# Python deps for setup_wizard
RUN pip3 install --user --no-cache-dir requests

# Environment
ENV PATH="/home/testuser/.local/bin:$PATH"
ENV HOME=/home/testuser

# Test script runs preflight and reports status
CMD ["python3", "/home/testuser/avaia/test_onboarding.py"]
