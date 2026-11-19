## 1. Right-to-left quick actions

- [x] 1.1 In `features/home/components/quick-actions.tsx`, render the checked actions in reverse list order, so the first checked action (primary) is the last button (right-most) and the next checked actions go to its left.
- [x] 1.2 Add `features/home/tests/components/quick-actions.test.tsx`: with 3 checked actions [A, B, C], the buttons render as C, B, A and only A uses the primary style; with no checked action, nothing renders.
- [x] 1.3 Run `npm run typecheck && npm test` from `resources/app/`, and confirm that only the failures that are also on `dev` remain. Note: `features/home/tests/pages/home-header.test.tsx` checked the old order, so its expected order is now updated to the right-to-left order.
