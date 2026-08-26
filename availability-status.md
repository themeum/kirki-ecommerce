# 📦 Inventory Variant Status Algorithm

A comprehensive two-layer algorithm for determining product availability status based on variant inventory states. Perfect for ecommerce platforms, particularly those with variant-based products (sizes, colors, etc.).

## Overview

### Problem Statement

Ecommerce products often have multiple variants (sizes, colors, styles) with different inventory statuses:

- Some variants may be in stock
- Some may be running low
- Some may be completely out of stock

The challenge is determining a **single, meaningful availability label** for the product that accurately reflects its overall inventory situation.

### Solution

This algorithm uses a **two-layer decision system**:

1. **Layer 1**: Evaluate each variant individually to get its status (IS, LS, or OS)
2. **Layer 2**: Combine variant statuses using a decision matrix to get the final product status (IS, LS, OS, or PS)

---

## Algorithm Architecture

```
┌─────────────────────────────────────────────────────────┐
│               INPUT PARAMETERS (4 inputs)               │
├─────────────────────────────────────────────────────────┤
│ • Tracking Enabled (boolean)                            │
│ • Binary Status (IS/OS) [if tracking disabled]          │
│ • Quantity (number) [if tracking enabled]               │
│ • Threshold (number) [if tracking enabled]              │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│    LAYER 1: VARIANT STATUS DETERMINATION                │
├─────────────────────────────────────────────────────────┤
│ For each variant:                                       │
│  IF tracking disabled:                                  │
│    status = binary input (IS or OS)                     │
│  ELSE IF tracking enabled:                              │
│    IF qty = 0 → status = OS                             │
│    ELSE IF qty ≤ threshold → status = LS                │
│    ELSE IF qty > threshold → status = IS                │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
    ┌───────────────────┐
    │ Variant Statuses: │
    │ IS, LS, OS        │
    │ (one per variant) │
    └─────────┬─────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│    LAYER 2: COMBINATION MATRIX                          │
├─────────────────────────────────────────────────────────┤
│ Combine variant statuses using decision matrix:         │
│  IS + IS → IS     (all good)                            │
│  IS + LS → LS     (prioritize warning)                  │
│  IS + OS → PS     (partially stocked)                   │
│  LS + LS → LS     (both low)                            │
│  LS + OS → LS     (prioritize low warning)              │
│  OS + OS → OS     (nothing available)                   │
│  OS + LS → LS     (prioritize low warning)              │
│  OS + IS → PS     (partially stocked)                   │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│               FINAL OUTPUT                              │
├─────────────────────────────────────────────────────────┤
│ Product Status: IS, LS, OS, or PS                       │
└─────────────────────────────────────────────────────────┘
```

---

---

## Status Definitions

### Individual Variant Statuses (Layer 1)

| Status | Meaning      | Applies When                                       |
| ------ | ------------ | -------------------------------------------------- |
| **IS** | In Stock     | Quantity > Threshold (or manually marked In Stock) |
| **LS** | Low Stock    | Quantity ≤ Threshold (but > 0)                     |
| **OS** | Out of Stock | Quantity = 0 (or manually marked Out of Stock)     |

### Product Statuses (Layer 2)

| Status | Meaning           | When to Use                                             |
| ------ | ----------------- | ------------------------------------------------------- |
| **IS** | In Stock          | All variants are in stock with healthy quantities       |
| **LS** | Low Stock         | At least one variant is below threshold or out of stock |
| **OS** | Out of Stock      | All variants are out of stock                           |
| **PS** | Partially Stocked | Some variants available, others completely unavailable  |

---

## Matrix Rules

### Decision Matrix (Layer 2)

The following matrix is used to combine two variant statuses:

```
        IS      LS      OS
    ┌─────────────────────────┐
IS  │ IS  │  LS  │  PS  │
    ├─────────────────────────┤
LS  │ LS  │  LS  │  LS  │
    ├─────────────────────────┤
OS  │ PS  │  LS  │  OS  │
    └─────────────────────────┘
```

### Rule Philosophy

1. **Warnings are prioritized**: If any variant is low or out of stock, that warning should propagate to the product level
2. **Partial stocking**: When some variants are available and others are not, mark as "Partially Stocked" (PS)
3. **Low stock supersedes partial**: If any variant is low, show low stock warning even if some are fully available
4. **Total depletion**: Only show "Out of Stock" when all variants are out

---

## Testing

### Run Examples

```bash
# Node.js
node inventory_algorithm.js

# Or with npm (if package.json is configured)
npm run test:inventory
```

### Expected Output

```
=== Example 1: Tracking Disabled ===
{
  "productId": "PRODUCT-001",
  "finalStatus": "PS",
  "statusDescription": "◐ Partially Stocked - Some variants unavailable",
  "variantCount": 2,
  "variantStatuses": [
    { "status": "IS", "reason": "Tracking disabled. Using binary status: IS" },
    { "status": "OS", "reason": "Tracking disabled. Using binary status: OS" }
  ],
  "reasoning": "Combined variants: IS + OS → PS"
}
```

---

## Performance Considerations

- **Time Complexity**: O(n) where n is the number of variants
- **Space Complexity**: O(n) for storing variant evaluations
- **Execution**: Each evaluation typically completes in < 1ms
- **Scalability**: Suitable for products with up to thousands of variants
