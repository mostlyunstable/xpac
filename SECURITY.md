# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in XPAC, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email: security@xpac.io (or create a private disclosure)

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Timeline

- **Acknowledgment**: within 48 hours
- **Initial assessment**: within 1 week
- **Fix or mitigation**: within 2 weeks for critical issues

## Scope

This security policy applies to:
- The XPAC application code
- Server-side API endpoints
- Authentication and authorization logic
- File upload handling

## Out of Scope

- Third-party dependencies (report to their maintainers)
- Social engineering attacks
- Issues in development environments

## Security Best Practices

When deploying XPAC:

1. **Never commit `.env` files** — use `.env.example` as a template
2. **Use HTTPS** in production
3. **Set `CORS_ORIGIN`** to your actual domain
4. **Rotate API keys** regularly
5. **Validate all inputs** on the server side
6. **Keep dependencies updated** — run `npm audit` regularly

## API Key Security

- NVIDIA API keys are stored in `.env` (never committed)
- The frontend never directly accesses API keys
- All AI requests are proxied through the Express backend
- Consider using a secrets manager in production

## Authentication

This is a demo application. For production use:

- Add proper user authentication (JWT, OAuth, etc.)
- Implement role-based access control
- Add rate limiting to API endpoints
- Use session management
