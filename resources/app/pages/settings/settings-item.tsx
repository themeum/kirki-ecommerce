import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownSubmenuIcon } from '@/icons';
import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import Text from '@/components/ui/text';

type SettingsItemProps = {
  link: string;
  header: string;
  subHeader: string;
  icon: ReactNode;
};

export const SettingsItem = (props: SettingsItemProps) => {
  const { link, header, subHeader, icon } = props;
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(link);
  };

  return (
    <Card type="default" css={styles.card} onClick={handleClick}>
      <Flex gap={8} css={styles.content}>
        <div css={styles.identifier} data-settings-identifier />
        <span css={styles.iconWrap}>{icon}</span>
        <Text
          header={<span data-settings-heading>{header}</span>}
          subHeader={subHeader}
          type="secondary"
          style={{ gap: 0 }}
        />
      </Flex>
      <Flex>
        <span css={styles.buttonWrap} data-settings-button>
          <Button
            variant="ghost"
            size="icon"
            css={styles.actionButton}
            onClick={handleClick}
          >
            <DropdownSubmenuIcon />
          </Button>
        </span>
      </Flex>
    </Card>
  );
};

const styles = {
  card: scoped({
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    cursor: 'pointer',
  }),
  content: scoped({
    position: 'relative',
  }),
  identifier: scoped({
    background: theme.colors.background.fillBrand,
    height: '40px',
    width: '4px',
    position: 'absolute',
    top: '2px',
    left: '-12px',
    borderRadius: theme.radius.xl,
    opacity: 0,
    visibility: 'hidden',
    transition: 'all 0.3s ease',
  }),
  iconWrap: scoped({
    marginTop: theme.spacing.xs,
  }),
  buttonWrap: scoped({
    opacity: 0,
    visibility: 'hidden',
    transition: 'all 0.3s ease',
  }),
  actionButton: scoped({
    backgroundColor: theme.colors.background.fillSecondary,
  }),
};
