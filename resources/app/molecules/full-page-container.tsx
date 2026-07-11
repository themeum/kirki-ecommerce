import type { ReactNode, CSSProperties } from 'react';
import classNames from 'classnames';

import Container from '@/molecules/container';
import { CLASS_PREFIX } from '@/conf';

type FullPageContainerProps = {
  scrollable?: boolean;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
};

const FullPageContainer = ({
  scrollable = false,
  style = {},
  className = '',
  children,
}: FullPageContainerProps) => {
  const allClassNames = classNames(
    `${CLASS_PREFIX}-full-page-container`,
    scrollable && `${CLASS_PREFIX}-scroll-container`,
    className,
  );
  return (
    <Container style={style} className={allClassNames}>
      {children}
    </Container>
  );
};

export default FullPageContainer;
