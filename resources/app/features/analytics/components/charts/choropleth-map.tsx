import { keyframes } from '@emotion/react';
import { useQuery } from '@tanstack/react-query';
import { geoMercator, geoPath } from 'd3-geo';
import type { Feature, FeatureCollection, Geometry, Polygon } from 'geojson';
import { type KeyboardEvent, type MouseEvent, useMemo, useState } from 'react';
import { feature } from 'topojson-client';

import Skeleton from '@/components/ui/skeleton';
import ChangeBadge from '@/features/analytics/components/change-badge';
import useElementWidth from '@/features/analytics/hooks/use-element-width';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const ANTARCTICA = '010';
const ASPECT_RATIO = 0.6;
const FIT_SHARE = 0.8;
const MAX_ZOOM = 8;
const FADED_OPACITY = 0.35;
const RIPPLE_RADIUS = 6;

type MapArea = {
  code: string;
  name: string;
  fill: string;
  display: string;
  change: number | null;
};

type ChoroplethMapProps = {
  label: string;
  areas: Record<string, MapArea>;
  selectedNumericCode: string | null;
  rippleNumericCode: string | null;
  onSelect: (code: string | null) => void;
};

type CountryFeature = Feature<Geometry, { name: string }> & { id?: string };

type Point = { x: number; y: number };

const loadCountries = async () => {
  const topology = (await import('world-atlas/countries-110m.json')).default;
  const collection = feature(topology, topology.objects.countries) as FeatureCollection<
    Geometry,
    { name: string }
  >;

  return (collection.features as CountryFeature[]).filter((country) => country.id !== ANTARCTICA);
};

const largestPolygon = (geometry: Geometry, area: (shape: Polygon) => number): Polygon | null => {
  if (geometry.type === 'Polygon') {
    return geometry;
  }

  if (geometry.type !== 'MultiPolygon') {
    return null;
  }

  return geometry.coordinates
    .map((coordinates): Polygon => ({ type: 'Polygon', coordinates }))
    .reduce<Polygon | null>(
      (largest, polygon) => (!largest || area(polygon) > area(largest) ? polygon : largest),
      null,
    );
};

