# NeuralMesh Node Agent

Cross-platform system monitoring agent written in Rust. Collects real-time metrics (CPU, memory, disk, network) and reports to NeuralMesh server via WebSocket.

## Features

- **Real-time Metrics**: CPU, memory, storage, network monitoring
- **Auto-classification**: Nodes classified as alpha/beta/gamma/delta based on specs
- **Cross-platform**: Works on Linux, macOS, Windows, and Android (via Termux)
- **Lightweight**: ~5MB binary, minimal resource usage
- **WebSocket**: Real-time bidirectional communication
- **Auto-reconnect**: Handles connection failures gracefully

## Quick Start

```bash
# Run agent (connects to default ws://localhost:3001)
./neuralmesh-agent

# Connect to custom server
./neuralmesh-agent --server ws://192.168.1.100:3001

# Set custom update interval (default 2s)
./neuralmesh-agent --interval 5

# Set custom node name
./neuralmesh-agent --name "my-server"
```

## Building from Source

```bash
cargo build --release
# Binary at target/release/neuralmesh-agent
```

## Node Types

- **Alpha**: 16+ cores, 32GB+ RAM (high-end servers)
- **Beta**: 8+ cores, 16GB+ RAM (mid-tier servers)
- **Gamma**: 4+ cores (desktops, mobile devices)
- **Delta**: <4 cores (IoT, Raspberry Pi)

## Android Setup

1. Install Termux from F-Droid
2. Install Rust: `pkg install rust`
3. Clone and build agent
4. Run in background with `termux-wake-lock`

## Protocol

Agent sends JSON messages via WebSocket:

### Register Event
```json
{
  "event": "node:register",
  "data": {
    "id": "uuid",
    "name": "gamma-hostname",
    "type": "gamma",
    "specs": { ... },
    "platform": { ... }
  }
}
```

### Metrics Event (periodic)
```json
{
  "event": "node:metrics",
  "data": { /* same as register */ }
}
```

## License

MIT
