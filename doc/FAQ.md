# Frequently Asked Questions

## General Questions

### What is veda-node-queue-consumer?

A Node.js module for consuming messages from Veda file-based queues. It uses Rust for high-performance queue operations and provides a simple JavaScript API.

### Why use file-based queues?

File-based queues provide:
- Persistence (messages survive crashes)
- No external dependencies (no separate queue server)
- Simple deployment
- Direct file system access for debugging

### Is it production-ready?

Yes, the module is used in production Veda installations.

## Installation Questions

### Build fails with "cargo: command not found"

Install Rust toolchain:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### Build fails with "nanomsg not found"

Install nanomsg library:

```bash
# Ubuntu/Debian
sudo apt-get install libnanomsg-dev

# CentOS/RHEL
sudo yum install nanomsg-devel

# macOS
brew install nanomsg
```

### Can I use pre-built binaries?

The module builds the native component during `npm install`. Pre-built binaries are not currently distributed due to platform variations.

## Configuration Questions

### What happens if I don't commit?

Without committing, the consumer will re-process messages from the last committed position on restart. Set `commitThreshold` appropriately for your use case.

### How often should I commit?

Depends on your requirements:
- **Throughput priority:** Higher threshold (1000+)
- **Reliability priority:** Lower threshold (1-100)
- **Balanced:** 500-1000

### Can multiple consumers read the same queue?

Yes! Each consumer tracks its own position independently. Give each consumer a unique `name`.

```javascript
// Consumer 1
const consumer1 = new MyModule({ name: 'consumer-1', ... });

// Consumer 2
const consumer2 = new MyModule({ name: 'consumer-2', ... });
```

### What is notifyChannelUrl used for?

The notification channel allows the queue producer to notify consumers when new messages are available. Without it, consumers rely only on polling (queueDelay).

## Usage Questions

### How do I stop the consumer gracefully?

Send SIGINT (Ctrl+C) or SIGTERM signal. The consumer will:
1. Stop processing new messages
2. Commit current position
3. Call `beforeStop()` hook
4. Exit cleanly

### What happens on error in process()?

By default, the process exits. This is a fail-fast approach to prevent data corruption. Override this behavior if needed:

```javascript
async process(el) {
  try {
    await this.doProcess(el);
  } catch (error) {
    console.error('Error:', error);
    // Handle error without crashing
  }
}
```

### How do I process only specific message types?

Filter in your `process()` method:

```javascript
async process(el) {
  if (el.cmd !== 'put') return;
  if (!el.new_state) return;
  
  const types = el.new_state['rdf:type'] || [];
  const isTargetType = types.some(t => t.data === 'v-s:Person');
  
  if (isTargetType) {
    // Process only v-s:Person
  }
}
```

### How do I access nested properties?

Individual properties are arrays of resources:

```javascript
async process(el) {
  const individual = el.new_state;
  
  // Get first value
  const firstName = individual['v-s:firstName']?.[0]?.data;
  
  // Get all values
  const allNames = individual['v-s:firstName']?.map(r => r.data) || [];
  
  // Get with language
  const ruLabel = individual['rdfs:label']?.find(r => r.lang === 'RU')?.data;
}
```

## Performance Questions

### How fast can it process messages?

Processing speed depends on:
- Your `process()` function complexity
- Disk I/O speed
- Network latency (if accessing external services)
- Commit frequency

Typical rates: 100-10000 messages/second

### Does it support parallel processing?

The consumer processes messages sequentially. For parallel processing:

1. Run multiple consumer instances with different names
2. Use a worker pool in your `process()` function
3. Partition your queue and run one consumer per partition

### How can I improve performance?

- Increase `commitThreshold` for less frequent commits
- Reduce logging (`logLevel: 'error'`)
- Optimize your `process()` function
- Use batch operations in external services
- Consider running multiple consumers

## Data Questions

### What is the message format?

Queue elements have this structure:

```javascript
{
  cmd: 'put' | 'remove',
  op_id: Number,
  uri: String,
  prev_state: Individual | undefined,
  new_state: Individual | undefined
}
```

Individual format:

```javascript
{
  '@': 'uri',
  'predicate': [
    { data: value, type: 'String'|'Integer'|..., lang: 'EN'|'RU'|... }
  ]
}
```

