import { forwardRef, PropsWithChildren } from "react";

type PageProps = {
  minHeight?: string;
}

const Page = forwardRef<HTMLDivElement, PropsWithChildren<PageProps>>(
  (props, ref) => {
    const {
      minHeight = '100%',
      children
    } = props;

    return (
      <div ref={ref} css={{ minHeight }}>{children}</div>
    );
  },
);

export default Page;