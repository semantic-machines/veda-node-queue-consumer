# API Reference

## QueueModule

Base class for creating queue processing modules.

### Constructor

```javascript
new QueueModule(options)
```

**Parameters:**

- `options` - Configuration object with the following properties:
  - `name` - Module name (for logging)
  - `path` - Queue base directory path
  - `queue` - Queue name
  - `notifyChannelUrl` - nanomsg URL for queue notifications (e.g., 'tcp://127.0.0.1:9323')
  - `queueDelay` - Delay in ms before checking queue again when empty (default: 5000)
  - `commitThreshold` - Number of messages to process before committing (default: 1000)
  - `logLevel` - Log level: 'trace', 'debug', 'info', 'warn', 'error' (default: 'warn')

### Methods

#### beforeStart()

Async hook called before queue processing starts. Override to add initialization logic.

```javascript
async beforeStart() {
  // Your initialization code
}
```

#### beforeStop()

Async hook called before module stops. Override to add cleanup logic.

```javascript
async beforeStop() {
  // Your cleanup code
}
```

#### process(el)

Async hook called for each queue element. Override to implement message processing logic.

```javascript
async process(el) {
  // el.cmd - operation type: 'put' or 'remove'
  // el.op_id - operation ID
  // el.uri - individual URI
  // el.prev_state - previous state (object)
  // el.new_state - new state (object)
}
```

**Parameters:**

- `el` - Queue element object:
  - `cmd` - Operation type: `'put'` or `'remove'`
  - `op_id` - Operation ID (number)
  - `uri` - Individual URI (string)
  - `prev_state` - Previous individual state (object or undefined)
  - `new_state` - New individual state (object or undefined)

#### start()

Starts the queue processing.

```javascript
await myModule.start()
```

#### stop()

Stops the queue processing.

```javascript
await myModule.stop()
```

---

## QueueConsumer

Low-level queue consumer for direct queue operations.

### Constructor

```javascript
new QueueConsumer({path, queue, name})
```

**Parameters:**

- `path` - Queue base directory path
- `queue` - Queue name
- `name` - Consumer name

### Methods

#### getPart()

Returns current partition ID being read.

```javascript
const partId = consumer.getPart()
```

**Returns:** Number

#### setPart(part)

Opens specific queue partition.

```javascript
consumer.setPart(42)
```

**Parameters:**

- `part` - Partition ID to open

#### getRestSize()

Returns number of remaining messages in current batch.

```javascript
const remaining = consumer.getRestSize()
```

**Returns:** Number

#### getMaxPart()

Returns maximum (latest) partition ID.

```javascript
const maxPart = consumer.getMaxPart()
```

**Returns:** Number

#### refreshPart(part)

Refreshes metadata for specific partition.

```javascript
consumer.refreshPart(42)
```

**Parameters:**

- `part` - Partition ID to refresh

#### refreshQueue()

Refreshes queue metadata.

```javascript
consumer.refreshQueue()
```

#### pop()

Pops next element from queue.

```javascript
const element = consumer.pop()
```

**Returns:** Queue element object or empty object if no more elements

#### commit()

Commits current read position.

```javascript
consumer.commit()
```

---

## Individual Object Format

Individual state objects (prev_state, new_state) have the following structure:

```javascript
{
  "@": "individual-uri",
  "predicate1": [
    {
      "data": value,
      "type": "String" | "Integer" | "Decimal" | "Boolean" | "Datetime" | "Uri",
      "lang": "RU" | "EN" // only for String type
    }
  ],
  "predicate2": [...]
}
```

### Data Types

- **String**: `{data: "text", type: "String", lang: "EN"}`
- **Integer**: `{data: 42, type: "Integer"}`
- **Decimal**: `{data: 3.14, type: "Decimal"}`
- **Boolean**: `{data: true, type: "Boolean"}`
- **Datetime**: `{data: Date, type: "Datetime"}` (JavaScript Date object)
- **Uri**: `{data: "d:uri", type: "Uri"}`

---

## Native Bindings (Rust)

Low-level functions exported from Rust module (advanced use only):

- `consumerNew(path, name, queue)` - Create consumer instance
- `consumerGetPartId(consumer)` - Get current partition ID
- `consumerGetQueuePartId(consumer)` - Get maximum partition ID
- `consumerRefreshInfoOfPart(consumer, partId)` - Refresh partition info
- `consumerRefreshInfoQueue(consumer)` - Refresh queue info
- `consumerQueueOpenPart(consumer, partId)` - Open partition
- `consumerGetBatchSize(consumer)` - Get batch size
- `consumerPopElement(consumer)` - Pop element
- `consumerCommit(consumer)` - Commit position

