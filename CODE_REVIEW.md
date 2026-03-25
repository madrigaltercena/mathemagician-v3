# Code Review — Mathemagician v3
**Date:** 2026-03-25
**Reviewer:** Macacoder (AI agent)
**Focus:** Touchculator.js (highest churn today)

---

## Executive Summary

Touchculator.js has accumulated significant technical debt from rapid patching today. The logic for the four operations (addition, subtraction, multiplication, division) is scattered across overlapping guards, conflicting states, and duplicate code paths. This document catalogues every finding and the planned fix for each.

---

## Findings

### 1. `getInitialCircles` — Dead Code After `return`

**Severity:** Medium
**File:** `Touchculator.js`

```js
if (operation === 'multiplication') {
  return Array.from({ length: question.a }, ...);  // returns here
}
const initialCount = operation === 'multiplication' ? 0 : question.a;  // DEAD CODE
return Array.from({ length: initialCount }, ...);
```

The ternary `operation === 'multiplication' ? 0 : question.a` is always `question.a` because the `multiplication` case already returned above. This line does nothing and is confusing.

**Fix:** Remove the dead ternary. The `question.a` fallback should only apply to addition/subtraction.

---

### 2. `getVisualCount` — Inconsistent Return for `default` Case

**Severity:** Low
**File:** `Touchculator.js`

```js
function getVisualCount(question, operation, step) {
  switch (operation) {
    case 'addition':    return question.a + step;
    case 'subtraction': return Math.max(question.a - step, question.answer);
    case 'multiplication': return question.a * step;  // step=0 → 0 circles (correct for add/sub)
    case 'division':   return Math.max(question.a - question.b * step, question.answer);
    default:            return question.a + step;  // inconsistent fallback
  }
}
```

The `default` returns `question.a + step` but the `addition` case already does that. Should throw or return 0 to make missing cases obvious.

**Fix:** Change `default` to `return 0;` or throw `new Error('Unknown operation')`.

---

### 3. `getTargetSteps` — Default Case Is Dead Code

**Severity:** Medium
**File:** `Touchculator.js`

```js
function getTargetSteps(question, operation) {
  switch (operation) {
    case 'addition':    return question.b;
    case 'subtraction': return question.a - question.answer;
    case 'multiplication': return question.b;
    case 'division':    return 2;
    default:
      return Math.ceil((question.a - question.answer) / question.b); // UNREACHABLE
  }
}
```

The `default` case is never reached because `operation` is always one of the four enum values. Its formula also makes no semantic sense for any operation (it looks like a leftover from a previous division implementation).

**Fix:** Remove the `default` case entirely, or replace with `throw new Error`.

---

### 4. `confirmed` State — Wrong Name, Bleeds Into Addition/Subtraction Logic

**Severity:** High
**File:** `Touchculator.js`

```js
const [confirmed, setConfirmed] = useState(false);
```

The state variable `confirmed` was introduced for multiplication but is not reset when switching operations in `handleBack`. The `handleBack` resets `confirmed` (line 268), but `startGame` also resets it — however `confirmed` only makes sense for multiplication. For addition/subtraction/division, `confirmed` is always `false` during gameplay and its purpose is opaque.

**Fix:** Rename to `multiplicationConfirmed` and ensure it only lives in the multiplication flow. Alternatively, move it into a per-operation state object.

---

### 5. `readyToSubmit` — Overloaded Meaning Across Operations

**Severity:** High
**File:** `Touchculator.js`

`readyToSubmit` is used for three different things depending on the operation:
- **Addition/subtraction:** `true` → show submit button
- **Division:** `true` → show `✓` (but no button; modal auto-opens on tap)
- **Multiplication:** `true` → show `✓` (confirmed=true also needed; modal auto-opens)

The submit-zone render logic is a tangled conditional:
```js
{(selectedOp === 'division' || selectedOp === 'multiplication') && readyToSubmit ? (
  <div className="tc-checkmark">✓</div>
) : readyToSubmit ? (
  <> <div className="tc-checkmark"/> <button>Submeter</button> </>
) : ( ... )}
```

This is very hard to reason about and easy to break.

