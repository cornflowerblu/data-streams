#!/bin/bash

SCHEMA_CONTENT=$(cat /home/rourich/development/data-streams/product-event-schema.json)

aws glue create-schema \
  --region us-east-1 \
  --registry-id RegistryName=event-schema-registry-poc \
  --schema-name product-event \
  --compatibility BACKWARD \
  --data-format AVRO \
  --schema-definition "$SCHEMA_CONTENT"
