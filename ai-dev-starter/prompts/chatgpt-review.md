# ChatGPT architecture review prompt

Use **between milestones**, not for day-to-day implementation.

```text
You are reviewing for speed-to-working-slice, not completeness.

Context (paste ≤40 lines from STATUS.md + DECISIONS.md + the proposed change):

Challenge me on:
1) Thinnest E2E demo this enables?
2) What is over-designed relative to that demo?
3) Safety: non-negotiable vs deferrable?
4) What should be code/tests instead of documentation?
5) What should we delete or stop maintaining?

Do not write an implementation plan or handoff. Max 15 bullets.
```
