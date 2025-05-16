import AWS from 'aws-sdk';

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' }); // Change to your region

// Initialize Kinesis client
const kinesis = new AWS.Kinesis();

// Stream name - should match the one you create in AWS
const streamName = 'data-stream-poc';

/**
 * Function to publish an event to Kinesis
 */
async function publishEvent(data: any, partitionKey: string): Promise<AWS.Kinesis.PutRecordOutput> {
  const params: AWS.Kinesis.PutRecordInput = {
    Data: JSON.stringify(data),
    PartitionKey: partitionKey,
    StreamName: streamName
  };

  try {
    const result = await kinesis.putRecord(params).promise();
    console.log(`Event published successfully to shard: ${result.ShardId}`);
    return result;
  } catch (error) {
    console.error('Error publishing event to Kinesis:', error);
    throw error;
  }
}

/**
 * Function to publish multiple events to Kinesis in a batch
 */
async function publishBatchEvents(events: Array<{ data: any, partitionKey: string }>): Promise<AWS.Kinesis.PutRecordsOutput> {
  const records = events.map(event => ({
    Data: JSON.stringify(event.data),
    PartitionKey: event.partitionKey
  }));

  const params: AWS.Kinesis.PutRecordsInput = {
    Records: records,
    StreamName: streamName
  };

  try {
    const result = await kinesis.putRecords(params).promise();
    console.log(`Batch published. Failed records: ${result.FailedRecordCount}`);
    return result;
  } catch (error) {
    console.error('Error publishing batch to Kinesis:', error);
    throw error;
  }
}

// Example usage
async function runDemo() {
  // Single event example
  const userEvent = {
    eventType: 'user-activity',
    userId: '12345',
    action: 'login',
    timestamp: new Date().toISOString()
  };
  
  await publishEvent(userEvent, userEvent.userId);
  
  // Batch events example
  const batchEvents = [
    {
      data: {
        eventType: 'product-event',
        productId: 'P1001',
        action: 'view',
        timestamp: new Date().toISOString()
      },
      partitionKey: 'P1001'
    },
    {
      data: {
        eventType: 'product-event',
        productId: 'P1002',
        action: 'add-to-cart',
        timestamp: new Date().toISOString()
      },
      partitionKey: 'P1002'
    }
  ];
  
  await publishBatchEvents(batchEvents);
}

// Run if this file is executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}

export { publishEvent, publishBatchEvents };