const ChoroplethMap = (props: ChoroplethMapProps) => {
  const { label, areas, selectedNumericCode, rippleNumericCode, onSelect } = props;
  const { ref, width } = useElementWidth(640);
  const height = Math.round(width * ASPECT_RATIO);
  const { data: countries } = useQuery({
    queryKey: ['ChoroplethCountries'],
    queryFn: loadCountries,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tooltipPoint, setTooltipPoint] = useState<Point | null>(null);

  const path = useMemo(() => {
    if (!countries) {
      return null;
    }

    const projection = geoMercator().fitSize([width, height], {
      type: 'FeatureCollection',
      features: countries,
    });

    return geoPath(projection);
  }, [countries, width, height]);

  const shapes = useMemo(
    () =>
      countries && path
        ? countries.map((country) => ({
            id: String(country.id ?? ''),
            key: String(country.id ?? '') || country.properties.name,
            d: path(country) ?? '',
            country,
          }))
        : [],
    [countries, path],
  );

  const zoom = useMemo(() => {
    const selected = shapes.find(
      (shape) => selectedNumericCode && shape.id === selectedNumericCode,
    );
    const polygon =
      selected && path
        ? largestPolygon(selected.country.geometry, (shape) => path.area(shape))
        : null;

    if (!polygon || !path) {
      return { x: 0, y: 0, k: 1 };
    }

    const [[left, top], [right, bottom]] = path.bounds(polygon);
    const k = Math.min(
      MAX_ZOOM,
      FIT_SHARE / Math.max((right - left) / width, (bottom - top) / height),
    );

    return {
      x: width / 2 - k * ((left + right) / 2),
      y: height / 2 - k * ((top + bottom) / 2),
      k,
    };
  }, [shapes, path, selectedNumericCode, width, height]);

  const ripplePoint = useMemo(() => {
    const target = shapes.find((shape) => rippleNumericCode && shape.id === rippleNumericCode);
    const polygon =
      target && path ? largestPolygon(target.country.geometry, (shape) => path.area(shape)) : null;

    if (!polygon || !path) {
      return null;
    }

    const [x, y] = path.centroid(polygon);

    return { x: zoom.x + zoom.k * x, y: zoom.y + zoom.k * y };
  }, [shapes, path, rippleNumericCode, zoom]);

  const active = shapes.find((shape) => shape.key === activeId);
  const activeArea = active ? areas[active.id] : null;

  const showAt = (key: string, point: Point) => {
    setActiveId(key);
    setTooltipPoint(point);
  };

  const showAtPointer = (key: string, event: MouseEvent<SVGPathElement>) => {
    const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();

    showAt(key, {
      x: event.clientX - (bounds?.left ?? 0),
      y: event.clientY - (bounds?.top ?? 0),
    });
  };

  const hide = () => {
    setActiveId(null);
    setTooltipPoint(null);
  };

  const focusPoint = (country: CountryFeature) => {
    const [x, y] = path ? path.centroid(country) : [width / 2, height / 2];

    return { x: zoom.x + zoom.k * x, y: zoom.y + zoom.k * y };
  };

  const handleKeyDown = (event: KeyboardEvent<SVGPathElement>, code: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(code);
    }
  };

  return (
    <div ref={ref} css={scoped(styles.frame)} data-testid="choropleth-map">
      {!countries ? (
        <Skeleton width="100%" height={`${height}px`} data-testid="choropleth-map-loading" />
      ) : (
        <svg
          role="group"
          aria-label={label}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          css={scoped(styles.svg)}
        >
          <rect
            data-testid="choropleth-sea"
            width={width}
            height={height}
            fill="transparent"
            onClick={() => onSelect(null)}
          />
          <g
            data-testid="choropleth-zoom"
            css={scoped(styles.zoom)}
            style={{ transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.k})` }}
          >
            {shapes.map((shape) => {
              const area = areas[shape.id];
              const isFaded = !!selectedNumericCode && shape.id !== selectedNumericCode;

              if (!area) {
                return (
                  <path
                    key={shape.key}
                    d={shape.d}
                    data-country={shape.id}
                    fill={theme.colors.analytics.map.empty}
                    opacity={isFaded ? FADED_OPACITY : 1}
                    css={scoped(styles.country)}
                    onMouseMove={(event) => showAtPointer(shape.key, event)}
                    onMouseLeave={hide}
                  />
                );
              }

              const text = `${area.name} · ${area.display}`;

              return (
                <path
                  key={shape.key}
                  d={shape.d}
                  role="button"
                  tabIndex={0}
                  aria-label={text}
                  aria-pressed={shape.id === selectedNumericCode}
                  data-country={shape.id}
                  fill={area.fill}
                  opacity={isFaded ? FADED_OPACITY : 1}
                  css={scoped(styles.country, styles.interactive)}
                  onClick={() => onSelect(area.code)}
                  onKeyDown={(event) => handleKeyDown(event, area.code)}
                  onMouseMove={(event) => showAtPointer(shape.key, event)}
                  onMouseLeave={hide}
                  onFocus={() => showAt(shape.key, focusPoint(shape.country))}
                  onBlur={hide}
                />
              );
            })}
            {active && (
              <path
                d={active.d}
                data-testid="choropleth-outline"
                fill="none"
                stroke={theme.colors.analytics.map.outline}
                strokeWidth={1.5}
                css={scoped(styles.outline)}
              />
            )}
          </g>
          {ripplePoint && (
            <circle
              key={rippleNumericCode}
              aria-hidden="true"
              data-testid="choropleth-ripple"
              cx={ripplePoint.x}
              cy={ripplePoint.y}
              r={RIPPLE_RADIUS}
              fill="none"
              stroke={theme.colors.analytics.map.ping}
              strokeWidth={2}
              css={scoped(styles.ripple)}
            />
          )}
        </svg>
      )}
      {active && tooltipPoint && (
        <div
          role="tooltip"
          css={scoped(styles.tooltip)}
          style={{ left: `${tooltipPoint.x}px`, top: `${tooltipPoint.y}px` }}
        >
          {activeArea ? (
            <>
              <span>{activeArea.name}</span>
              <span css={scoped(styles.tooltipValue)}>{activeArea.display}</span>
              <ChangeBadge change={activeArea.change} />
            </>
          ) : (
            <>
              <span>{active.country.properties.name}</span>
              <span>{__('No data', 'kirki-ecommerce')}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

ChoroplethMap.displayName = 'ChoroplethMap';

export default ChoroplethMap;
export type { MapArea };

const ripple = keyframes({
  from: {
    transform: 'scale(1)',
    opacity: 0.9,
  },
  to: {
    transform: 'scale(4)',
    opacity: 0,
  },
});

const styles = defineStyles({
  frame: {
    position: 'relative',
    width: '100%',
    minWidth: 0,
  },
  svg: {
    display: 'block',
    overflow: 'hidden',
  },
  zoom: {
    transformOrigin: '0 0',
    transition: 'transform 500ms ease',
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  },
  country: {
    stroke: theme.colors.background.surface,
    strokeWidth: 0.5,
    vectorEffect: 'non-scaling-stroke',
    transition: 'opacity 300ms ease',
    outline: 'none',
  },
  interactive: {
    cursor: 'pointer',
  },
  outline: {
    vectorEffect: 'non-scaling-stroke',
    pointerEvents: 'none',
  },
  ripple: {
    vectorEffect: 'non-scaling-stroke',
    pointerEvents: 'none',
    transformBox: 'fill-box',
    transformOrigin: 'center',
    animation: `${ripple} 800ms ease-out 1 forwards`,
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
      transform: 'scale(4)',
      opacity: 1,
    },
  },
  tooltip: {
    position: 'absolute',
    transform: 'translate(-50%, calc(-100% - 12px))',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[2],
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.analytics.chart.tooltip,
    color: theme.colors.text.light,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    zIndex: theme.zIndex.sticky,
    ...theme.typography.tiny('semibold'),
  },
  tooltipValue: {
    ...theme.typography.tiny('bold'),
  },
});
