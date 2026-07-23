import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CLASS_PREFIX } from '@/conf';
import { DropdownSubmenuIcon } from '@/icons';
import Flex from '@/components/ui/flex';
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
    <>
      <Card
        type="default"
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
          <span className={`${CLASS_PREFIX}-settings-card-button`}>
            <Button
              variant="ghost"
              size="icon"
              style={{
                backgroundColor: 'var(--decom-background-bg-fill-secondary)',
              }}
              onClick={handleClick}
            >
              <DropdownSubmenuIcon />
            </Button>
          </span>
        </Flex>
      </Card>
    </>
  );
};
