# Lessons

Patterns learned from corrections and mistakes across sessions.

---

## cycle-vault (2026-03)

### Be precise about what to remove
**Mistake:** "Remove today's insights" → removed the entire patterns section.
**Rule:** When asked to remove something, identify exactly what it refers to before touching anything. Show the user what will change and confirm if multiple components could match.

### Verify output in browser before saying it's done
**Mistake:** Presented changes multiple times without verifying; user had to repeatedly ask to check in Chrome.
**Rule:** For any UI change, use the preview MCP to screenshot and confirm the result. Do not say "done" without visual verification.

### PWA service worker caches aggressively
**Pattern:** Changes deployed to GitHub Pages or served via `vite preview` won't appear until the service worker is cleared.
- Desktop: DevTools → Application → Service Workers → Unregister + clear Storage
- iPhone: Delete app from Home Screen, reinstall from Safari
- `vite preview` is a static file server — requires `npm run build` before changes appear (no HMR)

### Numeric inputs: never clamp on every keystroke
**Mistake:** Typed "3" toward "30" but it snapped to 15.
**Rule:** Use local string state for numeric inputs. Only parse and clamp on Save/blur. Never call `Math.min/max` inside `onChange`.

### React 18 batching in async callbacks
**Pattern:** `setCycles(updater)` inside `FileReader.onload` (or any non-React event) doesn't run the updater synchronously. If you read a count after calling `persist()`, the state hasn't updated yet — count will be stale.
**Fix:** Pre-compute the merged result into a local variable before calling `persist()`, then `resolve(count)` from that variable.

### Notes: append, don't overwrite
**Mistake:** Saving a second note replaced the first.
**Rule:** When a field is meant to accumulate entries (notes, logs), append with a separator. Show existing content as read-only. Provide an explicit delete button — never silently overwrite.

### getPhaseForDate superseded check requires 3+ cycles
**Bug in tests:** Tested superseded guard with 2 cycles, but with 2 cycles the median equals their actual gap, so `cycleNum === 1` never fires for dates between them. The anchor shifts to cycle 2 before the predicted window opens.
**Rule:** The superseded check requires ≥3 cycles (2 gaps to compute a median). Test it with 3 cycles where the date falls between the predicted next period and the actual recorded next cycle.

### Always read the specific section the user refers to
**Mistake:** When user said "the insight at the bottom is duplicated, remove it" — moved the wrong component.
**Rule:** Read the component tree or DOM order before deciding which element to remove. "The one at the bottom" means the later-rendered one, not the one with "today" in its title.
