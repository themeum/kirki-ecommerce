import type { PropsWithChildren } from 'react';
import { forwardRef } from 'react';

type PageProps = {
  minHeight?: string;
}

const Page = forwardRef<HTMLDivElement, PropsWithChildren<PageProps>>(
  (props, ref) => {
    const {
      minHeight = '100%',
      children,
    } = props;

    return (
      <div ref={ref} css={{ minHeight }}>{children}</div>
    );
  },
);

Page.displayName = 'Page';

export default Page;