**Fix:** Replace with an explicit `submitState` enum: `'hidden' | 'ready' | 'confirmed'` and derive UI from that.

---

### 6. `handleTap` — Guard Ordering and Confusing Control Flow

**Severity:** High
**File:** `Touchculator.js`

The tap handler has early returns in this order:
1. `isTappingRef` lock
2. `questionRef.current || selectedOpRef.current` null guard
3. `readyToSubmit` guard (bypassed for multiplication confirm tap — awkward)
4. `confirmed` → open modal (multiplication only)
5. `currentStep >= targetSteps` guard
6. `currentStep === targetSteps - 1` → set confirmed (multiplication)
7. `currentStep === 1` → open modal (division)
8. Normal path: increment step, add circles

The `readyToSubmit` guard is bypassed for `confirmed` with a negated condition inside the guard block — this is fragile and hard to follow:
```js
if (readyToSubmit) {
  if (!(op === 'multiplication' && confirmed)) return;  // awkward
}
```

**Fix:** Reorder guards so `confirmed` check comes before `readyToSubmit`. Remove the awkward negation. Explicitly handle all four operations in a switch or operation-specific handler map.

---

### 7. `getInitialCircles` — Multiplication Row 0 Always Has `row: 0`, Then Gets `row: currentStep` on Add

**Severity:** Medium
**File:** `Touchculator.js`

The first group (row 0) is seeded with `row: 0`. Subsequent groups added by `handleTap` use `row: currentStep`. On the confirm tap, the last group also uses `row: currentStep`. Since `currentStep` is the step number before incrementing, this is correct — but it relies on the specific order of operations in the handler. This is fragile.

**Fix:** Compute `nextRow = currentStep` before calling `setCurrentStep` to make the dependency explicit and documented.

---

### 8. Duplicate `setTimeout` Lock Pattern

**Severity:** Low
**File:** `Touchculator.js`

The tap lock release (`setTimeout(() => { isTappingRef.current = false; }, 80)`) is repeated 4 times in `handleTap`. If a new branch is added without the timeout, it introduces a permanent lock bug.

**Fix:** Extract into a helper:
```js
const releaseTap = (delay = 80) => setTimeout(() => { isTappingRef.current = false; }, delay);
```

---

### 9. `getInitialCircles` — Multiplication Case Returns but Falls Through to Dead Code

**Severity:** Medium
**File:** `Touchculator.js`

```js
if (operation === 'multiplication') {
  return Array.from({ length: question.a }, (_, i) => ({ id: `circle-${i}`, state: 'visible', row: 0 }));
}
const initialCount = operation === 'multiplication' ? 0 : question.a;  // unreachable
```

After returning for multiplication, the next two lines are unreachable dead code. But they're kept there — it looks like someone forgot to delete them after refactoring.

**Fix:** Remove the unreachable `initialCount` line.

---

### 10. Magic Numbers and String Literals Scattered Across JSX

**Severity:** Low
**File:** `Touchculator.js`

Hint strings are inline:
```js
currentStep === 0 ? 'Confirma as colunas' : 'Submeter resultado'
```

These should be in a constant map keyed by operation:
```js
const DIVISION_HINTS = { 0: 'Confirma as colunas', 1: 'Submeter resultado' };
```

**Fix:** Extract to a `HINTS` constant object.

---

### 11. `fadeTimeoutRef` — Potential Stale Closure

**Severity:** Low
**File:** `Touchculator.js`

The fade timeout uses a functional updater for `setCircles`, but captures `fadeTimeoutRef.current = null` inside the timeout. If `fadeTimeoutRef` changes between scheduling and execution, the null assignment targets the wrong ref. Extremely unlikely in practice but technically possible.

**Fix:** Use a local variable in the closure instead of mutating the ref.

---

### 12. No Error Boundary on Touchculator Page

**Severity:** Low
**File:** `Touchculator.js`

If any state becomes inconsistent (e.g., `confirmed=true` but operation is addition), the page may crash with cryptic errors. No try/catch or error boundary exists.

**Fix:** Wrap the game render in an error boundary or add defensive checks.

---

