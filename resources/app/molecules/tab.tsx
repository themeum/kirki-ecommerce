import type { ReactNode, CSSProperties } from 'react';
import React, { useState } from 'react';

import Grid from '@/molecules/grid';
import { CLASS_PREFIX } from '@/conf';

type TabProps = {
  activeIndex?: number;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
  onChange?: (index: number) => void;
};

const Tab = ({
  activeIndex,
  children,
  style = {},
  className = '',
  onChange = () => {},
}: TabProps) => {
  const [activeTabIndex, setActiveTabIndex] = useState(activeIndex || 0);
  const handleActiveTabChange = (index: number) => {
    setActiveTabIndex(index);
    onChange(index);
  };

  return (
    <Grid
      columns={React.Children.count(children)}
      gap="0"
      className={`${CLASS_PREFIX}-tab ${className}`}
      style={style}
    >
      {React.Children.map(children, (child, index) => (
        <div
          className={`${CLASS_PREFIX}-tab-item ${
            index === activeTabIndex ? `${CLASS_PREFIX}-active-tab` : ''
          }`}
          onClick={() => handleActiveTabChange(index)}
        >
          {child}
        </div>
      ))}
    </Grid>
  );
};

export default Tab;
