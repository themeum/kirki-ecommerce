import { Navigate } from 'react-router';

import { RouteConfig } from '@/config/route-config';
import OnboardingWizard from '@/features/onboarding/components/onboarding-wizard';
import { useOnboardingStatus } from '@/features/onboarding/lib/onboarding-status';

const Onboarding = () => {
  const { isOnboarded, isSetupSessionActive } = useOnboardingStatus();

  if (isOnboarded && !isSetupSessionActive) {
    return <Navigate to={RouteConfig.Home.template} replace />;
  }

  return <OnboardingWizard />;
};

Onboarding.displayName = 'Onboarding';

export default Onboarding;
