declare module 'world-atlas/countries-110m.json' {
  import type { GeometryCollection, Topology } from 'topojson-specification';

  const topology: Topology<{ countries: GeometryCollection<{ name: string }> }>;

  export default topology;
}
