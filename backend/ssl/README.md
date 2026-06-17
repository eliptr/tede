# Local SSL Certificates

The backend enables HTTPS when `key.pem` and `cert.pem` exist in this folder, or when `SSL_KEY_PATH` and `SSL_CERT_PATH` point to certificate files.

For local development, generate a self-signed certificate from `backend/ssl`:

```bash
openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 365 -subj "/CN=localhost"
```

The generated `.pem` files are intentionally ignored by Git.
