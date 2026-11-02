import { Eye } from 'lucide-react';
import { Link } from 'react-router';

import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import { RouteConfig } from '@/config/route-config';
import DashboardOverview from '@/features/home/components/dashboard-overview';
import SetupChecklist from '@/features/home/components/setup-checklist';
import TemplateGallery from '@/features/home/components/template-gallery';
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

const Home = () => {
  const { data: checklist } = useSetupChecklistQuery();
  const currentUser = useCurrentUser();
  const isDashboard = checklist
    ? isSetupComplete(checklist.steps)
    : window.kirki_ecommerce.is_setup_complete;

  return (
    <div css={scoped({ marginTop: theme.spacing[10] })}>
      <Page containerSize={isDashboard ? 'xl' : 'sm'}>
        <PageHeading
          text={
            isDashboard
              ? getDashboardHeading(getWelcomeName(currentUser))
              : __('Let’s get you started', 'kirki-ecommerce')
          }
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
        <PageContent>
          {isDashboard ? (
            <DashboardOverview />
          ) : (
            <Flex direction="column" gap={4}>
              <SetupChecklist />
              <TemplateGallery />
            </Flex>
          )}
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
