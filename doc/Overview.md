# Veda Node Queue Consumer - Overview

## What is it?

veda-node-queue-consumer is a Node.js module for working with Veda queues. It provides a way to consume messages from file-based queues in a reliable and efficient manner.

## Key Features

- **Reliable message consumption**: Messages are consumed from persistent file-based queues
- **Batch processing**: Process multiple messages before committing
- **Auto-resume**: Automatically resumes processing when new messages arrive
- **Signal handling**: Graceful shutdown on SIGINT/SIGTERM
- **Native performance**: Uses Rust (via Neon) for queue operations

## Components

The module consists of three main components:

1. **QueueModule** - Base class for creating queue processing modules
2. **QueueConsumer** - Low-level queue consumer with direct queue operations
3. **QueueFeeder** - High-level queue processor that manages the consumption loop

## Architecture

The module uses a hybrid architecture:

- **JavaScript layer**: Provides high-level API and async processing logic
- **Rust layer**: Handles low-level queue file operations via Neon bindings

## Use Cases

- Processing data changes in Veda system
- Building event-driven workflows
- Implementing distributed task processing
- Creating reliable message consumers

## Requirements

- Node.js (ES modules support)
- Rust toolchain (for building native module)
- nanomsg library (for queue notifications)

