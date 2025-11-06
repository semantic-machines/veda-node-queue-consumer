# Installation Guide

## Prerequisites

Before installing veda-node-queue-consumer, ensure you have:

- **Node.js** 14.x or higher (with ES modules support)
- **Rust** toolchain (cargo, rustc)
- **Python** 3.x (for node-gyp)
- **C/C++ compiler** (gcc/clang on Linux, MSVC on Windows)
- **nanomsg** library

## System-specific Requirements

### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install -y build-essential python3 libnanomsg-dev
```

### CentOS/RHEL

```bash
sudo yum groupinstall "Development Tools"
sudo yum install python3 nanomsg-devel
```

### macOS

```bash
brew install nanomsg
```

### Installing Rust

If you don't have Rust installed:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

## Installing the Module

### From npm (when published)

```bash
npm install veda-node-queue-consumer
```

### From Source

```bash
git clone https://github.com/semantic-machines/veda-node-queue-consumer.git
cd veda-node-queue-consumer
npm install
```

This will:
1. Install JavaScript dependencies
2. Build the Rust native module
3. Copy the compiled binary to `index.node`

## Build Commands

### Development Build

```bash
npm run build-debug
```

### Production Build

```bash
npm run build-release
```

Production builds are slower to compile but run faster.

## Verification

Test that the module is installed correctly:

```javascript
// test-install.js
import QueueModule from 'veda-node-queue-consumer';

console.log('Module loaded:', QueueModule);
console.log('Installation successful!');
```

```bash
node test-install.js
```

## Running Tests

### Small Test Suite

```bash
cd test/small
node index.js
```

### Large Test Suite

```bash
cd test/big
node index.js
```

### All Tests

```bash
npm test
```

## Common Issues

### nanomsg not found

**Error:** `Cannot find module 'nanomsg'`

**Solution:** Install nanomsg library for your system

```bash
# Ubuntu/Debian
sudo apt-get install libnanomsg-dev

# macOS
brew install nanomsg
```

### Rust toolchain not found

**Error:** `cargo: command not found`

**Solution:** Install Rust toolchain

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Build fails with linker error

**Error:** Linker errors during build

**Solution:** Install build tools

```bash
# Ubuntu/Debian
sudo apt-get install build-essential

# macOS
xcode-select --install
```

### Wrong Node.js version

**Error:** Module requires ES modules support

**Solution:** Upgrade to Node.js 14.x or higher

```bash
# Using nvm
nvm install 16
nvm use 16
```

## Deployment

### Production Deployment

1. Build release version:

```bash
npm run build-release
```

2. Copy necessary files:
   - `index.node` (compiled native module)
   - `*.js` (JavaScript files)
   - `package.json`
   - `node_modules/` (or install on target)

3. Install production dependencies only:

```bash
npm install --production
```

### Docker Deployment

Example Dockerfile:

```dockerfile
FROM node:16

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libnanomsg-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Build release version
RUN npm run build-release

CMD ["node", "your-module.js"]
```

Build and run:

```bash
docker build -t my-queue-consumer .
docker run -v ./queue:/app/queue my-queue-consumer
```

