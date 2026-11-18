All paths are below `resources/app/`. Run commands from `resources/app/`.

Draft by the design team. The developer refines the task list after answering the open
questions in design.md (Q1–Q3).

## 1. Mark as shipped dialog

- [ ] 1.1 Answer design.md Q1–Q3 and record the answers in design.md
- [ ] 1.2 Add the Mark as shipped dialog with the closed slot / open fields of design D1–D2, reusing the carrier and tracking number fields of `add-tracking-dialog.tsx`
- [ ] 1.3 Open it from Mark as shipped in `components/order-details/take-action-card.tsx` instead of shipping at once
- [ ] 1.4 Remember the tracking choice and the last carrier per zone (design D3); show the Last used badge
- [ ] 1.5 Verify: `npm run typecheck && npm test`

## 2. Tracking in the Take an Action card

- [ ] 2.1 Show the tracking summary and its ⋯ menu, or No tracking added + Add tracking (design D5)
- [ ] 2.2 Remove the tracking link from the Items card header in `pages/order-details.tsx` (design D6)
- [ ] 2.3 Verify: `npm run typecheck && npm test`

## 3. Tests and final checks

- [ ] 3.1 Add tests: shipping without tracking; shipping with a listed carrier; with Other; the dialog opens with fields open after a shipment with tracking; the Last used carrier is preselected
- [ ] 3.2 Run `npm run lint` and correct each finding in the changed files
- [ ] 3.3 Tell the design team which visual checks stay for them (no browser preview in this project)
