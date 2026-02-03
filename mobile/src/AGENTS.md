# Mobile App (Expo/React Native)

**Generated:** 2026-02-03
**Scope:** mobile/src/

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| **Pages** | `app/(tabs)/` | Expo Router file-based routing |
| **Layouts** | `app/(tabs)/_layout.tsx` | Tab navigation config |
| **Components** | `components/UI.tsx` | Button, Card, Input, LoadingOverlay |
| **State** | `store/index.ts` | Zustand (useUserStore, useEssayStore) |
| **API** | `services/client.ts` | Axios REST client |
| **Entry** | `App.tsx` | ExpoRoot bootstrap |

## CONVENTIONS

### Navigation (Expo Router)
- **Layout file**: `app/(tabs)/_layout.tsx` defines bottom tabs
- **Pages**: `app/(tabs)/index.tsx`, `essay.tsx`, `profile.tsx`
- **Link**: Use `<Link href="/essay" asChild>` for navigation

### State Management (Zustand)
- **User store**: `useUserStore` (persisted to AsyncStorage)
- **Essay store**: `useEssayStore` (current essay/rubric, non-persisted)
- **Token**: Stored in `globalThis.__token__` for API interceptor

### API Client (Axios)
- **Base**: `services/client.ts` with interceptors
- **Token injection**: Automatic from `globalThis.__token__`
- **401 handling**: Clears global token on unauthorized

### Components
- **Button**: variants (primary/secondary/outline), sizes, loading state
- **Card**: Shadow styling, padding
- **Input**: Multiline support, maxLength, textAlignVertical top
- **LoadingOverlay**: Absolute fill, ActivityIndicator

## ANTI-PATTERNS

- ❌ **Don't use `as any`** - Type properly or use unknown
- ❌ **Don't suppress errors** - Log or handle properly
- ❌ **Don't mix naming**: components PascalCase, files kebab-case
