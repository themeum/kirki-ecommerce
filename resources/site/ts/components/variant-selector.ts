/**
 * Alpine component: variantSelector
 * Handles variant selection on product details page.
 *
 * PHP usage:
 *   <div x-data="variantSelector({ 
 *     product: <?= json_encode($product) ?>,
 *     variants: <?= json_encode($variants) ?>,
 *     selectedVariantId: <?= $selected_variant?->id ?>
 *   })">
 */
import { emit } from '../events';

export type VariantAttribute = {
  name: string;
  value: string;
}

export type Variant = {
  id: number;
  product_id: number;
  price: number;
  sale_price?: number;
  stock: number;
  image?: string;
  attributes: VariantAttribute[];
  available: boolean;
}

export type VariantSelectorConfig = {
  variants: Variant[];
  selectedVariantId?: number;
  queryParam?: string;
}

export function variantSelector(config: VariantSelectorConfig) {
  const queryParam = config.queryParam || 'variant_id';
  
  return {
    variants: config.variants,
    selectedVariantId: config.selectedVariantId ?? null,
    
    // Track selected attribute values (e.g., { color: 'red', size: 'M' })
    selectedAttributes: {} as Record<string, string>,

    get selectedVariant(): Variant | null {
      return this.variants.find(v => v.id === this.selectedVariantId) ?? this.variants[0];
    },

    get availableVariants(): Variant[] {
      return this.variants.filter(v => v.available);
    },

    get uniqueAttributes(): Record<string, string[]> {
      const attrs: Record<string, string[]> = {};
      this.variants.forEach(variant => {
        variant.attributes.forEach(attr => {
          if (!attrs[attr.name]) {
            attrs[attr.name] = [];
          }
          if (!attrs[attr.name].includes(attr.value)) {
            attrs[attr.name].push(attr.value);
          }
        });
      });
      return attrs;
    },

    get availableAttributes(): Record<string, Set<string>> {
      const available: Record<string, Set<string>> = {};
      
      // For each attribute type, find which values are still available
      // given the currently selected other attributes
      Object.keys(this.uniqueAttributes).forEach(attrName => {
        available[attrName] = new Set();
        
        this.availableVariants.forEach(variant => {
          const matchesOtherAttrs = Object.entries(this.selectedAttributes)
            .filter(([name]) => name !== attrName)
            .every(([name, value]) => 
              variant.attributes.some(a => a.name === name && a.value === value),
            );
          
          if (matchesOtherAttrs) {
            const attrValue = variant.attributes.find(a => a.name === attrName)?.value;
            if (attrValue) {
              available[attrName].add(attrValue);
            }
          }
        });
      });
      
      return available;
    },

    isAttributeAvailable(attrName: string, attrValue: string): boolean {
      return this.availableAttributes[attrName]?.has(attrValue) ?? false;
    },

    isAttributeSelected(attrName: string, attrValue: string): boolean {
      return this.selectedAttributes[attrName] === attrValue;
    },

    selectAttribute(attrName: string, attrValue: string) {
      this.selectedAttributes[attrName] = attrValue;
      this.updateSelectedVariant();
    },

    updateSelectedVariant() {
      // Find variant that matches all selected attributes
      const matchingVariant = this.variants.find(variant => {
        return Object.entries(this.selectedAttributes).every(([name, value]) =>
          variant.attributes.some(attr => attr.name === name && attr.value === value),
        );
      });
      
      if (matchingVariant) {
        this.selectedVariantId = matchingVariant.id;
        
        // Update URL query param
        const url = new URL(window.location.href);
        url.searchParams.set(queryParam, String(matchingVariant.id));
        window.history.replaceState({}, '', url.toString());
        
        // Dispatch event for image slider to update
        emit('kecom:variant:changed', { variant: matchingVariant });
      }
    },

    // Initialize with the first variant's attributes if none selected
    init() {
      // Check URL query param for variant ID first
      const urlParams = new URLSearchParams(window.location.search);
      const urlVariantId = urlParams.get(queryParam);
      
      if (urlVariantId) {
        const variantId = parseInt(urlVariantId, 10);
        const variant = this.variants.find(v => v.id === variantId);
        if (variant) {
          this.selectedVariantId = variantId;
          variant.attributes.forEach(attr => {
            this.selectedAttributes[attr.name] = attr.value;
          });
          // Dispatch event for image slider to update
          emit('kecom:variant:changed', { variant });
          return;
        }
      }
      
      // Fall back to config selectedVariantId
      if (this.selectedVariantId) {
        const variant = this.variants.find(v => v.id === this.selectedVariantId);
        if (variant) {
          variant.attributes.forEach(attr => {
            this.selectedAttributes[attr.name] = attr.value;
          });
          // Dispatch event for image slider to update
          emit('kecom:variant:changed', { variant });
        }
      } else if (this.variants.length > 0) {
        // Auto-select first available variant
        const firstAvailable = this.availableVariants[0];
        if (firstAvailable) {
          this.selectedVariantId = firstAvailable.id;
          firstAvailable.attributes.forEach(attr => {
            this.selectedAttributes[attr.name] = attr.value;
          });
          // Dispatch event for image slider to update
          emit('kecom:variant:changed', { variant: firstAvailable });
        }
      }
    },
  };
}
