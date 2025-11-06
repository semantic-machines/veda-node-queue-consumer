# Quick Start Guide

Get started with veda-node-queue-consumer in 5 minutes.

## Step 1: Install Prerequisites

Make sure you have installed:

```bash
# Node.js (check version)
node --version  # Should be 14.x or higher

# Rust (install if needed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# nanomsg library (Ubuntu/Debian)
sudo apt-get install libnanomsg-dev
```

## Step 2: Install Module

```bash
npm install veda-node-queue-consumer
```

Or from source:

```bash
git clone https://github.com/semantic-machines/veda-node-queue-consumer.git
cd veda-node-queue-consumer
npm install
```

## Step 3: Create Your Module

Create a file `my-module.js`:

```javascript
import QueueModule from 'veda-node-queue-consumer';
import log from 'loglevel';

// Set log level
log.setLevel('info');

// Create your module class
class MyModule extends QueueModule {
  counter = 0;

  // Called before starting
  async beforeStart() {
    console.log('Module starting...');
  }

  // Called before stopping
  async beforeStop() {
    console.log('Module stopping...');
    console.log('Processed messages:', this.counter);
  }

  // Called for each message
  async process(el) {
    this.counter++;
    
    // Log basic info
    console.log(`[${this.counter}] ${el.cmd} ${el.uri} (op_id: ${el.op_id})`);
    
    // Access message data
    if (el.new_state) {
      const types = el.new_state['rdf:type'] || [];
      console.log('  Types:', types.map(t => t.data).join(', '));
    }
  }
}

// Configure module
const options = {
  name: 'my-consumer',               // Consumer name
  path: './queue',                    // Queue directory
  queue: 'individuals-flow',          // Queue name
  notifyChannelUrl: 'tcp://127.0.0.1:9323',  // Notification channel
  queueDelay: 5000,                   // Delay when queue empty (ms)
  commitThreshold: 100,               // Commit every N messages
  logLevel: 'info'                    // Log level
};

// Create and start
const myModule = new MyModule(options);
myModule.start();
```

## Step 4: Run Your Module

```bash
node my-module.js
```

You should see:

```
Module starting...
[1] put d:individual_123 (op_id: 12345)
  Types: v-s:Person
[2] put d:individual_456 (op_id: 12346)
  Types: v-s:Organization
...
```

## Step 5: Stop Gracefully

Press `Ctrl+C` to stop:

```
^C
Module stopping...
Processed messages: 42
```

## What's Next?

### Learn More

- Read [API Reference](API.md) for complete API
- Check [Examples](Examples.md) for more use cases
- Review [Configuration](Configuration.md) for options

### Common Tasks

#### Process Specific Types Only

```javascript
async process(el) {
  if (el.cmd !== 'put' || !el.new_state) return;
  
  const types = el.new_state['rdf:type'] || [];
  const isPerson = types.some(t => t.data === 'v-s:Person');
  
  if (isPerson) {
    console.log('Processing person:', el.uri);
  }
}
```

#### Save to Database

```javascript
async process(el) {
  if (el.cmd === 'put' && el.new_state) {
    await db.save(el.new_state);
  } else if (el.cmd === 'remove') {
    await db.delete(el.uri);
  }
}
```

#### Extract Multi-language Text

```javascript
async process(el) {
  const individual = el.new_state;
  if (!individual) return;
  
  const label = individual['rdfs:label']?.find(r => r.lang === 'EN')?.data;
  console.log('English label:', label);
}
```

### Troubleshooting

**Module doesn't start?**
- Check queue directory exists and is writable
- Verify nanomsg is running on notifyChannelUrl
- Review logs for error messages

**No messages?**
- Verify queue has data (check queue files)
- Check consumer isn't already at end of queue
- Ensure notification channel is correct

**Messages reprocessed after restart?**
- This is normal - commit() wasn't called
- Reduce commitThreshold for more frequent commits
- Let module run longer before stopping

See [FAQ](FAQ.md) for more help.

## Example Project Structure

```
my-project/
├── node_modules/
├── queue/                    # Queue directory
│   └── individuals-flow/
│       ├── individuals-flow_info_queue
│       └── individuals-flow-0/
│           └── ...
├── package.json
├── my-module.js             # Your module
└── config.json              # Configuration (optional)
```

## Configuration File

Create `config.json`:

```json
{
  "name": "my-consumer",
  "path": "./queue",
  "queue": "individuals-flow",
  "notifyChannelUrl": "tcp://127.0.0.1:9323",
  "queueDelay": 5000,
  "commitThreshold": 100,
  "logLevel": "info"
}
```

Load it:

```javascript
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./config.json', 'utf8'));
const module = new MyModule(config);
module.start();
```

## Running in Production

Use PM2 for production:

```bash
npm install -g pm2
pm2 start my-module.js --name queue-consumer
pm2 save
pm2 startup
```

Monitor:

```bash
pm2 status
pm2 logs queue-consumer
pm2 monit
```

## Next Steps

1. Customize `process()` for your use case
2. Add error handling
3. Configure logging
4. Set up monitoring
5. Deploy to production

Happy coding!

