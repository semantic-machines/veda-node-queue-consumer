# Configuration Guide

## Configuration Options

All configuration is passed to `QueueModule` constructor via options object.

## Required Options

### name

Module name used in logs and for consumer tracking.

- **Type:** String
- **Required:** Yes
- **Example:** `'my-consumer'`

```javascript
const options = {
  name: 'document-processor'
};
```

### path

Base directory path where queue files are stored.

- **Type:** String
- **Required:** Yes
- **Example:** `'./queue'` or `'/var/veda/queue'`

```javascript
const options = {
  path: '/var/veda/queue'
};
```

### queue

Name of the queue to consume from.

- **Type:** String
- **Required:** Yes
- **Example:** `'individuals-flow'`

```javascript
const options = {
  queue: 'individuals-flow'
};
```

### notifyChannelUrl

nanomsg URL for receiving queue update notifications.

- **Type:** String
- **Required:** Yes
- **Format:** `'tcp://host:port'`
- **Example:** `'tcp://127.0.0.1:9323'`

```javascript
const options = {
  notifyChannelUrl: 'tcp://127.0.0.1:9323'
};
```

## Optional Options

### queueDelay

Delay in milliseconds before checking queue again when empty.

- **Type:** Number
- **Required:** No
- **Default:** 5000 (5 seconds)
- **Range:** 100 - 60000
- **Example:** `3000`

```javascript
const options = {
  queueDelay: 3000 // Check every 3 seconds
};
```

Lower values = more responsive to new messages, higher CPU usage.
Higher values = less CPU usage, slower response to new messages.

### commitThreshold

Number of messages to process before committing position to disk.

- **Type:** Number
- **Required:** No
- **Default:** 1000
- **Range:** 1 - 100000
- **Example:** `500`

```javascript
const options = {
  commitThreshold: 500 // Commit every 500 messages
};
```

Lower values = more frequent commits, safer but slower.
Higher values = less frequent commits, faster but riskier on crash.

### logLevel

Logging level for the module.

- **Type:** String
- **Required:** No
- **Default:** `'warn'`
- **Values:** `'trace'`, `'debug'`, `'info'`, `'warn'`, `'error'`, `'silent'`
- **Example:** `'info'`

```javascript
const options = {
  logLevel: 'info'
};
```

Levels (from most to least verbose):
- `trace` - All log messages
- `debug` - Debug information
- `info` - General information
- `warn` - Warnings only
- `error` - Errors only
- `silent` - No logging

## Complete Configuration Example

```javascript
const options = {
  // Required
  name: 'document-processor',
  path: '/var/veda/queue',
  queue: 'individuals-flow',
  notifyChannelUrl: 'tcp://127.0.0.1:9323',
  
  // Optional
  queueDelay: 5000,
  commitThreshold: 1000,
  logLevel: 'info'
};

const module = new MyModule(options);
```

## Environment-based Configuration

Load configuration from environment variables:

```javascript
const options = {
  name: process.env.CONSUMER_NAME || 'my-consumer',
  path: process.env.QUEUE_PATH || './queue',
  queue: process.env.QUEUE_NAME || 'individuals-flow',
  notifyChannelUrl: process.env.NOTIFY_URL || 'tcp://127.0.0.1:9323',
  queueDelay: parseInt(process.env.QUEUE_DELAY) || 5000,
  commitThreshold: parseInt(process.env.COMMIT_THRESHOLD) || 1000,
  logLevel: process.env.LOG_LEVEL || 'info'
};
```

Run with environment variables:

```bash
CONSUMER_NAME=my-processor \
QUEUE_PATH=/var/veda/queue \
QUEUE_NAME=individuals-flow \
NOTIFY_URL=tcp://127.0.0.1:9323 \
LOG_LEVEL=debug \
node my-module.js
```

## Configuration File

Load from JSON file:

```json
{
  "name": "document-processor",
  "path": "/var/veda/queue",
  "queue": "individuals-flow",
  "notifyChannelUrl": "tcp://127.0.0.1:9323",
  "queueDelay": 5000,
  "commitThreshold": 1000,
  "logLevel": "info"
}
```