### 13. CSS — Orphaned `.division-confirm` and `.division-answer` Classes

**Severity:** Low
**File:** `Touchculator.css`

`.division-confirm` and `.division-answer` were removed from the JSX (the answer now appears in the question `?`) but the CSS rules remain. Dead CSS.

**Fix:** Remove `.division-confirm` and `.division-answer` rules from CSS.

---

### 14. CSS — Hardcoded Dashed Outline Color Duplicated

**Severity:** Low
**File:** `Touchculator.css`

```css
outline: 3px dashed rgba(255, 215, 0, 0.75);  /* division */
outline: 3px dashed rgba(255, 215, 0, 0.75);  /* multiplication */
```

Both division and multiplication outlines use the same value but it's hardcoded twice.

**Fix:** Use a CSS variable: `--outline-color: rgba(255, 215, 0, 0.75)`.

---

### 15. `getVisualCount` Comment Inaccuracy

**Severity:** Low
**File:** `Touchculator.js`

```js
* Division: circles decrease by `b` each tap, stopping at the answer
```

This comment describes the OLD division logic (removing circles). The current division has no circle transitions — it's a 2-tap confirm flow. The comment is misleading.

**Fix:** Update the file-level comment to accurately describe the division flow.

---

## Recommended Refactoring: Operation-Specific Handler Map

The core problem is that all four operations share the same `handleTap`, `sync effect`, and `render` logic with invisible per-operation guards. The recommended big-picture fix is to extract operation-specific logic into a handler map:

```js
const OPERATIONS = {
  addition: {
    initialStep: 0,
    initialCircles: (q) => Array.from({ length: q.a }, ...),
    targetSteps: (q) => q.b,
    onTap: (step) => { /* add 1 circle */ },
    onRender: (step) => ({ showOutlines: false, answer: step >= targetSteps }),
  },
  multiplication: {
    initialStep: 1,
    initialCircles: (q) => firstGroupOf(q.a),
    targetSteps: (q) => q.b,
    onTap: (step) => { /* add group or confirm */ },
    onRender: (step, confirmed) => ({ showOutlines: confirmed, answer: confirmed }),
  },
  division: {
    initialStep: 0,
    initialCircles: (q) => allColumns(q),
    targetSteps: () => 2,
    onTap: (step) => { /* step 1 → confirm, step 2 → modal */ },
    onRender: (step) => ({ showOutlines: step >= 1, answer: step >= 1 }),
  },
  subtraction: {
    initialStep: 0,
    initialCircles: (q) => Array.from({ length: q.a }, ...),
    targetSteps: (q) => q.a - q.answer,
    onTap: (step) => { /* remove 1 circle */ },
    onRender: (step) => ({ showOutlines: false, answer: step >= targetSteps }),
  },
};
```

This eliminates the per-operation `if` chains and makes each operation's contract explicit.

---

## Priority Order for Fixes

| # | Finding | Priority | Effort |
|---|---------|----------|--------|
| 9 | Dead code after multiplication return | High | 5 min |
| 13 | Orphaned CSS classes | High | 2 min |
| 1 | Dead ternary in `getInitialCircles` | High | 2 min |
| 3 | Dead `default` in `getTargetSteps` | High | 2 min |
| 15 | Stale comment for division | Medium | 2 min |
| 4 | `confirmed` → `multiplicationConfirmed` | Medium | 5 min |
| 5 | `readyToSubmit` → `submitState` enum | Medium | 15 min |
| 6 | `handleTap` guard reordering | Medium | 10 min |
| 8 | Extract `releaseTap` helper | Medium | 5 min |
| 14 | CSS variable for outline color | Low | 5 min |
| 10 | Extract hint strings to constants | Low | 5 min |
| 2 | Fix `default` in `getVisualCount` | Low | 2 min |
| 7 | Explicit `nextRow` variable | Low | 3 min |
| 11 | `fadeTimeoutRef` closure fix | Low | 5 min |
| 12 | Error boundary | Low | 10 min |

---

*Document created: 2026-03-25*
*Next step: Apply fixes in priority order, commit to a `refactor/touchculator-cleanup` branch, test thoroughly, then merge to main.*
