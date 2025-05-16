import AWS from 'aws-sdk';

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' }); // Change to your region

// Initialize Kinesis client
const kinesis = new AWS.Kinesis();

// Stream name - should match the one you create in AWS
const streamName = 'data-stream-poc';

/**
 * Function to get shard iterators for all shards in the stream
 */
async function getShardIterators(): Promise<Map<string, string>> {
  try {
    // Get all shards in the stream
    const { Shards } = await kinesis.describeStream({ StreamName: streamName }).promise() as any;
    
    if (!Shards || Shards.length === 0) {
      throw new Error('No shards found in the stream');
    }
    
    // Get iterator for each shard
    const shardIterators = new Map<string, string>();
    
    for (const shard of Shards) {
      if (!shard.ShardId) continue;
      
      const params: AWS.Kinesis.GetShardIteratorInput = {
        StreamName: streamName,
        ShardId: shard.ShardId,
        ShardIteratorType: 'TRIM_HORIZON' // Start from the oldest record
        // Alternatively use 'LATEST' to start from the most recent record
      };
      
      const { ShardIterator } = await kinesis.getShardIterator(params).promise();
      
      if (ShardIterator) {
        shardIterators.set(shard.ShardId, ShardIterator);
      }
    }
    
    return shardIterators;
  } catch (error) {
    console.error('Error getting shard iterators:', error);
    throw error;
  }
}

/**
 * Process records from a specific shard
 */
async function processRecords(shardId: string, shardIterator: string): Promise<void> {
  try {
    const params: AWS.Kinesis.GetRecordsInput = {
      ShardIterator: shardIterator,
      Limit: 100 // Number of records to fetch in one call
    };
    
    const { Records, NextShardIterator } = await kinesis.getRecords(params).promise();
    
    // Process the records
    if (Records && Records.length > 0) {
      console.log(`Received ${Records.length} records from shard ${shardId}`);
      
      for (const record of Records) {
        if (record.Data) {
          const data = Buffer.from(record.Data as any).toString();
          try {
            const jsonData = JSON.parse(data);
            console.log('Processed record:', jsonData);
            
            // Here you would implement your business logic to process the event
            // For example, store in database, trigger notifications, etc.
          } catch (e) {
            console.error('Error parsing record data:', e);
          }
        }
      }
    } else {
      console.log(`No records found in shard ${shardId}`);
    }
    
    // Continue processing with the next iterator if available
    if (NextShardIterator) {
      // In a production environment, you might want to add a delay here
      // to avoid hitting the GetRecords throttling limits
      setTimeout(() => {
        processRecords(shardId, NextShardIterator);
      }, 1000);
    } else {
      console.log(`Finished processing shard ${shardId}`);
    }
  } catch (error) {
    console.error(`Error processing records from shard ${shardId}:`, error);
    // In a production environment, you would implement retry logic here
  }
}

/**
 * Start consuming events from all shards
 */
async function startConsumer(): Promise<void> {
  try {
    const shardIterators = await getShardIterators();
    
    console.log(`Starting consumer for ${shardIterators.size} shards`);
    
    // Start processing each shard
    for (const [shardId, iterator] of shardIterators.entries()) {
      processRecords(shardId, iterator);
    }
  } catch (error) {
    console.error('Error starting consumer:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  startConsumer().catch(console.error);
}

export { startConsumer };
