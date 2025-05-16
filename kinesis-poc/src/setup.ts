import AWS from 'aws-sdk';

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' }); // Change to your region

// Initialize Kinesis client
const kinesis = new AWS.Kinesis();

// Stream configuration
const streamName = 'data-stream-poc';
const shardCount = 1; // Start with 1 shard for the POC

/**
 * Create a Kinesis data stream
 */
async function createStream(): Promise<void> {
  try {
    // Check if stream already exists
    try {
      await kinesis.describeStream({ StreamName: streamName }).promise();
      console.log(`Stream ${streamName} already exists`);
      return;
    } catch (error: any) {
      // If the error is not ResourceNotFoundException, rethrow it
      if (error.code !== 'ResourceNotFoundException') {
        throw error;
      }
    }
    
    // Create the stream
    const params: AWS.Kinesis.CreateStreamInput = {
      StreamName: streamName,
      ShardCount: shardCount
    };
    
    await kinesis.createStream(params).promise();
    console.log(`Stream ${streamName} creation initiated`);
    
    // Wait for the stream to become active
    console.log('Waiting for stream to become active...');
    await waitForStreamToBecomeActive();
    console.log(`Stream ${streamName} is now active and ready to use`);
  } catch (error) {
    console.error('Error creating stream:', error);
    throw error;
  }
}

/**
 * Wait for a stream to become active
 */
async function waitForStreamToBecomeActive(): Promise<void> {
  const params: AWS.Kinesis.DescribeStreamInput = {
    StreamName: streamName
  };
  
  let streamActive = false;
  while (!streamActive) {
    try {
      const { StreamDescription } = await kinesis.describeStream(params).promise();
      
      if (StreamDescription?.StreamStatus === 'ACTIVE') {
        streamActive = true;
      } else {
        // Wait for 5 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error('Error checking stream status:', error);
      throw error;
    }
  }
}

/**
 * Delete a Kinesis data stream
 */
async function deleteStream(): Promise<void> {
  try {
    const params: AWS.Kinesis.DeleteStreamInput = {
      StreamName: streamName,
      EnforceConsumerDeletion: true
    };
    
    await kinesis.deleteStream(params).promise();
    console.log(`Stream ${streamName} deletion initiated`);
  } catch (error: any) {
    if (error.code === 'ResourceNotFoundException') {
      console.log(`Stream ${streamName} does not exist`);
    } else {
      console.error('Error deleting stream:', error);
      throw error;
    }
  }
}

// Command line interface
async function main(): Promise<void> {
  const command = process.argv[2];
  
  switch (command) {
    case 'create':
      await createStream();
      break;
    case 'delete':
      await deleteStream();
      break;
    default:
      console.log('Usage: npm run setup -- [create|delete]');
      break;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { createStream, deleteStream };
