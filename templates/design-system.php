<?php

/**
 * Design System Showcase Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Helpers\TemplateHelper;
?>
<?php TemplateHelper::get_header(); ?>

<style>
.kds { max-width:960px; margin:2.5rem auto; padding:0 1.5rem 4rem; font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#18181b; }
.kds h1 { font-size:1.75rem; font-weight:700; margin:0 0 .25rem; }
.kds .kds-subtitle { font-size:.9375rem; color:#71717a; margin:0 0 3rem; }
.kds section { margin-bottom:3.5rem; }
.kds .kds-section-title { font-size:1rem; font-weight:600; letter-spacing:.04em; text-transform:uppercase; color:#71717a; margin:0 0 1.25rem; padding-bottom:.5rem; border-bottom:1px solid #e4e4e7; }
.kds .kds-row { display:flex; flex-wrap:wrap; align-items:center; gap:.75rem; margin-bottom:.875rem; }
.kds .kds-row:last-child { margin-bottom:0; }
.kds .kds-label { font-size:.6875rem; font-weight:500; letter-spacing:.06em; text-transform:uppercase; color:#a1a1aa; margin:1.25rem 0 .5rem; }
.kds .kds-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; max-width:640px; }
.kds .kds-span-2 { grid-column:span 2; }
.kds .kds-card-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:1.25rem; }
.kds .kds-swatch-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:.75rem; }
.kds .kds-swatch { border-radius:8px; overflow:hidden; border:1px solid #e4e4e7; font-size:.6875rem; }
.kds .kds-swatch-color { height:56px; }
.kds .kds-swatch-label { padding:.375rem .5rem; background:#fff; color:#52525b; font-weight:500; }
@media (max-width:600px) { .kds .kds-grid-2 { grid-template-columns:1fr; } .kds .kds-span-2 { grid-column:span 1; } }
</style>

<div class="kds">
<h1>Design System</h1>
<p class="kds-subtitle">Kirki Ecommerce &middot; Site component library</p>

<!-- COLORS -->
<section>
    <p class="kds-section-title">Colors</p>
    <p class="kds-label">Brand</p>
    <div class="kds-swatch-grid">
        <div class="kds-swatch"><div class="kds-swatch-color" style="background:var(--kirki-color-brand,hsl(214 100% 54%))"></div><div class="kds-swatch-label">Brand</div></div>
        <div class="kds-swatch"><div class="kds-swatch-color" style="background:var(--kirki-color-brand-hover,hsl(214 83% 50%))"></div><div class="kds-swatch-label">Brand Hover</div></div>
        <div class="kds-swatch"><div class="kds-swatch-color" style="background:var(--kirki-color-brand-light,hsl(214 100% 95%))"></div><div class="kds-swatch-label">Brand Light</div></div>
    </div>
    <p class="kds-label">Semantic</p>
    <div class="kds-swatch-grid">
        <div class="kds-swatch"><div class="kds-swatch-color" style="background:var(--kirki-color-success,hsl(145 36% 44%))"></div><div class="kds-swatch-label">Success</div></div>
        <div class="kds-swatch"><div class="kds-swatch-color" style="background:var(--kirki-color-success-bg,hsl(141 100% 95%))"></div><div class="kds-swatch-label">Success BG</div></div>
        <div class="kds-swatch"><div class="kds-swatch-color" style="background:var(--kirki-color-error,hsl(0 100% 42%))"></div><div class="kds-swatch-label">Error</div></div>
        <div class="kds-swatch"><div class="kds-swatch-color" style="background:var(--kirki-color-error-bg,hsl(2 100% 95%))"></div><div class="kds-swatch-label">Error BG</div></div>
        <div class="kds-swatch"><div class="kds-swatch-color" style="background:var(--kirki-color-warning,hsl(42 100% 18%))"></div><div class="kds-swatch-label">Warning</div></div>
        <div class="kds-swatch"><div class="kds-swatch-color" style="background:var(--kirki-color-warning-bg,hsl(38 100% 92%))"></div><div class="kds-swatch-label">Warning BG</div></div>
    </div>
    <p class="kds-label">Neutrals</p>
    <div class="kds-swatch-grid">
        <div class="kds-swatch"><div class="kds-swatch-color" style="background:var(--kirki-color-bg,#fff)"></div><div class="kds-swatch-label">BG</div></div>
        <div class="kds-swatch"><div class="kds-swatch-color" style="background:var(--kirki-color-bg-alt,hsl(248 23% 96%))"></div><div class="kds-swatch-label">BG Alt</div></div>
        <div class="kds-swatch"><div class="kds-swatch-color" style="background:var(--kirki-color-bg-hover,hsl(248 20% 94%))"></div><div class="kds-swatch-label">BG Hover</div></div>
        <div class="kds-swatch"><div class="kds-swatch-color" style="background:var(--kirki-color-border,hsl(252 14% 90%));border:none"></div><div class="kds-swatch-label">Border</div></div>
        <div class="kds-swatch"><div class="kds-swatch-color" style="background:var(--kirki-color-text,hsl(255 4% 20%))"></div><div class="kds-swatch-label">Text</div></div>
        <div class="kds-swatch"><div class="kds-swatch-color" style="background:var(--kirki-color-text-muted,hsl(249 10% 72%))"></div><div class="kds-swatch-label">Text Muted</div></div>
    </div>
</section>

<!-- TYPOGRAPHY -->
<section>
    <p class="kds-section-title">Typography</p>
    <div style="display:flex;flex-direction:column;gap:.75rem;">
        <div style="font-size:2.25rem;font-weight:800;line-height:2.5rem;letter-spacing:-.9px;">Heading 1 &middot; 36px / 800</div>
        <div style="font-size:1.875rem;font-weight:600;line-height:2.25rem;letter-spacing:-.75px;">Heading 2 &middot; 30px / 600</div>
        <div style="font-size:1.5rem;font-weight:600;line-height:2rem;letter-spacing:-.6px;">Heading 3 &middot; 24px / 600</div>
        <div style="font-size:1.25rem;font-weight:600;line-height:1.75rem;">Heading 4 &middot; 20px / 600</div>
        <div style="font-size:1.125rem;font-weight:600;line-height:1.5rem;">Heading 5 &middot; 18px / 600</div>
        <div style="font-size:1rem;font-weight:400;line-height:1.5rem;">Paragraph &middot; 16px / 400 &mdash; The quick brown fox jumps over the lazy dog.</div>
        <div style="font-size:.875rem;color:#71717a;">Small &middot; 14px / 400 &mdash; Supplementary body copy and labels.</div>
        <div style="font-size:.75rem;color:#a1a1aa;">Tiny &middot; 12px / 400 &mdash; Captions, timestamps, help text.</div>
        <div style="font-size:.625rem;color:#a1a1aa;">Micro &middot; 10px / 400 &mdash; Tag labels, fine print.</div>
    </div>
    <p class="kds-label" style="margin-top:1.5rem;">Utility classes</p>
    <div style="display:flex;flex-direction:column;gap:.5rem;">
        <div class="kirki-text-4xl kirki-font-bold">kirki-text-4xl + kirki-font-bold</div>
        <div class="kirki-text-2xl kirki-font-semibold">kirki-text-2xl + kirki-font-semibold</div>
        <div class="kirki-text-md kirki-font-medium">kirki-text-md + kirki-font-medium</div>
        <div class="kirki-text-base">kirki-text-base (default)</div>
        <div class="kirki-text-sm kirki-text-muted">kirki-text-sm + kirki-text-muted</div>
        <div class="kirki-truncate" style="max-width:280px;">kirki-truncate: The quick brown fox jumps over the lazy dog and keeps going.</div>
    </div>
</section>

<!-- BUTTONS -->
<section>
    <p class="kds-section-title">Buttons</p>

    <p class="kds-label">Variants</p>
    <div class="kds-row">
        <button class="kirki-btn kirki-btn-primary">Primary</button>
        <button class="kirki-btn kirki-btn-secondary">Secondary</button>
        <button class="kirki-btn kirki-btn-destructive">Destructive</button>
        <button class="kirki-btn kirki-btn-outline">Outline</button>
        <button class="kirki-btn kirki-btn-ghost">Ghost</button>
        <button class="kirki-btn kirki-btn-link">Link</button>
    </div>

    <p class="kds-label">Soft Variants</p>
    <div class="kds-row">
        <button class="kirki-btn kirki-btn-primary-soft">Primary Soft</button>
        <button class="kirki-btn kirki-btn-destructive-soft">Destructive Soft</button>
    </div>

    <p class="kds-label">Sizes (32px / 36px / 40px)</p>
    <div class="kds-row">
        <button class="kirki-btn kirki-btn-primary kirki-btn-sm">Small</button>
        <button class="kirki-btn kirki-btn-primary">Default</button>
        <button class="kirki-btn kirki-btn-primary kirki-btn-lg">Large</button>
    </div>

    <p class="kds-label">Icon-only</p>
    <div class="kds-row">
        <button class="kirki-btn kirki-btn-primary kirki-btn-icon-sm" aria-label="Search">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="m6 8 1.333 1.333L10 6.667m-7.433-.92a2.667 2.667 0 0 1 3.186-3.18 2.667 2.667 0 0 1 4.494 0 2.667 2.667 0 0 1 3.186 3.186 2.666 2.666 0 0 1 0 4.494 2.667 2.667 0 0 1-3.18 3.186 2.667 2.667 0 0 1-4.5 0 2.667 2.667 0 0 1-3.186-3.18 2.667 2.667 0 0 1 0-4.506"/></svg>
        </button>
        <button class="kirki-btn kirki-btn-primary kirki-btn-icon" aria-label="Settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="m6 8 1.333 1.333L10 6.667m-7.433-.92a2.667 2.667 0 0 1 3.186-3.18 2.667 2.667 0 0 1 4.494 0 2.667 2.667 0 0 1 3.186 3.186 2.666 2.666 0 0 1 0 4.494 2.667 2.667 0 0 1-3.18 3.186 2.667 2.667 0 0 1-4.5 0 2.667 2.667 0 0 1-3.186-3.18 2.667 2.667 0 0 1 0-4.506"/></svg>
        </button>
        <button class="kirki-btn kirki-btn-primary kirki-btn-icon-lg" aria-label="Menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="m6 8 1.333 1.333L10 6.667m-7.433-.92a2.667 2.667 0 0 1 3.186-3.18 2.667 2.667 0 0 1 4.494 0 2.667 2.667 0 0 1 3.186 3.186 2.666 2.666 0 0 1 0 4.494 2.667 2.667 0 0 1-3.18 3.186 2.667 2.667 0 0 1-4.5 0 2.667 2.667 0 0 1-3.186-3.18 2.667 2.667 0 0 1 0-4.506"/></svg>
        </button>
    </div>

    <p class="kds-label">Disabled states</p>
    <div class="kds-row">
        <button class="kirki-btn kirki-btn-primary" disabled>Primary</button>
        <button class="kirki-btn kirki-btn-secondary" disabled>Secondary</button>
        <button class="kirki-btn kirki-btn-destructive" disabled>Destructive</button>
        <button class="kirki-btn kirki-btn-outline" disabled>Outline</button>
    </div>

    <p class="kds-label">Full width</p>
    <button class="kirki-btn kirki-btn-primary kirki-btn-block" style="max-width:360px;">Full Width Button</button>
</section>

<!-- BADGES -->
<section>
    <p class="kds-section-title">Badges</p>

    <p class="kds-label">Variants</p>
    <div class="kds-row">
        <span class="kirki-badge kirki-badge-default">Default</span>
        <span class="kirki-badge kirki-badge-primary">Primary</span>
        <span class="kirki-badge kirki-badge-success">Success</span>
        <span class="kirki-badge kirki-badge-success-light">Success Light</span>
        <span class="kirki-badge kirki-badge-error">Error</span>
        <span class="kirki-badge kirki-badge-error-light">Error Light</span>
        <span class="kirki-badge kirki-badge-warning">Warning</span>
        <span class="kirki-badge kirki-badge-outline">Outline</span>
    </div>

    <p class="kds-label">Ecommerce contexts</p>
    <div class="kds-row">
        <span class="kirki-badge kirki-badge-success-light">In Stock</span>
        <span class="kirki-badge kirki-badge-warning">Low Stock</span>
        <span class="kirki-badge kirki-badge-error-light">Out of Stock</span>
        <span class="kirki-badge kirki-badge-primary">Sale</span>
        <span class="kirki-badge kirki-badge-default">New</span>
    </div>

    <p class="kds-label">Sizes</p>
    <div class="kds-row">
        <span class="kirki-badge kirki-badge-primary kirki-badge-sm">Small</span>
        <span class="kirki-badge kirki-badge-primary">Medium</span>
        <span class="kirki-badge kirki-badge-primary kirki-badge-lg">Large</span>
    </div>
</section>

<!-- FORM INPUTS -->
<section>
    <p class="kds-section-title">Form Inputs</p>

    <div class="kds-grid-2">
        <div class="kirki-field">
            <label class="kirki-field-label kirki-field-label-required">Email address</label>
            <input class="kirki-input" type="email" placeholder="you@example.com">
            <span class="kirki-field-help">We will never share your email.</span>
        </div>
        <div class="kirki-field">
            <label class="kirki-field-label">Search</label>
            <input class="kirki-input" type="text" placeholder="Search products&hellip;">
        </div>
        <div class="kirki-field">
            <label class="kirki-field-label">Input &ndash; small</label>
            <input class="kirki-input kirki-input-sm" type="text" placeholder="Small input">
        </div>
        <div class="kirki-field">
            <label class="kirki-field-label">Input &ndash; large</label>
            <input class="kirki-input kirki-input-lg" type="text" placeholder="Large input">
        </div>
        <div class="kirki-field kirki-field-error-state">
            <label class="kirki-field-label kirki-field-label-required">Promo code</label>
            <input class="kirki-input" type="text" value="BADCODE">
            <span class="kirki-field-error">That code is not valid.</span>
        </div>
        <div class="kirki-field">
            <label class="kirki-field-label">Sort by</label>
            <select class="kirki-select">
                <option>Newest first</option>
                <option>Price: low to high</option>
                <option>Price: high to low</option>
                <option>Best rated</option>
            </select>
        </div>
        <div class="kirki-field kds-span-2">
            <label class="kirki-field-label">Order notes</label>
            <textarea class="kirki-textarea" placeholder="Any special instructions&hellip;" rows="3"></textarea>
            <span class="kirki-field-help">Optional. We will pass this to the fulfilment team.</span>
        </div>
    </div>

    <p class="kds-label">Checkbox &amp; Radio</p>
    <div class="kds-row" style="flex-direction:column;align-items:flex-start;gap:.625rem;">
        <label class="kirki-checkbox"><input class="kirki-checkbox-input" type="checkbox" checked><span class="kirki-checkbox-label">I agree to the terms and conditions</span></label>
        <label class="kirki-checkbox"><input class="kirki-checkbox-input" type="checkbox"><span class="kirki-checkbox-label">Subscribe to newsletter</span></label>
        <label class="kirki-checkbox"><input class="kirki-checkbox-input" type="checkbox" disabled><span class="kirki-checkbox-label">Disabled checkbox</span></label>
    </div>
    <div class="kds-row" style="flex-direction:column;align-items:flex-start;gap:.625rem;margin-top:.75rem;">
        <label class="kirki-radio"><input class="kirki-radio-input" type="radio" name="ds-shipping" checked><span class="kirki-radio-label">Standard shipping (3&ndash;5 days)</span></label>
        <label class="kirki-radio"><input class="kirki-radio-input" type="radio" name="ds-shipping"><span class="kirki-radio-label">Express shipping (1&ndash;2 days)</span></label>
        <label class="kirki-radio"><input class="kirki-radio-input" type="radio" name="ds-shipping" disabled><span class="kirki-radio-label">Overnight (unavailable)</span></label>
    </div>

    <p class="kds-label">Quantity Stepper</p>
    <div x-data="quantitySelector({ min: 1, max: 99, initial: 1 })" class="kirki-quantity">
        <button class="kirki-quantity-btn" type="button" aria-label="Decrease" @click="decrement">&minus;</button>
        <input class="kirki-quantity-input" type="number" :value="quantity" @input="setValue($el.value)" min="1" max="99" aria-label="Quantity">
        <button class="kirki-quantity-btn" type="button" aria-label="Increase" @click="increment">+</button>
    </div>
</section>

<!-- CARDS -->
<section>
    <p class="kds-section-title">Cards</p>
    <div class="kds-card-grid">

        <div class="kirki-card">
            <div class="kirki-card-image" style="height:160px;background:#e8edf5;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:.75rem;">Image</div>
            <div class="kirki-card-body">
                <span class="kirki-badge kirki-badge-default" style="margin-bottom:.5rem;">Default</span>
                <h3 class="kirki-card-title">Plain Card</h3>
                <p class="kirki-card-meta">No shadow, no hover</p>
                <div class="kirki-card-price">$19.99</div>
            </div>
            <div class="kirki-card-footer">
                <button class="kirki-btn kirki-btn-outline kirki-btn-sm kirki-btn-block">View</button>
            </div>
        </div>

        <div class="kirki-card kirki-card-hoverable">
            <div class="kirki-card-image" style="height:160px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:.75rem;">Image</div>
            <div class="kirki-card-body">
                <span class="kirki-badge kirki-badge-success-light" style="margin-bottom:.5rem;">In Stock</span>
                <h3 class="kirki-card-title">Classic T-Shirt</h3>
                <p class="kirki-card-meta">Comfortable everyday tee</p>
                <div class="kirki-card-price">$29.99</div>
            </div>
            <div class="kirki-card-footer">
                <button class="kirki-btn kirki-btn-primary kirki-btn-sm kirki-btn-block">Add to Cart</button>
            </div>
        </div>

        <div class="kirki-card kirki-card-hoverable">
            <div class="kirki-card-image" style="height:160px;background:#fefce8;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:.75rem;">Image</div>
            <div class="kirki-card-body">
                <span class="kirki-badge kirki-badge-warning" style="margin-bottom:.5rem;">Low Stock</span>
                <h3 class="kirki-card-title">Running Shoes</h3>
                <p class="kirki-card-meta">Lightweight performance</p>
                <div class="kirki-card-price">$89.00</div>
            </div>
            <div class="kirki-card-footer">
                <button class="kirki-btn kirki-btn-primary kirki-btn-sm kirki-btn-block">Add to Cart</button>
            </div>
        </div>

        <div class="kirki-card kirki-card-hoverable">
            <div class="kirki-card-image" style="height:160px;background:#fdf4ff;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:.75rem;">Image</div>
            <div class="kirki-card-body">
                <span class="kirki-badge kirki-badge-error-light" style="margin-bottom:.5rem;">Out of Stock</span>
                <h3 class="kirki-card-title">Leather Wallet</h3>
                <p class="kirki-card-meta">Full-grain leather</p>
                <div class="kirki-card-price">$49.99</div>
            </div>
            <div class="kirki-card-footer">
                <button class="kirki-btn kirki-btn-outline kirki-btn-sm kirki-btn-block" disabled>Out of Stock</button>
            </div>
        </div>

        <div class="kirki-card kirki-card-shadow">
            <div class="kirki-card-image" style="height:160px;background:#e8edf5;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:.75rem;">Image</div>
            <div class="kirki-card-body">
                <span class="kirki-badge kirki-badge-primary" style="margin-bottom:.5rem;">Sale</span>
                <h3 class="kirki-card-title">Shadow Card</h3>
                <p class="kirki-card-meta">Elevated with box-shadow</p>
                <div class="kirki-card-price"><s style="color:#a1a1aa;font-weight:400;">$60.00</s> $39.99</div>
            </div>
            <div class="kirki-card-footer">
                <button class="kirki-btn kirki-btn-primary kirki-btn-sm kirki-btn-block">Add to Cart</button>
            </div>
        </div>

    </div>
</section>

<!-- SPACING SCALE -->
<section>
    <p class="kds-section-title">Spacing Scale</p>
    <?php
    $spacing = ['1 · 4px' => '0.25rem','2 · 8px' => '0.5rem','3 · 12px' => '0.75rem','4 · 16px' => '1rem',
                '5 · 20px' => '1.25rem','6 · 24px' => '1.5rem','8 · 32px' => '2rem','10 · 40px' => '2.5rem','12 · 48px' => '3rem'];
    foreach ($spacing as $label => $value) : ?>
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:.5rem;">
            <div style="width:6rem;font-size:.6875rem;color:#71717a;font-family:monospace;"><?php echo esc_html($label); ?></div>
            <div style="height:1rem;background:hsl(214 100% 54%);border-radius:2px;width:<?php echo esc_attr($value); ?>;"></div>
        </div>
    <?php endforeach; ?>
</section>

<!-- BORDER RADIUS -->
<section>
    <p class="kds-section-title">Border Radius</p>
    <div class="kds-row" style="align-items:flex-end;gap:1.5rem;">
        <?php
        $radii = ['sm · 4px' => '4px','md · 6px' => '6px','lg · 8px' => '8px','xl · 12px' => '12px','full' => '9999px'];
        foreach ($radii as $label => $value) : ?>
            <div style="display:flex;flex-direction:column;align-items:center;gap:.5rem;">
                <div style="width:56px;height:56px;background:hsl(214 100% 54%);border-radius:<?php echo esc_attr($value); ?>;"></div>
                <span style="font-size:.6875rem;color:#71717a;font-family:monospace;"><?php echo esc_html($label); ?></span>
            </div>
        <?php endforeach; ?>
    </div>
</section>

<!-- SHADOWS -->
<section>
    <p class="kds-section-title">Shadows</p>
    <div class="kds-row" style="align-items:flex-end;gap:2rem;">
        <?php
        $shadows = [
            'sm'      => '0px 1px 2px 0px hsla(0,0%,0%,.05)',
            'default' => '0px 1px 3px 0px hsla(0,0%,0%,.1),0px 1px 2px -1px hsla(0,0%,0%,.1)',
            'md'      => '0px 4px 6px -1px hsla(0,0%,0%,.1),0px 2px 4px -2px hsla(0,0%,0%,.1)',
            'lg'      => '0px 10px 15px -3px hsla(0,0%,0%,.1),0px 4px 6px -4px hsla(0,0%,0%,.1)',
        ];
        foreach ($shadows as $label => $value) : ?>
            <div style="display:flex;flex-direction:column;align-items:center;gap:.75rem;">
                <div style="width:72px;height:72px;background:#fff;border-radius:8px;box-shadow:<?php echo esc_attr($value); ?>;"></div>
                <span style="font-size:.6875rem;color:#71717a;font-family:monospace;"><?php echo esc_html($label); ?></span>
            </div>
        <?php endforeach; ?>
    </div>
</section>

<!-- MODAL -->
<section>
    <p class="kds-section-title">Modal</p>
    
    <p class="kds-label">Trigger</p>
    <div class="kds-row">
        <button class="kirki-btn kirki-btn-primary" onclick="document.getElementById('demo-modal').style.display='flex'">Open Modal</button>
    </div>

    <p class="kds-label">Size Variants</p>
    <div class="kds-row">
        <button class="kirki-btn kirki-btn-secondary kirki-btn-sm" onclick="document.getElementById('demo-modal-sm').style.display='flex'">Small</button>
        <button class="kirki-btn kirki-btn-secondary kirki-btn-sm" onclick="document.getElementById('demo-modal-lg').style.display='flex'">Large</button>
    </div>
</section>

<!-- TOAST -->
<section>
    <p class="kds-section-title">Toast Notifications</p>
    
    <p class="kds-label">Variants</p>
    <div class="kds-row">
        <button class="kirki-btn kirki-btn-success-light" onclick="showToast('success')">Success</button>
        <button class="kirki-btn kirki-btn-error-light" onclick="showToast('error')">Error</button>
        <button class="kirki-btn kirki-btn-outline" onclick="showToast('warning')">Warning</button>
        <button class="kirki-btn kirki-btn-secondary" onclick="showToast('info')">Info</button>
    </div>

    <p class="kds-label">Position Variants</p>
    <div class="kds-row">
        <button class="kirki-btn kirki-btn-outline kirki-btn-sm" onclick="showToast('success', 'top-left')">Top Left</button>
        <button class="kirki-btn kirki-btn-outline kirki-btn-sm" onclick="showToast('success', 'top-right')">Top Right</button>
        <button class="kirki-btn kirki-btn-outline kirki-btn-sm" onclick="showToast('success', 'bottom-left')">Bottom Left</button>
        <button class="kirki-btn kirki-btn-outline kirki-btn-sm" onclick="showToast('success', 'bottom-right')">Bottom Right</button>
    </div>
</section>


<!-- Form Validation Example -->
<section class="kirki-section">
    <h2 class="kirki-section-title">Form Validation</h2>
    
    <form x-data="form({ 
        defaultValues: { 
            name: '', 
            email: '', 
            password: '', 
            confirmPassword: '' 
        },
        mode: 'onBlur'
    })" @submit.prevent="handleSubmit(
        (data) => { 
            console.log('Form submitted:', data); 
            showToast('success', 'Form submitted successfully!');
            reset();
        },
        () => {
            showToast('error', 'Please fix the errors');
        }
    )" class="kirki-form">
        <div class="kirki-form-field">
            <label for="name">Full Name *</label>
            <input 
                id="name" 
                type="text" 
                x-bind="register('name', { 
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                })"
                placeholder="Enter your full name"
            >
            <span class="kirki-form-error" x-show="errors.name" x-text="errors.name"></span>
        </div>

        <div class="kirki-form-field">
            <label for="email">Email Address *</label>
            <input 
                id="email" 
                type="email" 
                x-bind="register('email', { 
                    required: 'Email is required',
                    email: true
                })"
                placeholder="Enter your email"
            >
            <span class="kirki-form-error" x-show="errors.email" x-text="errors.email"></span>
        </div>

        <div class="kirki-form-field">
            <label for="password">Password *</label>
            <input 
                id="password" 
                type="password" 
                x-bind="register('password', { 
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' }
                })"
                placeholder="Create a password"
            >
            <span class="kirki-form-error" x-show="errors.password" x-text="errors.password"></span>
        </div>

        <div class="kirki-form-field">
            <label for="confirmPassword">Confirm Password *</label>
            <input 
                id="confirmPassword" 
                type="password" 
                x-bind="register('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: (value) => value === values.password || 'Passwords do not match'
                })"
                placeholder="Confirm your password"
            >
            <span class="kirki-form-error" x-show="errors.confirmPassword" x-text="errors.confirmPassword"></span>
        </div>

        <div class="kirki-form-field">
            <button type="submit" class="kirki-btn kirki-btn-primary" :disabled="isSubmitting">
                <span x-show="!isSubmitting">Submit Form</span>
                <span x-show="isSubmitting">Submitting...</span>
            </button>
            <button type="button" class="kirki-btn kirki-btn-secondary" @click="reset()" :disabled="isSubmitting">
                Reset
            </button>
        </div>

        <div class="kirki-form-debug" x-show="Object.keys(errors).length > 0 || isSubmitting">
            <strong>Form State:</strong>
            <pre x-text="JSON.stringify(getFormState(), null, 2)"></pre>
        </div>
    </form>
</section>

</div><!-- /.kds -->

<!-- MODAL DEMO -->
<div id="demo-modal" class="kirki-modal-backdrop" style="display:none;" onclick="this.style.display='none'">
    <div class="kirki-modal" onclick="event.stopPropagation()">
        <div class="kirki-modal-content">
            <div class="kirki-modal-header">
                <h3 class="kirki-modal-header-title">Modal Title</h3>
                <button class="kirki-modal-header-close" onclick="document.getElementById('demo-modal').style.display='none'">&times;</button>
            </div>
            <div class="kirki-modal-body">
                <p>This is a standard modal dialog. It can contain any content including forms, images, or text.</p>
                <p style="margin-top:1rem;color:#71717a;">Modals are great for focused interactions that require user attention.</p>
            </div>
            <div class="kirki-modal-footer">
                <button class="kirki-btn kirki-btn-secondary" onclick="document.getElementById('demo-modal').style.display='none'">Cancel</button>
                <button class="kirki-btn kirki-btn-primary" onclick="document.getElementById('demo-modal').style.display='none'">Confirm</button>
            </div>
        </div>
    </div>
</div>

<div id="demo-modal-sm" class="kirki-modal-backdrop" style="display:none;" onclick="this.style.display='none'">
    <div class="kirki-modal" onclick="event.stopPropagation()">
        <div class="kirki-modal-content kirki-modal-content-sm">
            <div class="kirki-modal-header">
                <h3 class="kirki-modal-header-title">Small Modal</h3>
                <button class="kirki-modal-header-close" onclick="document.getElementById('demo-modal-sm').style.display='none'">&times;</button>
            </div>
            <div class="kirki-modal-body">
                <p>This is a small modal variant for compact content.</p>
            </div>
            <div class="kirki-modal-footer">
                <button class="kirki-btn kirki-btn-primary" onclick="document.getElementById('demo-modal-sm').style.display='none'">OK</button>
            </div>
        </div>
    </div>
</div>

<div id="demo-modal-lg" class="kirki-modal-backdrop" style="display:none;" onclick="this.style.display='none'">
    <div class="kirki-modal" onclick="event.stopPropagation()">
        <div class="kirki-modal-content kirki-modal-content-lg">
            <div class="kirki-modal-header">
                <h3 class="kirki-modal-header-title">Large Modal</h3>
                <button class="kirki-modal-header-close" onclick="document.getElementById('demo-modal-lg').style.display='none'">&times;</button>
            </div>
            <div class="kirki-modal-body">
                <p>This is a large modal variant for more complex content.</p>
                <p style="margin-top:1rem;">Large modals are useful for detailed forms, multi-step processes, or content that requires more space.</p>
                <p style="margin-top:1rem;">The content area scrolls independently while the header and footer remain fixed.</p>
            </div>
            <div class="kirki-modal-footer">
                <button class="kirki-btn kirki-btn-secondary" onclick="document.getElementById('demo-modal-lg').style.display='none'">Cancel</button>
                <button class="kirki-btn kirki-btn-primary" onclick="document.getElementById('demo-modal-lg').style.display='none'">Save Changes</button>
            </div>
        </div>
    </div>
</div>

<!-- TOAST DEMO CONTAINER -->
<div id="toast-container" class="kirki-toast-container"></div>

<script>
function showToast(variant, position = 'top-right') {
    const container = document.getElementById('toast-container');
    container.className = 'kirki-toast-container kirki-toast-container-' + position;
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    const titles = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Information'
    };
    
    const messages = {
        success: 'Your action was completed successfully.',
        error: 'Something went wrong. Please try again.',
        warning: 'Please review this before proceeding.',
        info: 'Here is some helpful information.'
    };
    
    const toast = document.createElement('div');
    toast.className = 'kirki-toast kirki-toast-' + variant;
    toast.innerHTML = `
        <div class="kirki-toast-icon">${icons[variant]}</div>
        <div class="kirki-toast-content">
            <div class="kirki-toast-title">${titles[variant]}</div>
            <div class="kirki-toast-message">${messages[variant]}</div>
        </div>
        <button class="kirki-toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 200);
    }, 5000);
}
</script>


<style>
.kirki-section {
    padding: 2rem 0;
    border-bottom: 1px solid var(--kirki-color-border, #e2e8f0);
}

.kirki-section-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: var(--kirki-color-text, #18181b);
}

.kirki-form {
    max-width: 500px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.kirki-form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.kirki-form-field label {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--kirki-color-text, #18181b);
}

.kirki-form-field input {
    padding: 0.75rem 1rem;
    border: 1px solid var(--kirki-color-border, #e2e8f0);
    border-radius: var(--kirki-radius-md, 6px);
    font-size: 1rem;
    transition: border-color 0.2s;
}

.kirki-form-field input:focus {
    outline: none;
    border-color: var(--kirki-color-brand, #3b82f6);
    box-shadow: 0 0 0 3px var(--kirki-color-brand-light, #eff6ff);
}

.kirki-form-field input.kirki-input-error {
    border-color: var(--kirki-color-error, #ef4444);
}

.kirki-form-error {
    font-size: 0.875rem;
    color: var(--kirki-color-error, #ef4444);
    min-height: 1.25rem;
}

.kirki-form-debug {
    background: var(--kirki-color-bg-alt, #f8fafc);
    padding: 1rem;
    border-radius: var(--kirki-radius-md, 6px);
    font-size: 0.875rem;
}

.kirki-form-debug pre {
    margin: 0.5rem 0 0 0;
    overflow-x: auto;
}
</style>

<?php TemplateHelper::get_footer(); ?>
