# Kinesis POC in TypeScript

This project demonstrates a simple producer-consumer pattern using Amazon Kinesis Data Streams with TypeScript.

## Prerequisites

- Node.js and npm installed
- AWS account with appropriate permissions
- AWS credentials configured locally

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Build the TypeScript code:
   ```
   npm run build
   ```

3. Create the Kinesis stream:
   ```
   npm run setup -- create
   ```

## Usage

### Running the Producer

To send sample events to the Kinesis stream:

```
npm run producer
```

This will send both individual events and a batch of events to the stream.

### Running the Consumer

To start consuming events from the Kinesis stream:

```
npm run consumer
```

The consumer will read from all shards in the stream and process the events.

## Cleanup

To delete the Kinesis stream when you're done:

```
npm run setup -- delete
```

## Project Structure

- `src/setup.ts` - Utilities for creating and deleting the Kinesis stream
- `src/producer.ts` - Functions for publishing events to the stream
- `src/consumer.ts` - Functions for consuming and processing events from the stream

## AWS Configuration

The code assumes you have AWS credentials configured in your environment. You can set these up using:

- AWS CLI: `aws configure`
- Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- Credentials file: `~/.aws/credentials`

Make sure to update the region in the code if you're not using `us-east-1`.
