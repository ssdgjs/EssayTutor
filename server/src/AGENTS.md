# Server API (Express/Node.js)

**Generated:** 2026-02-03
**Scope:** server/src/

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| **Entry** | `index.ts` | Express app, middleware, error handling |
| **Routes** | `routes/ai.routes.ts` | POST /grade, POST /ocr |
| **Services** | `services/ai.service.ts` | AI clients (Zhipu, Ark) |
| **Middleware** | `middleware/response.ts` | sendSuccess, asyncHandler |
| **Middleware** | `middleware/auth.ts` | JWT verification |
| **Config** | `config/index.ts` | Environment, AI keys |
| **Utils** | `utils/database.ts` | PostgreSQL helpers |

## CONVENTIONS

### API Response
```typescript
// Success
sendSuccess(res, { result: ... })

// Error
res.status(400).json({
  success: false,
  error: { code: 'MISSING_CONTENT', message: '...' }
})
```

### Error Codes
- `MISSING_CONTENT` - Essay content required
- `MISSING_URL` - Image URL required
- `NOT_FOUND` - Route not found
- `INTERNAL_ERROR` - Server error

### AI Services
- **Grading**: Zhipu GLM-4.5-air (JSON response)
- **OCR**: Ark (火山引擎) for image text recognition

### Middleware Order
1. helmet() - Security headers
2. cors() - Cross-origin
3. morgan() - Request logging
4. express.json() - Body parsing

### Database (PostgreSQL)
- `getPool()` - Connection pool
- `query<T>()` - Generic query
- `transaction<T>()` - Transaction wrapper

## ANTI-PATTERNS

- ❌ **Don't use `as any`** - Type properly
- ❌ **Don't leave empty catch blocks** - Always log errors
- ❌ **Don't hardcode API keys** - Use config/environment
- ❌ **Don't commit .env** - Already in .gitignore
