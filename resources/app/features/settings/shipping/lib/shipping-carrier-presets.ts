import type {
  ShippingCarrier,
  ShippingCarrierPreset,
} from '@/features/settings/shipping/schemas/catalog/shipping';

const getMissingCarrierPresets = (
  presets: ShippingCarrierPreset[],
  carriers: ShippingCarrier[],
): ShippingCarrierPreset[] => {
  const heldPresetKeys = new Set(carriers.map((carrier) => carrier.preset).filter(Boolean));

  return presets.filter((preset) => !heldPresetKeys.has(preset.key));
};

const buildCarrierFromPreset = (preset: ShippingCarrierPreset): ShippingCarrier => ({
  id: preset.key,
  preset: preset.key,
  name: preset.name,
  tracking_url: preset.tracking_url,
  logo: null,
  logo_url: preset.logo_url,
  is_enabled: true,
});

export { buildCarrierFromPreset, getMissingCarrierPresets };
