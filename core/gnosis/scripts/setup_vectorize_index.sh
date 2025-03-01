#!/bin/bash

# Check if index name was provided
if [ -z "$1" ]; then
  echo "Error: Please provide an index name"
  echo "Usage: $0 <index-name>"
  exit 1
fi

INDEX_NAME=$1

echo "Setting up vectorize index: $INDEX_NAME"

# Create the vectorize index
echo "Creating vectorize index..."
bunx wrangler vectorize create $INDEX_NAME --dimensions=768 --metric=cosine

# Create the vectorize index with metadata properties
echo "Creating metadata index for memoryText..."
bunx wrangler vectorize create-metadata-index $INDEX_NAME --property-name=memoryText --type=string

echo "Creating metadata index for user_id..."
bunx wrangler vectorize create-metadata-index $INDEX_NAME --property-name=user_id --type=string

echo "Vectorize index '$INDEX_NAME' setup complete!" 