```javascript
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./config.json', 'utf8'));
const module = new MyModule(config);
```

## Multiple Environments

Different configurations for different environments:

```javascript
const configs = {
  development: {
    name: 'dev-consumer',
    path: './queue',
    queue: 'individuals-flow',
    notifyChannelUrl: 'tcp://127.0.0.1:9323',
    queueDelay: 1000,
    commitThreshold: 10,
    logLevel: 'debug'
  },
  
  production: {
    name: 'prod-consumer',
    path: '/var/veda/queue',
    queue: 'individuals-flow',
    notifyChannelUrl: 'tcp://veda-server:9323',
    queueDelay: 5000,
    commitThreshold: 1000,
    logLevel: 'warn'
  }
};

const env = process.env.NODE_ENV || 'development';
const config = configs[env];

const module = new MyModule(config);
```

## Performance Tuning

### High Throughput

For maximum throughput with acceptable crash risk:

```javascript
const options = {
  commitThreshold: 10000,  // Commit less often
  queueDelay: 10000,       // Check less frequently when empty
  logLevel: 'error'        // Minimal logging
};
```

### High Reliability

For maximum reliability:

```javascript
const options = {
  commitThreshold: 1,      // Commit every message
  queueDelay: 1000,        // Check frequently
  logLevel: 'debug'        // Detailed logging
};
```

### Balanced

For good balance:

```javascript
const options = {
  commitThreshold: 1000,   // Default
  queueDelay: 5000,        // Default
  logLevel: 'info'         // Informative logging
};
```

## Queue File Structure

Understanding the queue directory structure:

```
{path}/{queue}/
  ├── {queue}_info_queue              # Queue metadata
  ├── {queue}_queue.lock              # Queue lock
  ├── {queue}_info_pop_{name}         # Your consumer's position
  ├── {queue}_info_pop_{name}.lock    # Your consumer's lock
  └── {queue}-{N}/                    # Partition N
      ├── {queue}_info_push           # Write position
      └── {queue}_queue               # Data file
```

Example for `individuals-flow` queue and `my-consumer`:

```
/var/veda/queue/individuals-flow/
  ├── individuals-flow_info_queue
  ├── individuals-flow_queue.lock
  ├── individuals-flow_info_pop_my-consumer
  ├── individuals-flow_info_pop_my-consumer.lock
  └── individuals-flow-0/
      ├── individuals-flow_info_push
      └── individuals-flow_queue
```

## Multiple Consumers

Multiple consumers can read from same queue:

```javascript
// Consumer 1
const consumer1 = new MyModule({
  name: 'consumer-1',  // Different name
  path: './queue',
  queue: 'individuals-flow',
  notifyChannelUrl: 'tcp://127.0.0.1:9323'
});

// Consumer 2
const consumer2 = new MyModule({
  name: 'consumer-2',  // Different name
  path: './queue',
  queue: 'individuals-flow',
  notifyChannelUrl: 'tcp://127.0.0.1:9323'
});
```

Each consumer maintains its own position in the queue independently.

## Validation

Validate configuration before use:

```javascript
function validateConfig(config) {
  if (!config.name) throw new Error('name is required');
  if (!config.path) throw new Error('path is required');
  if (!config.queue) throw new Error('queue is required');
  if (!config.notifyChannelUrl) throw new Error('notifyChannelUrl is required');
  
  if (config.queueDelay && config.queueDelay < 100) {
    throw new Error('queueDelay must be at least 100ms');
  }
  
  if (config.commitThreshold && config.commitThreshold < 1) {
    throw new Error('commitThreshold must be at least 1');
  }
  
  const validLogLevels = ['trace', 'debug', 'info', 'warn', 'error', 'silent'];
  if (config.logLevel && !validLogLevels.includes(config.logLevel)) {
    throw new Error(`logLevel must be one of: ${validLogLevels.join(', ')}`);
  }
  
  return true;
}

validateConfig(options);
const module = new MyModule(options);
```

