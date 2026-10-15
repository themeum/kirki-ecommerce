import { createContext, useContext } from 'react';

type ChipLayerReporter = (isOpen: boolean) => void;

const ChipLayerContext = createContext<ChipLayerReporter>(() => undefined);

/**
 * Lets a chip's own floating layer, such as a colour picker, tell the
 * surrounding `MultiSelect` while it is open. The click that dismisses the
 * layer then does not also open the option panel. Outside a `MultiSelect`, or
 * for a chip that never reports, nothing changes.
 *
 * @returns Reporter to call with the layer's open state.
 * @since 1.0.0
 */
const useMultiSelectChipLayer = () => useContext(ChipLayerContext);

export { ChipLayerContext, useMultiSelectChipLayer };
export type { ChipLayerReporter };
