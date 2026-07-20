import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CLASS_PREFIX } from '@/conf';
import { DropdownSubmenuIcon } from '@/icons';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';

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
    <>
      <Card
        className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-default`}
        style={{
          padding: 'var(--decom-spacing-2) var(--decom-spacing-3)',
          cursor: 'pointer',
        }}
        onClick={handleClick}
      >
        <Flex gap={8} style={{ position: 'relative' }}>
          <div className={`${CLASS_PREFIX}-settings-card-identifier`}></div>
          <span style={{ marginTop: 'var(--decom-spacing-1)' }}>{icon}</span>
          <Text
            header={header}
            subHeader={subHeader}
            type="secondary"
            style={{ gap: 0 }}
          />
        </Flex>
        <Flex>
          <Button
            variant="ghost"
            size="icon"
            className={`${CLASS_PREFIX}-settings-card-button`}
            style={{
              backgroundColor: 'var(--decom-background-bg-fill-secondary)',
            }}
            onClick={handleClick}
          >
            <DropdownSubmenuIcon />
          </Button>
        </Flex>
      </Card>
    </>
  );
};
