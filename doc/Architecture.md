# Architecture

## Overview

veda-node-queue-consumer uses a layered architecture with JavaScript providing high-level APIs and Rust handling low-level queue operations.

## Layers

```
┌─────────────────────────────────────┐
│      User Module (extends)          │
│        QueueModule                   │
└─────────────────────────────────────┘
                 │
                 │ uses
                 ▼
┌─────────────────────────────────────┐
│         QueueFeeder                  │
│    (manages processing loop)         │
└─────────────────────────────────────┘
                 │
                 │ uses
                 ▼
┌─────────────────────────────────────┐
│        QueueConsumer                 │
│    (JavaScript wrapper)              │
└─────────────────────────────────────┘
                 │
                 │ calls
                 ▼
┌─────────────────────────────────────┐
│      Native Bindings (Rust)          │
│         via Neon                     │
└─────────────────────────────────────┘
                 │
                 │ uses
                 ▼
┌─────────────────────────────────────┐
│        v_queue Library               │
│    (file-based queue)                │
└─────────────────────────────────────┘
```

## Components

### QueueModule (JavaScript)

**Purpose:** Base class providing lifecycle hooks and configuration management

**Responsibilities:**
- Store configuration options
- Provide lifecycle hooks (beforeStart, beforeStop, process)
- Delegate actual processing to QueueFeeder

**Key Methods:**
- `beforeStart()` - initialization hook
- `beforeStop()` - cleanup hook
- `process(el)` - message processing hook
- `start()` - delegates to QueueFeeder
- `stop()` - delegates to QueueFeeder

### QueueFeeder (JavaScript)

**Purpose:** Manages the message consumption loop and state machine

**Responsibilities:**
- Subscribe to queue notifications via nanomsg
- Handle OS signals (SIGINT, SIGTERM)
- Manage processing state (init, process, suspend, stop)
- Call user's process() function for each message
- Commit at configured intervals
- Auto-resume on queue updates

**States:**
- `init` - initial state
- `process` - actively processing messages
- `suspend` - queue is empty, waiting for notifications
- `stop` - stopping gracefully

**Flow:**
1. Start: call beforeStart hook, connect to notification channel
2. Process: loop popping and processing messages
3. Suspend: when queue empty, wait for signal or timer
4. Resume: on notification or timeout
5. Stop: on signal, commit and call beforeStop hook

### QueueConsumer (JavaScript)

**Purpose:** JavaScript wrapper around native Rust consumer

**Responsibilities:**
- Provide JavaScript-friendly API
- Call native Rust functions
- Store consumer instance reference

### Native Bindings (Rust)

**Purpose:** Bridge between JavaScript and Rust queue library

**Responsibilities:**
- Expose Rust functions to JavaScript via Neon
- Convert between JS and Rust types
- Manage native consumer instances
- Handle queue file I/O

**Key Functions:**
- Create and manage consumer instances
- Read queue metadata (partition IDs, batch sizes)
- Pop messages from queue
- Commit read positions
- Parse binary queue format into JS objects

### v_queue Library (Rust)

**Purpose:** Low-level queue implementation

**Responsibilities:**
- File-based queue storage
- Partition management
- Binary message format
- Checksum validation
- Read/write synchronization

## Queue Storage Format

Queue is stored in file system:

```
{path}/{queue}/
  ├── {queue}_info_queue          # Queue metadata
  ├── {queue}_queue.lock          # Queue lock file
  ├── {queue}_info_pop_{name}     # Consumer position
  └── {queue}-{N}/                # Partition N
      ├── {queue}_info_push       # Partition write metadata
      └── {queue}_queue           # Partition data file
```

Each consumer tracks its position independently via `{queue}_info_pop_{name}` file.

## Message Flow

1. **Producer** writes message to queue partition
2. **Producer** sends notification via nanomsg
3. **QueueFeeder** receives notification (or timer fires)
4. **QueueFeeder** calls consumer.pop()
5. **QueueConsumer** delegates to native binding
6. **Native binding** reads from queue file
7. **Native binding** parses binary format
8. **Native binding** returns JS object
9. **QueueFeeder** calls user's process() function
10. **QueueFeeder** commits position after N messages

## Threading Model

- JavaScript code runs in Node.js event loop (single-threaded)
- Rust code runs synchronously when called from JS
- No concurrent access to queue from single consumer
- Multiple consumers can read same queue (each tracks own position)

## Error Handling

- **Initialization errors**: throw and exit process
- **Processing errors**: log and exit process (fail-fast)
- **Queue errors**: 
  - Invalid checksum: skip to next message
  - Tail read failure: return empty element
  - EOF: suspend and wait for more data

## Notification System

Uses nanomsg pub/sub pattern:

- **Publisher**: Queue writer publishes to notification channel
- **Subscriber**: QueueFeeder subscribes to channel
- **Message**: Notification is just a signal (content ignored)
- **Effect**: Resume processing immediately instead of waiting for timer

