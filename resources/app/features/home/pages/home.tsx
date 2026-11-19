import { Eye } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import Text from '@/components/ui/text';
import { RouteConfig } from '@/config/route-config';
import CustomizeHomeSheet from '@/features/home/components/customize-home-sheet';
import FirstSaleCard from '@/features/home/components/first-sale-card';
import HomeSections from '@/features/home/components/home-sections';
import PeriodMenu from '@/features/home/components/period-menu';
import QuickActions from '@/features/home/components/quick-actions';
import SetupChecklist from '@/features/home/components/setup-checklist';
import TemplateGallery from '@/features/home/components/template-gallery';
import { type HomeLayoutControls, useHomeLayout } from '@/features/home/hooks/use-home-layout';
import { getWelcomeName } from '@/features/home/lib/greeting';
import { isSetupComplete } from '@/features/home/lib/steps';
import { useSetupChecklistQuery } from '@/features/home/services/setup-checklist';
import useCurrentUser from '@/hooks/use-current-user';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

const getDashboardHeading = (name: string | null) => {
  if (!name) {
    return __('Welcome', 'kirki-ecommerce');
  }

  return sprintf(
    /* translators: %s: current user's first name or display name */
    __('Welcome, %s', 'kirki-ecommerce'),
    name,
  );
};

type DashboardHeadingProps = {
  name: string | null;
  layoutControls: HomeLayoutControls;
  isCustomizing: boolean;
  onCustomizingChange: (open: boolean) => void;
};

const DashboardHeading = (props: DashboardHeadingProps) => {
  const { name, layoutControls, isCustomizing, onCustomizingChange } = props;
  const { layout, setPeriod } = layoutControls;

  return (
    <PageHeading
      text={
        <Flex direction="column">
          <Text variant="heading4">{getDashboardHeading(name)}</Text>
          <PeriodMenu period={layout.period} onChange={setPeriod} />
        </Flex>
      }
      actions={
        <>
          <QuickActions actions={layout.actions} />
          <CustomizeHomeSheet
            layoutControls={layoutControls}
            open={isCustomizing}
            onOpenChange={onCustomizingChange}
          />
        </>
      }
    />
  );
};

DashboardHeading.displayName = 'DashboardHeading';

const ChecklistHeading = () => {
  return (
    <PageHeading
      text={__('Let’s get you started', 'kirki-ecommerce')}
      actions={
        <>
          <Button variant="ghost" asChild cssOverride={styles.liveSiteButton}>
            <a href={window.kirki_ecommerce.site_url} target="_blank" rel="noopener noreferrer">
              <Eye size={16} aria-hidden="true" />
              {__('View Live Site', 'kirki-ecommerce')}
            </a>
          </Button>
          <Button variant="primary" asChild>
            <Link to={RouteConfig.Products.get('CreateProduct').buildLink()}>
              {__('Add Product', 'kirki-ecommerce')}
            </Link>
          </Button>
        </>
      }
    />
  );
};

ChecklistHeading.displayName = 'ChecklistHeading';

const Home = () => {
  const { data: checklist } = useSetupChecklistQuery();
  const currentUser = useCurrentUser();
  const layoutControls = useHomeLayout();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const isDashboard = checklist
    ? isSetupComplete(checklist.steps)
    : window.kirki_ecommerce.is_setup_complete;

  return (
    <div css={scoped({ marginTop: theme.spacing[10] })}>
      <Page containerSize={isDashboard ? 'xxl' : 'sm'}>
        {isDashboard ? (
          <DashboardHeading
            name={getWelcomeName(currentUser)}
            layoutControls={layoutControls}
            isCustomizing={isCustomizing}
            onCustomizingChange={setIsCustomizing}
          />
        ) : (
          <ChecklistHeading />
        )}
        <PageContent cssOverride={{ marginTop: theme.spacing[3] }}>
          <Flex direction="column" gap={isDashboard ? 3 : 4}>
            <FirstSaleCard />
            {isDashboard ? (
              <HomeSections
                layoutControls={layoutControls}
                onCustomize={() => setIsCustomizing(true)}
              />
            ) : (
              <>
                <div data-home-card="">
                  <SetupChecklist />
                </div>
                <TemplateGallery />
              </>
            )}
          </Flex>
        </PageContent>
      </Page>
    </div>
  );
};

Home.displayName = 'Home';

export default Home;

const styles = defineStyles({
  liveSiteButton: {
    backgroundColor: theme.colors.background.surface,
  },
});
