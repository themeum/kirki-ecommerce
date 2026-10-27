import { Navigate, Outlet, useOutletContext } from 'react-router';

import { RouteConfig } from '@/config/route-config';
import { useOnboardingStatus } from '@/features/onboarding/lib/onboarding-status';

const OnboardingGate = () => {
  const { isOnboarded } = useOnboardingStatus();
  // The gate sits between the app shell and the pages, so it hands the shell's
  // outlet context (e.g. settings' confirmAction) through unchanged.
  const context = useOutletContext();

  if (!isOnboarded) {
    return <Navigate to={RouteConfig.Onboarding.template} replace />;
  }

  return <Outlet context={context} />;
};

OnboardingGate.displayName = 'OnboardingGate';

export default OnboardingGate;
