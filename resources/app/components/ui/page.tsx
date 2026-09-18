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
  useEffect,
  useState,
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
const PAGE_HEADING_SHADOW_HEIGHT = '6px';
const PAGE_HEADING_SHADOW_MASK =
  'linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.6) 15%, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0.6) 85%, rgba(0, 0, 0, 0) 100%)';

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
  const { minHeight = '100%', containerSize = 'fluid', children } = props;

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
  sticky?: boolean;
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
    sticky = false,
  } = props;

  const navigate = useNavigate();
  const resolvedSize = usePageContainerSize(containerSize);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!sticky) {
      setIsScrolled(false);
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sticky]);

  const {
    cssOverride: buttonCssOverride,
    children: buttonChildren,
    onClick,
    ...restButtonProps
  } = buttonProps;

  const BackIcon = backIcon || <ArrowLeft size={16} aria-hidden="true" />;

  return (
    <div
      ref={ref}
      css={scopedMerge(
        styles.wrapper,
        sticky && styles.sticky,
        sticky && isScrolled && styles.stickyScrolled,
      )}
    >
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
      <div ref={ref} css={scopedMerge(styles.content, cssOverride)}>
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
    backgroundColor: theme.colors.background.solidSurfaceSecondary,
    zIndex: theme.zIndex.sticky,
  },
  content: {
    // marginTop: PAGE_CONTENT_MARGIN_TOP,
  },
  sticky: {
    position: 'sticky',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      height: PAGE_HEADING_SHADOW_HEIGHT,
      pointerEvents: 'none',
      opacity: 0,
      transition: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      background: 'linear-gradient(to bottom, hsla(0, 0%, 0%, 0.25), hsla(0, 0%, 0%, 0))',
      WebkitMaskImage: PAGE_HEADING_SHADOW_MASK,
      maskImage: PAGE_HEADING_SHADOW_MASK,
    },
  },
  stickyScrolled: {
    '&::after': {
      opacity: 1,
    },
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
