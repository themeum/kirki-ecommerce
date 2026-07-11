import type { ReactNode } from 'react';

import GroupOptionCard from '@/components/group-option-card';
import { TruckIcon } from '@/icons';

type GroupOptionPreviewItem = {
  name: string;
  subText: string;
  icon: ReactNode;
  rightText: string;
};

const data: GroupOptionPreviewItem[] = [
  {
    name: 'Standard Delivery',
    subText: '2-3days',
    icon: <TruckIcon />,
    rightText: '$10',
  },
  {
    name: 'Rate by Weight',
    subText: '2-3days',
    icon: <TruckIcon />,
    rightText: '$10',
  },
  {
    name: 'Free Shipping',
    subText: '2-3days',
    icon: <TruckIcon />,
    rightText: '$10',
  },
];

const GroupOptionCardPreview = () => {
  return (
    <div>
      <GroupOptionCard
        dataArr={data}
        handleToggleItem={(item) => {
          console.log(item);
        }}
        handleDeleteItem={(item) => {
          console.log(item);
        }}
        handleEditItem={(item) => {
          console.log(item);
        }}
      />
    </div>
  );
};

GroupOptionCardPreview.displayName = 'GroupOptionCardPreview';

export default GroupOptionCardPreview;
