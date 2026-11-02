import { useState } from 'react';
import { useNavigate } from 'react-router';

import { RouteConfig } from '@/config/route-config';
import MigrationFlow, {
  type MigrationShellProgress,
} from '@/features/migration/components/migration-flow';
import { COMPLETION_STEP, OnboardingShell } from '@/features/onboarding';
import { __ } from '@/wpi18n';

const WOO_COMMERCE_SOURCE = 'woocommerce';
const WOO_COMMERCE_LABEL = 'WooCommerce';

const WooCommerceMigration = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<MigrationShellProgress>({
    percent: 0,
    title: __('Migrate from WooCommerce', 'kirki-ecommerce'),
    message: __('Choose what to migrate', 'kirki-ecommerce'),
  });

  const goHome = () => void navigate(RouteConfig.Home.template);

  return (
    <OnboardingShell step={COMPLETION_STEP} stepCount={0} progressOverride={progress}>
      <MigrationFlow
        source={WOO_COMMERCE_SOURCE}
        sourceLabel={WOO_COMMERCE_LABEL}
        onProgressChange={setProgress}
        onSkip={goHome}
        onFinish={goHome}
      />
    </OnboardingShell>
  );
};

WooCommerceMigration.displayName = 'WooCommerceMigration';

export default WooCommerceMigration;
