# Usage Examples

## Basic Usage

Create a simple queue consumer module:

```javascript
import QueueModule from 'veda-node-queue-consumer';
import log from 'loglevel';

// Configure logging
log.setLevel('info');

// Define your module
class MyModule extends QueueModule {
  counter = 0;

  async beforeStart() {
    console.log('Module is starting...');
    // Initialize connections, load config, etc.
  }

  async beforeStop() {
    console.log('Module is stopping...');
    console.log('Processed', this.counter, 'messages');
    // Close connections, cleanup, etc.
  }

  async process(el) {
    this.counter++;
    
    console.log('Operation:', el.cmd);
    console.log('URI:', el.uri);
    console.log('Op ID:', el.op_id);
    
    if (el.new_state) {
      console.log('New state:', el.new_state);
    }
  }
}

// Configure and start
const options = {
  name: 'my-consumer',
  path: './queue',
  queue: 'individuals-flow',
  notifyChannelUrl: 'tcp://127.0.0.1:9323',
  queueDelay: 5000,
  commitThreshold: 1000,
  logLevel: 'info'
};

const myModule = new MyModule(options);
myModule.start();
```

## Processing Individual Changes

Process changes to individuals (documents):

```javascript
class IndividualProcessor extends QueueModule {
  async process(el) {
    switch (el.cmd) {
      case 'put':
        await this.handleUpdate(el);
        break;
      case 'remove':
        await this.handleRemove(el);
        break;
    }
  }

  async handleUpdate(el) {
    const individual = el.new_state;
    
    // Get individual properties
    const uri = individual['@'];
    const types = this.getValues(individual, 'rdf:type');
    const labels = this.getValues(individual, 'rdfs:label');
    
    console.log('Updated:', uri);
    console.log('Types:', types);
    console.log('Labels:', labels);
  }

  async handleRemove(el) {
    console.log('Removed:', el.uri);
  }

  // Helper to extract values from individual
  getValues(individual, predicate) {
    if (!individual[predicate]) return [];
    return individual[predicate].map(r => r.data);
  }
}
```

## Database Synchronization

Sync queue data to external database:

```javascript
import QueueModule from 'veda-node-queue-consumer';
import { MongoClient } from 'mongodb';

class DatabaseSync extends QueueModule {
  db = null;

  async beforeStart() {
    // Connect to database
    const client = await MongoClient.connect('mongodb://localhost:27017');
    this.db = client.db('mydb');
    console.log('Connected to database');
  }

  async beforeStop() {
    // Close database connection
    if (this.db) {
      await this.db.client.close();
      console.log('Database connection closed');
    }
  }

  async process(el) {
    const collection = this.db.collection('individuals');
    
    if (el.cmd === 'put' && el.new_state) {
      // Insert or update
      await collection.updateOne(
        { _id: el.uri },
        { 
          $set: {
            ...el.new_state,
            updated_at: new Date()
          }
        },
        { upsert: true }
      );
    } else if (el.cmd === 'remove') {
      // Delete
      await collection.deleteOne({ _id: el.uri });
    }
  }
}

const sync = new DatabaseSync({
  name: 'db-sync',
  path: './queue',
  queue: 'individuals-flow',
  notifyChannelUrl: 'tcp://127.0.0.1:9323',
  commitThreshold: 100 // Commit more frequently for DB sync
});

sync.start();
```

## Filtering by Type

Process only specific types of individuals:

```javascript
class FilteredProcessor extends QueueModule {
  targetTypes = ['v-s:Person', 'v-s:Organization'];

  async process(el) {
    if (el.cmd !== 'put' || !el.new_state) return;
    
    const types = this.getTypes(el.new_state);
    const hasTargetType = types.some(t => this.targetTypes.includes(t));
    
    if (!hasTargetType) return; // Skip
    
    // Process only matching types
    console.log('Processing', el.uri, 'of types', types);
    await this.processFiltered(el.new_state);
  }

  getTypes(individual) {
    if (!individual['rdf:type']) return [];
    return individual['rdf:type'].map(r => r.data);
  }

  async processFiltered(individual) {
    // Your processing logic
  }
}
```

## Error Recovery

Handle errors gracefully:

```javascript
class RobustProcessor extends QueueModule {
  failedItems = [];
  maxRetries = 3;

  async process(el) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.doProcess(el);
        return; // Success
      } catch (error) {
        console.error(`Attempt ${attempt} failed for ${el.uri}:`, error.message);
        
        if (attempt === this.maxRetries) {
          // Save for later processing
          this.failedItems.push({
            element: el,
            error: error.message,
            timestamp: new Date()
          });
        } else {
          // Wait before retry
          await this.sleep(1000 * attempt);
        }
      }
    }
  }

  async doProcess(el) {
    // Your processing logic that might fail
  }

  async beforeStop() {
    if (this.failedItems.length > 0) {
      console.log('Failed items:', this.failedItems.length);
      // Save to file or database for manual review
      await this.saveFailedItems();
    }
  }

  async saveFailedItems() {
    // Save logic
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Multi-language Text Extraction

Extract text in specific languages:

```javascript
class TextExtractor extends QueueModule {
  async process(el) {
    if (el.cmd !== 'put' || !el.new_state) return;
    
    const texts = this.extractTexts(el.new_state, ['EN', 'RU']);
    
    if (texts.length > 0) {
      console.log('Texts for', el.uri);
      texts.forEach(t => {
        console.log(`  [${t.lang}] ${t.predicate}: ${t.value}`);
      });
    }
  }

  extractTexts(individual, languages) {
    const results = [];
    
    for (const [predicate, resources] of Object.entries(individual)) {
      if (predicate === '@') continue;
      
      for (const resource of resources) {
        if (resource.type === 'String') {
          const lang = resource.lang || 'NONE';
          if (languages.includes(lang)) {
            results.push({
              predicate,
              lang,
              value: resource.data
            });
          }
        }
      }
    }
    
    return results;
  }
}
```

## Low-level QueueConsumer Usage

Direct use of QueueConsumer for custom control:

```javascript
import QueueConsumer from './QueueConsumer.js';

const consumer = new QueueConsumer({
  path: './queue',
  queue: 'individuals-flow',
  name: 'my-consumer'
});

// Process 100 messages
for (let i = 0; i < 100; i++) {
  const el = consumer.pop();
  
  if (!el.cmd) {
    console.log('Queue empty');
    break;
  }
  
  console.log('Processing:', el.uri);
  
  // Commit every 10 messages
  if ((i + 1) % 10 === 0) {
    consumer.commit();
  }
}

// Final commit
consumer.commit();
```

## Configuration from File

Load configuration from external file:

```javascript
import QueueModule from 'veda-node-queue-consumer';
import { readFileSync } from 'fs';

// config.json:
// {
//   "name": "my-consumer",
//   "path": "./queue",
//   "queue": "individuals-flow",
//   "notifyChannelUrl": "tcp://127.0.0.1:9323",
//   "queueDelay": 5000,
//   "commitThreshold": 1000,
//   "logLevel": "info"
// }

const config = JSON.parse(readFileSync('./config.json', 'utf8'));

class MyModule extends QueueModule {
  async process(el) {
    // Processing logic
  }
}

const module = new MyModule(config);
module.start();
```

