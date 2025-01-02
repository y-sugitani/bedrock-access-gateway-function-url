#!/bin/bash

REPO_DIR="build/bedrock-access-gateway"

mkdir -p build

rm -rf app/api
rm -f layer/requirements.txt

# Check if the repository is already cloned
if [ -d "$REPO_DIR" ]; then
    echo "Repository already cloned, fetching latest changes"
    # fetch latest changes
    (
        cd $REPO_DIR
        git fetch
    )
else
    echo "Cloning aws-samples/bedrock-access-gateway repository"
    git clone --depth 1 https://github.com/aws-samples/bedrock-access-gateway $REPO_DIR
fi

cp -r $REPO_DIR/src/api app/api

# Remove "Manum" from requirements.txt, as LWA is used instead.
grep -v "mangum" $REPO_DIR/src/requirements.txt > layer/requirements.txt
grep -v "Mangum" $REPO_DIR/src/api/app.py > app/api/app.py

# Check if "--no-embeddings" is present in the bash command
if [[ $* == *--no-embeddings* ]]; then
    echo "Deleting embeddings related code and dependencies"

    # app/api/models/bedrock.py
    sed -i.bak '/^import numpy/d' app/api/models/bedrock.py && rm app/api/models/bedrock.py.bak
    sed -i.bak '/^import tiktoken/d' app/api/models/bedrock.py && rm app/api/models/bedrock.py.bak
    sed -i.bak '/^ENCODER = /d' app/api/models/bedrock.py && rm app/api/models/bedrock.py.bak
    sed -i.bak '/^class BedrockEmbeddingsModel/,$d' app/api/models/bedrock.py && rm app/api/models/bedrock.py.bak

    # app/api/app.py
    sed -i.bak 's/, embeddings//g' app/api/app.py && rm app/api/app.py.bak
    sed -i.bak '/embeddings.router/d' app/api/app.py && rm app/api/app.py.bak

    # app/requirements.txt
    sed -i.bak '/^tiktoken/d' layer/requirements.txt && rm layer/requirements.txt.bak
    sed -i.bak '/^numpy/d' layer/requirements.txt && rm layer/requirements.txt.bak
fi

# Pydantic need to be >= 2.10.4 in order to fix a installation issue
sed -i.bak 's/pydantic==.*/pydantic>=2.10.4/g' layer/requirements.txt && rm layer/requirements.txt.bak
