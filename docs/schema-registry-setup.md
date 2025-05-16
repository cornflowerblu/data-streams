# AWS Glue Schema Registry Setup

This document outlines the setup and configuration of the AWS Glue Schema Registry for our event-driven data stream architecture.

## Overview

The schema registry serves as a central repository for all event schemas in our system, providing:

- Schema validation for producers
- Serialization/deserialization support for consumers
- Schema evolution with compatibility checks
- Documentation of event structures

## Registry Configuration

### Checking Existing Registries

```bash
aws glue list-registries --region us-east-1
```

### Creating a New Registry (if needed)

```bash
aws glue create-registry \
  --registry-name event-schema-registry-poc \
  --description "Schema registry for event-driven POC" \
  --region us-east-1
```

## Schema Management

### Listing Schemas in Registry

```bash
aws glue list-schemas \
  --registry-id RegistryName=event-schema-registry-poc \
  --region us-east-1
```

### Creating a Schema

1. First, define your schema in a JSON file (example: `user-activity-schema.json`):

```json
{
  "type": "record",
  "name": "UserActivity",
  "namespace": "com.example.events",
  "fields": [
    {
      "name": "eventId",
      "type": "string",
      "doc": "Unique identifier for this event"
    },
    {
      "name": "userId",
      "type": "string",
      "doc": "Identifier of the user who performed the activity"
    },
    {
      "name": "activityType",
      "type": "string",
      "doc": "Type of activity performed (e.g., LOGIN, PURCHASE, PAGE_VIEW)"
    },
    {
      "name": "timestamp",
      "type": "long",
      "doc": "Epoch timestamp in milliseconds when the activity occurred"
    },
    {
      "name": "source",
      "type": "string",
      "doc": "Source of the event (e.g., MOBILE_APP, WEB_APP)"
    },
    {
      "name": "metadata",
      "type": {
        "type": "map",
        "values": "string"
      },
      "doc": "Additional contextual information about the activity",
      "default": {}
    },
    {
      "name": "correlationId",
      "type": ["null", "string"],
      "doc": "Optional identifier to correlate related events",
      "default": null
    }
  ]
}
```

2. Then register the schema using the AWS CLI:

```bash
# Create a shell script to handle the schema content properly
cat > create-schema.sh << 'EOF'
#!/bin/bash

SCHEMA_CONTENT=$(cat /path/to/schema-file.json)

aws glue create-schema \
  --region us-east-1 \
  --registry-id RegistryName=event-schema-registry-poc \
  --schema-name schema-name \
  --compatibility BACKWARD \
  --data-format AVRO \
  --schema-definition "$SCHEMA_CONTENT"
EOF

# Make the script executable
chmod +x create-schema.sh

# Run the script
./create-schema.sh
```

### Updating a Schema Version

```bash
# Create a shell script to handle the schema content properly
cat > update-schema.sh << 'EOF'
#!/bin/bash

SCHEMA_CONTENT=$(cat /path/to/updated-schema-file.json)

aws glue register-schema-version \
  --region us-east-1 \
  --schema-id SchemaName=schema-name,RegistryName=event-schema-registry-poc \
  --schema-definition "$SCHEMA_CONTENT"
EOF

# Make the script executable
chmod +x update-schema.sh

# Run the script
./update-schema.sh
```

### Getting Schema Details

```bash
aws glue get-schema \
  --region us-east-1 \
  --schema-id SchemaName=schema-name,RegistryName=event-schema-registry-poc
```

### Getting a Specific Schema Version

```bash
aws glue get-schema-version \
  --region us-east-1 \
  --schema-id SchemaName=schema-name,RegistryName=event-schema-registry-poc \
  --schema-version-number LatestVersion=true
```

## Schema Compatibility Modes

When creating schemas, we specify a compatibility mode that determines how schemas can evolve:

- **BACKWARD** (default): New schema can read data written with old schema
- **FORWARD**: Old schema can read data written with new schema
- **FULL**: Both backward and forward compatible
- **NONE**: No compatibility checks enforced

For our event-driven architecture, we've chosen **BACKWARD** compatibility to ensure:
- New versions can remove fields
- New versions can add optional fields
- Consumers using newer schemas can read data written with older schemas

## Implemented Schemas

### 1. User Activity Schema

This schema captures user interaction events across our applications.

**Schema Name:** `user-activity`
**File:** `/home/rourich/development/data-streams/user-activity-schema.json`

Key fields:
- `eventId`: Unique identifier for the event
- `userId`: User who performed the activity
- `activityType`: Type of activity (LOGIN, PURCHASE, etc.)
- `timestamp`: When the activity occurred
- `source`: Origin of the event (MOBILE_APP, WEB_APP, etc.)
- `metadata`: Additional contextual information
- `correlationId`: Optional ID to correlate related events

### 2. Product Event Schema

This schema captures product-related events in our system.

**Schema Name:** `product-event`
**File:** `/home/rourich/development/data-streams/product-event-schema.json`

Key fields:
- `eventId`: Unique identifier for the event
- `productId`: Identifier of the product
- `eventType`: Type of product event (CREATED, UPDATED, etc.)
- `timestamp`: When the event occurred
- `userId`: Optional user who triggered the event
- `productDetails`: Nested record with product information
- `correlationId`: Optional ID to correlate related events

## Integration with Streaming Platform

### For Kinesis Data Streams

1. Producer integration:
```java
// Example code for producer integration
import software.amazon.awssdk.services.glue.model.*;
import software.amazon.awssdk.services.kinesis.model.*;
// Additional imports...

// Get the schema
GetSchemaVersionResponse schemaVersionResponse = glueClient.getSchemaVersion(
    GetSchemaVersionRequest.builder()
        .schemaId(SchemaId.builder()
            .registryName("event-schema-registry-poc")
            .schemaName("user-activity")
            .build())
        .schemaVersionNumber(SchemaVersionNumber.builder()
            .latestVersion(true)
            .build())
        .build());

// Serialize data according to schema
// Put record to Kinesis
```

2. Consumer integration:
```java
// Example code for consumer integration
// Deserialize data using schema from registry
```

### For Apache Kafka

Similar integration can be implemented for Apache Kafka using the AWS Glue Schema Registry client libraries.

## Next Steps

1. Create additional schemas for other event types
2. Set up Kinesis Data Streams or Kafka topics
3. Implement producer code with schema validation
4. Configure consumers to use the schema registry for deserialization
