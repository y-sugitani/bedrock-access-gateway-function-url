# bedrock-access-gateway-function-url

This repo is combining the great work [bedrock-access-gateway](https://github.com/aws-samples/bedrock-access-gateway/) with [aws-lambda-web-adapter](https://github.com/awslabs/aws-lambda-web-adapter) so that one can deploy a OpenAI API compatible endpoint on AWS Lambda.

This solution is better than the original `bedrock-access-gateway` as it removes the need of components (Application Load Balancer and the optional Fargate container) and the need of a VPC. All fixed costs incurred by the original solution are removed. So that one can use it in a fully pay-as-you-go model.

## Deployment

Make sure you have `sam` and Docker installed.

```shell
./prepare_source.sh [--no-embeddings]

sam build --use-container
sam deploy --guided
```

`--no-embeddings` is optional. If you want to speed up the inference as well as reduce the Lambda Layer, you can exclude the embeddings from the deployment package.

## Test

```shell
curl "${FUNCTION_URL}api/v1/chat/completions" \
     -H "Authorization: Bearer $API_KEY" \
     -X POST \
     -H 'Content-Type: application/json' \
     -d '{
        "stream": true,
        "model": "amazon.nova-micro-v1:0",
        "messages": [{"role": "user", "content": "Tell me what is 1+1"}]
    }'

# > data: {"id":"chatcmpl-61c29444","created":1735753748,"model":"amazon.nova-micro-v1:0","system_fingerprint":"fp","choices":[{"index":0,"finish_reason":null,"logprobs":null,"delta":{"role":"assistant","content":""}}],"object":"chat.completion.chunk","usage":null}
# > data: {"id":"chatcmpl-61c29444","created":1735753748,"model":"amazon.nova-micro-v1:0","system_fingerprint":"fp","choices":[{"index":0,"finish_reason":null,"logprobs":null,"delta":{"content":""}}],"object":"chat.completion.chunk","usage":null}
# > data: {"id":"chatcmpl-61c29444","created":1735753748,"model":"amazon.nova-micro-v1:0","system_fingerprint":"fp","choices":[{"index":0,"finish_reason":null,"logprobs":null,"delta":{"content":"1"}}],"object":"chat.completion.chunk","usage":null}
# > data:{"id":"chatcmpl-61c29444","created":1735753748,"model":"amazon.nova-micro-v1:0","system_fingerprint":"fp","choices":[{"index":0,"finish_reason":null,"logprobs":null,"delta":{"content":"+"}}],"object":"chat.completion.chunk","usage":null}
# > data:{"id":"chatcmpl-61c29444","created":1735753748,"model":"amazon.nova-micro-v1:0","system_fingerprint":"fp","choices":[{"index":0,"finish_reason":null,"logprobs":null,"delta":{"content":"1"}}],"object":"chat.completion.chunk","usage":null}
# > data:{"id":"chatcmpl-61c29444","created":1735753748,"model":"amazon.nova-micro-v1:0","system_fingerprint":"fp","choices":[{"index":0,"finish_reason":null,"logprobs":null,"delta":{"content":" equals"}}],"object":"chat.completion.chunk","usage":null}
# > data:{"id":"chatcmpl-61c29444","created":1735753748,"model":"amazon.nova-micro-v1:0","system_fingerprint":"fp","choices":[{"index":0,"finish_reason":null,"logprobs":null,"delta":{"content":""}}],"object":"chat.completion.chunk","usage":null}
# > data:{"id":"chatcmpl-61c29444","created":1735753748,"model":"amazon.nova-micro-v1:0","system_fingerprint":"fp","choices":[{"index":0,"finish_reason":null,"logprobs":null,"delta":{"content":" 2"}}],"object":"chat.completion.chunk","usage":null}
```