### What data types are supported?

- String (with optional language)
- Integer
- Decimal (floating point)
- Boolean
- Datetime (JavaScript Date)
- Uri (reference to another individual)

### How do I handle binary data?

Binary data is not directly supported in queue messages. Store binary files separately and reference them via URI.

## Troubleshooting

### Consumer stops processing

Check:
1. Queue directory permissions
2. Disk space
3. Lock files (remove stale `*.lock` files)
4. nanomsg connection
5. Logs for errors

### Messages are reprocessed after restart

This is normal if you haven't called `commit()`. Ensure:
- `commitThreshold` is set appropriately
- Consumer runs long enough to commit
- No crashes between processing and commit

### "Queue empty" but messages exist

Possible causes:
1. Consumer is behind (check partition numbers)
2. Lock file issues (remove stale locks)
3. Queue corruption (check queue files)

Try:
```javascript
consumer.refreshQueue();
```

### High CPU usage

Reduce CPU usage:
- Increase `queueDelay` (check less frequently when empty)
- Reduce logging verbosity
- Check for tight loops in `process()`

### Memory leak

Check:
- Are you accumulating data in class properties?
- Are you closing connections in `process()`?
- Is `process()` creating timers/intervals?

## Advanced Questions

### Can I seek to a specific position?

Yes, using low-level API:

```javascript
const consumer = new QueueConsumer({ ... });
consumer.setPart(42);  // Jump to partition 42
```

### Can I read messages without committing?

Yes, just don't call `commit()`. Position won't advance on disk.

### Can I write to the queue?

This module is for consuming only. Use Veda queue writer for producing messages.

### How do I monitor consumer lag?

Use low-level QueueConsumer API to compare partitions:

```javascript
import QueueConsumer from './QueueConsumer.js';

class MyModule extends QueueModule {
  #monitorConsumer;
  
  async beforeStart() {
    this.#monitorConsumer = new QueueConsumer(this.options);
  }
  
  async process(el) {
    const currentPart = this.#monitorConsumer.getPart();
    const maxPart = this.#monitorConsumer.getMaxPart();
    const lag = maxPart - currentPart;
    
    if (lag > 10) {
      console.warn('Consumer is lagging:', lag, 'partitions behind');
    }
  }
}
```

### Can I process messages in reverse order?

No, the queue is designed for sequential forward reading only.

### What happens to unprocessed messages?

Messages remain in the queue until:
- A consumer reads and commits past them
- Queue files are manually deleted
- Queue retention policy deletes old partitions (if configured)

## Integration Questions

### Can I use with TypeScript?

Yes, but you'll need to create type definitions:

```typescript
// types.d.ts
declare module 'veda-node-queue-consumer' {
  export interface QueueOptions {
    name: string;
    path: string;
    queue: string;
    notifyChannelUrl: string;
    queueDelay?: number;
    commitThreshold?: number;
    logLevel?: string;
  }

  export interface QueueElement {
    cmd?: 'put' | 'remove';
    op_id?: number;
    uri?: string;
    prev_state?: any;
    new_state?: any;
  }

  export class QueueModule {
    constructor(options: QueueOptions);
    beforeStart(): Promise<void>;
    beforeStop(): Promise<void>;
    process(el: QueueElement): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
  }

  export default QueueModule;
}
```

### Can I use with Express/HTTP server?

Yes, start the consumer alongside your server:

```javascript
import express from 'express';
import QueueModule from 'veda-node-queue-consumer';

const app = express();

class MyConsumer extends QueueModule {
  async process(el) { /* ... */ }
}

const consumer = new MyConsumer({ ... });

app.listen(3000, () => {
  console.log('Server started');
  consumer.start();
});
```

### Can I use with Docker?

Yes, see [Installation Guide](Installation.md#docker-deployment) for Dockerfile example.

### Can I use with PM2?

Yes:

```json
{
  "apps": [{
    "name": "queue-consumer",
    "script": "./my-consumer.js",
    "instances": 1,
    "exec_mode": "fork",
    "env": {
      "NODE_ENV": "production"
    }
  }]
}
```

```bash
pm2 start ecosystem.config.json
```

