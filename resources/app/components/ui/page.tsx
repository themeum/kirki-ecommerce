import { type CSSObject } from '@emotion/react';
import { ArrowLeft } from 'lucide-react';
import {
  type ComponentProps,
  createContext,
  type CSSProperties,
  forwardRef,
  type PropsWithChildren,
  type ReactNode,
  useContext,
} from 'react';
import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import {
  defineStyles,
  flexCenter,
  itemCenter,
  mergeCss,
  scoped,
  scopedMerge,
} from '@/theme/mixins';
import type { ContainerSize } from '@/types/components/common';

const PAGE_HEADING_HEIGHT = '64px';
const PAGE_HEADING_STICKY_TOP = '32px';
const PAGE_CONTENT_MARGIN_TOP = '32px';

type PageContainerSize = ContainerSize | 'none';

const PageContainerContext = createContext<PageContainerSize | undefined>(undefined);

const usePageContainerSize = (ownSize?: PageContainerSize) => {
  const inheritedSize = useContext(PageContainerContext);
  return ownSize ?? inheritedSize;
};

type PageProps = {
  minHeight?: string;
  containerSize?: PageContainerSize;
};

const Page = forwardRef<HTMLDivElement, PropsWithChildren<PageProps>>((props, ref) => {
  const { minHeight = '100%', containerSize = 'xl', children } = props;

  return (
    <PageContainerContext.Provider value={containerSize}>
      <div ref={ref} css={{ minHeight }}>
        {children}
      </div>
    </PageContainerContext.Provider>
  );
});

Page.displayName = 'Page';

type PageHeadingProps = {
  text?: ReactNode;
  hasBack?: boolean;
  backIcon?: ReactNode;
  containerSize?: PageContainerSize;
  children?: ReactNode;
  style?: CSSProperties;
  actions?: ReactNode;
  leftIcon?: ReactNode;
  buttonProps?: Partial<ComponentProps<typeof Button>>;
  cssOverride?: CSSObject;
  onBack?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

const PageHeading = forwardRef<HTMLDivElement, PageHeadingProps>((props, ref) => {
  const {
    cssOverride,
    text,
    hasBack = false,
    backIcon = null,
    containerSize,
    children,
    style = {},
    actions,
    leftIcon,
    buttonProps = {},
    onBack,
  } = props;

  const navigate = useNavigate();
  const resolvedSize = usePageContainerSize(containerSize);

  const {
    cssOverride: buttonCssOverride,
    children: buttonChildren,
    onClick,
    ...restButtonProps
  } = buttonProps;

  const BackIcon = backIcon || <ArrowLeft size={16} aria-hidden="true" />;

  return (
    <div ref={ref} css={scoped(styles.wrapper)}>
      <Container
        size={resolvedSize === 'none' ? undefined : resolvedSize}
        style={{ width: '100%' }}
      >
        <div
          css={scopedMerge(styles.heading, hasBack && styles.headingHasBack, cssOverride)}
          style={style}
        >
          {hasBack && (
            <Button
              variant="tertiary"
              size="icon"
              cssOverride={{
                ...buttonCssOverride,
                padding: theme.spacing[2],
                borderRadius: theme.radius.lg,
              }}
              onClick={(event) => {
                if (onBack) {
                  onBack(event);
                  return;
                }
                void navigate(-1);
              }}
              {...restButtonProps}
            >
              {BackIcon}
              {buttonChildren}
            </Button>
          )}
          {leftIcon && (
            <span css={scoped(styles.icon)} aria-hidden="true">
              {leftIcon}
            </span>
          )}
          {typeof text === 'string' ? <Text variant="heading5">{text}</Text> : text}
          {children}
          <Flex cssOverride={styles.actions} gap={2}>
            {actions}
          </Flex>
        </div>
      </Container>
    </div>
  );
});

PageHeading.displayName = 'PageHeading';

type PageContentProps = {
  containerSize?: PageContainerSize;
  children?: ReactNode;
  cssOverride?: CSSObject;
};

const PageContent = forwardRef<HTMLDivElement, PageContentProps>((props, ref) => {
  const { containerSize, children, cssOverride } = props;

  const resolvedSize = usePageContainerSize(containerSize);

  if (resolvedSize === 'none') {
    return (
      <div ref={ref} css={scopedMerge(styles.content, cssOverride && scoped(cssOverride))}>
        {children}
      </div>
    );
  }

  return (
    <Container ref={ref} size={resolvedSize} cssOverride={mergeCss(styles.content, cssOverride)}>
      {children}
    </Container>
  );
});

PageContent.displayName = 'PageContent';

export { Page, PAGE_HEADING_HEIGHT, PAGE_HEADING_STICKY_TOP, PageContent, PageHeading };

export type { PageContainerSize };

const styles = defineStyles({
  wrapper: {
    height: PAGE_HEADING_HEIGHT,
    boxSizing: 'border-box',
    top: PAGE_HEADING_STICKY_TOP,
    left: 0,
    padding: theme.spacing[0],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    borderBottom: `1px solid ${theme.colors.border.default}`,
    backgroundColor: theme.colors.background.solidSurfaceSecondary,
    zIndex: theme.zIndex.sticky,
  },
  content: {
    marginTop: PAGE_CONTENT_MARGIN_TOP,
  },
  heading: {
    width: '100%',
    ...itemCenter(),
    columnGap: theme.spacing[3],
    paddingLeft: theme.spacing[2],
  },
  headingHasBack: {
    paddingLeft: theme.spacing[0],
  },
  icon: {
    ...flexCenter(),
  },
  actions: {
    marginLeft: 'auto',
  },
});
