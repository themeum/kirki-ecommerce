import { type FocusEvent, type MouseEvent, useCallback, useState } from 'react';

import { EMPTY_VALUE } from '@/features/analytics/lib/format';

type ChartPoint = {
  date: string;
  label: string;
  span_label?: string | null;
  value: number | null;
  previous_label?: string | null;
  previous_span_label?: string | null;
  previous_value?: number | null;
  segments?: number[];
  previous_segments?: number[];
};

type ChartLegendRange = {
  current: string;
  previous?: string | null;
};

type ChartProps = {
  label: string;
  points: ChartPoint[];
  formatValue?: (value: number) => string;
  formatAxisValue?: (value: number) => string;
  legend?: ChartLegendRange | null;
};

type ChartScale = {
  min: number;
  max: number;
  ticks: number[];
  toY: (value: number) => number;
};

type ChartLayout = {
  width: number;
  height: number;
  plotLeft: number;
  plotRight: number;
  plotTop: number;
  plotBottom: number;
  slotWidth: number;
  getX: (index: number) => number;
};

const DEFAULT_CHART_WIDTH = 640;
const CHART_HEIGHT = 220;
const PLOT_TOP = 12;
const PLOT_BOTTOM = CHART_HEIGHT - 28;
const PLOT_RIGHT_GAP = 8;
const GRID_STEPS = 4;
const NICE_MULTIPLIERS = [1, 2.5, 5, 10];
const SMALL_NICE_MULTIPLIERS = [1, 2, 5, 10];
const SMALL_STEP_LIMIT = 10;
const AXIS_CHAR_WIDTH = 6.5;
const Y_LABEL_GAP = 8;
const X_LABEL_SLOT = 64;
const MAX_X_LABELS = 12;

const defaultFormatValue = (value: number) => String(value);

const formatPointValue = (value: number | null | undefined, format: (value: number) => string) => {
  return value === null || value === undefined ? EMPTY_VALUE : format(value);
};

const getNiceStep = (rawStep: number) => {
  if (rawStep <= 0) {
    return 1;
  }

  const power = 10 ** Math.floor(Math.log10(rawStep));
  const multipliers = power < SMALL_STEP_LIMIT ? SMALL_NICE_MULTIPLIERS : NICE_MULTIPLIERS;
  const multiplier = multipliers.find((candidate) => candidate * power >= rawStep) ?? 10;

  return multiplier * power;
};

const buildScale = (values: (number | null | undefined)[]): ChartScale => {
  const numbers = values.filter((value): value is number => typeof value === 'number');
  const low = Math.min(0, ...numbers);
  const high = Math.max(0, ...numbers);
  let step = getNiceStep((high - low) / GRID_STEPS);
  let min = Math.floor(low / step) * step;

  while (min + step * GRID_STEPS < high) {
    step = getNiceStep(step * 1.0001);
    min = Math.floor(low / step) * step;
  }

  const max = min + step * GRID_STEPS;
  const ticks = Array.from({ length: GRID_STEPS + 1 }, (_, index) => min + step * index);

  return {
    min,
    max,
    ticks,
    toY: (value) => PLOT_BOTTOM - ((value - min) / (max - min)) * (PLOT_BOTTOM - PLOT_TOP),
  };
};

const estimateTextWidth = (text: string) => text.length * AXIS_CHAR_WIDTH;

const buildLayout = (width: number, count: number, yLabels: string[]): ChartLayout => {
  const plotLeft = Math.max(0, ...yLabels.map(estimateTextWidth)) + Y_LABEL_GAP;
  const plotRight = Math.max(plotLeft + 1, width - PLOT_RIGHT_GAP);
  const slotWidth = (plotRight - plotLeft) / Math.max(count, 1);

  return {
    width,
    height: CHART_HEIGHT,
    plotLeft,
    plotRight,
    plotTop: PLOT_TOP,
    plotBottom: PLOT_BOTTOM,
    slotWidth,
    getX: (index) => plotLeft + slotWidth * (index + 0.5),
  };
};

const getXLabelIndexes = (count: number, plotWidth: number) => {
  const fit = Math.max(1, Math.floor(plotWidth / X_LABEL_SLOT));
  const step = Math.max(1, Math.ceil(count / MAX_X_LABELS), Math.ceil(count / fit));

  return Array.from({ length: Math.ceil(count / step) }, (_, index) => index * step);
};

const useActivePoint = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const getHandlers = useCallback((index: number) => {
    return {
      onMouseOver: (_event: MouseEvent) => setActiveIndex(index),
      onMouseOut: (_event: MouseEvent) => setActiveIndex(null),
      onFocus: (_event: FocusEvent) => setActiveIndex(index),
      onBlur: (_event: FocusEvent) => setActiveIndex(null),
    };
  }, []);

  return { activeIndex, getHandlers };
};

type ActivePointHandlers = ReturnType<typeof useActivePoint>['getHandlers'];

export {
  buildLayout,
  buildScale,
  CHART_HEIGHT,
  DEFAULT_CHART_WIDTH,
  defaultFormatValue,
  estimateTextWidth,
  formatPointValue,
  getNiceStep,
  getXLabelIndexes,
  useActivePoint,
};
export type {
  ActivePointHandlers,
  ChartLayout,
  ChartLegendRange,
  ChartPoint,
  ChartProps,
  ChartScale,
};
