# clip API Documentation

> unless you are using this programmatically, you should probably just use the browser version.

## Create a Paste

`POST /api/paste`

encrypt your content client-side first. the server never sees your plaintext. server assigns a unique id.

### Request Body

```json
{
  "encrypted": {
    "iv": "base64...",
    "ciphertext": "base64...",
    "salt": "base64..."
  }
}
```

### Response

```json
{
  "success": true,
  "id": "abc123"
}
```

## Retrieve a Paste

`GET /api/paste?id=<id>`

returns the encrypted blob. you decrypt it client-side with your key.

### Query Parameters

- `id` — the paste identifier (required)
- `key` — decryption key (optional, for raw mode)
- `raw=1` — return decrypted plaintext (requires key)

### Response (encrypted)

```json
{
  "iv": "base64...",
  "ciphertext": "base64...",
  "salt": "base64..."
}
```

### Response (raw mode)

plaintext content as text/plain

## Encryption Details

we use standard web crypto:

- PBKDF2 key derivation (100k iterations, SHA-256)
- AES-GCM 256-bit encryption
- Random 16-byte salt, 12-byte IV per paste

## Example Workflow

1. generate key client-side
2. encrypt: plaintext → {iv, ciphertext, salt}
3. POST /api/paste with encrypted blob
4. server returns unique id
5. share url: /{id}#{key}
6. recipient fetches /api/paste?id={id}
7. recipient decrypts with key from url hash
