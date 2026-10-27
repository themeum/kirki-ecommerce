import { useLocation } from 'react-router';

/** Prints the current path and query so a test can read where the page navigated to. */
const LocationProbe = () => {
  const location = useLocation();

  return <output data-testid="location">{location.pathname + location.search}</output>;
};

LocationProbe.displayName = 'LocationProbe';

export default LocationProbe;
