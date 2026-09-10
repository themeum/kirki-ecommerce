import { ChevronLeft } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router';

import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';

type SettingsBreadcrumb = {
  label: string;
  to: string;
};

type SettingsPageHeaderProps = {
  icon?: ReactNode;
  title?: string;
  breadcrumbs?: SettingsBreadcrumb[];
  actions?: ReactNode;
};

const SettingsPageHeader = (props: SettingsPageHeaderProps) => {
  const { icon, title, breadcrumbs = [], actions } = props;
  const hasBreadcrumbs = breadcrumbs.length > 0;

  return (
    <Flex align="center" justify="flex-start" gap={2} cssOverride={styles.wrapper}>
      <Flex gap={2} align="center">
        {icon}
        {breadcrumbs.map((crumb) => (
          <Fragment key={crumb.to}>
            <ChevronLeft css={scoped(styles.separator)} aria-hidden="true" />
            <Link to={crumb.to} css={scoped(styles.crumb)}>
              {crumb.label}
            </Link>
          </Fragment>
        ))}
        {hasBreadcrumbs && <ChevronLeft css={scoped(styles.separator)} aria-hidden="true" />}
        <Text
          variant="heading6"
          weight="semibold"
          aria-current={hasBreadcrumbs ? 'page' : undefined}
        >
          {title}
        </Text>
      </Flex>
      {actions && <ActionGroup>{actions}</ActionGroup>}
    </Flex>
  );
};

SettingsPageHeader.displayName = 'SettingsPageHeader';

export default SettingsPageHeader;
export type { SettingsBreadcrumb };

const styles = defineStyles({
  wrapper: {
    width: '100%',
  },
  separator: {
    width: 16,
    height: 16,
    flexShrink: 0,
    color: theme.colors.text.subdued,
  },
  crumb: {
    ...theme.typography.heading6('medium'),
    color: theme.colors.text.secondary,
    textDecoration: 'none',
    '&:hover': {
      color: theme.colors.text.primary,
      textDecoration: 'underline',
    },
  },
  backButton: {
    height: '36px',
    width: '36px',
    background: theme.colors.background.surface,
    transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
    '&:hover': {
      'svg path': {
        stroke: theme.colors.background.fillBrand,
        strokeWidth: 1.5,
      },
    },
  },
  connector: {
    height: '19px',
    width: '8.5px',
    background: theme.colors.background.surface,
    clipPath: "path('M0,0 Q4.25,6 8.5,0 L8.5,19 Q4.25,13 0,19 Z')",
  },
});
