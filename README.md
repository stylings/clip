# clip

secure, client-side encrypted paste sharing.

## api

see [docs.md](src/app/docs/docs.md) for api documentation.

## usage

paste text, press ctrl+s to save. share the link. the key is in the url hash - never touches the server.

## deploy

set `REDIS_URL` environment variable for persistence. defaults to in-memory (data lost on restart).
