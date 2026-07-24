import { useLocation, useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { ArrowLeftIcon, BoxIcon } from '@/icons';
import NotFoundIllustration from '@/pages/not-found/not-found-illustration/not-found-illustration';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const NotFound = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDev = window.kirki_ecommerce?.is_dev === true;
  const showPath = isDev && pathname && pathname !== '/';

  const handleGoToProducts = () => {
    navigate('/products');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div data-not-found="true" css={styles.root}>
      <Container size="fullWidth">
        <div css={styles.inner}>
          <div css={styles.copyCol}>
            <span css={styles.code} aria-hidden="true">
              404
            </span>

            <Flex direction="column" gap={8} css={styles.copy}>
              <Flex direction="column" gap={8}>
                <Text weight="semibold" css={styles.copyText}>{__('Page not found', 'kirki-ecommerce')}</Text>
                <Text color="secondary">{__(
                  'Sorry, the page you are looking for could not be found. It may have been moved or never existed.',
                  'kirki-ecommerce',
                )}</Text>
              </Flex>
            </Flex>

            {showPath && (
              <div css={styles.path}>
                <span css={styles.pathLabel}>
                  {__('Requested path', 'kirki-ecommerce')}
                </span>
                <code css={styles.pathCode}>{pathname}</code>
              </div>
            )}

            <Flex gap={12} css={styles.actions}>
              <Button variant="primary" onClick={handleGoToProducts}>
                <BoxIcon color={theme.colors.text.light} />
                {__('Go to Products', 'kirki-ecommerce')}
              </Button>
              <Button variant="secondary" onClick={handleGoBack}>
                <ArrowLeftIcon />
                {__('Go back', 'kirki-ecommerce')}
              </Button>
            </Flex>
          </div>

          <div css={styles.illustrationCol} aria-hidden="true">
            <NotFoundIllustration />
          </div>
        </div>
      </Container>
    </div>
  );
};

NotFound.displayName = 'NotFound';

export default NotFound;

const styles = {
  root: scoped({
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 32px - 41px)',
    marginTop: 0,
    padding: `${theme.spacing[6]} ${theme.spacing[8]}`,
    backgroundColor: theme.colors.background.surfaceTertiary,
    boxSizing: 'border-box',
    overflow: 'hidden',
    '&::before, &::after': {
      content: '""',
      position: 'absolute',
      borderRadius: theme.radius.full,
      pointerEvents: 'none',
    },
    '&::before': {
      top: '-120px',
      right: '-80px',
      width: '320px',
      height: '320px',
      background: `radial-gradient(circle, ${theme.colors.background.fillSecondary} 0%, transparent 70%)`,
      opacity: 0.7,
    },
    '&::after': {
      bottom: '-100px',
      left: '-60px',
      width: '280px',
      height: '280px',
      background: `radial-gradient(circle, ${theme.colors.background.fillSecondaryHover} 0%, transparent 70%)`,
      opacity: 0.5,
    },
    '@media (max-width: 768px)': {
      padding: theme.spacing[6],
    },
  }),
  inner: scoped({
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[10],
    width: '100%',
    maxWidth: '960px',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: theme.spacing[8],
    },
  }),
  copyCol: scoped({
    display: 'flex',
    flex: '1 1 0',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing[6],
    minWidth: 0,
    '@media (max-width: 768px)': {
      alignItems: 'center',
      textAlign: 'center',
    },
  }),
  code: scoped({
    ...theme.typography.heading1(),
    color: theme.colors.text.subdued,
    opacity: 0.28,
    userSelect: 'none',
  }),
  copy: scoped({
    width: '100%',
    maxWidth: '420px',
    alignItems: 'flex-start',
    textAlign: 'left',
    '@media (max-width: 768px)': {
      alignItems: 'center',
      textAlign: 'center',
    },
  }),
  copyText: scoped({
    alignItems: 'flex-start',
    textAlign: 'left',
    '& > div span': {
      ...theme.typography.heading3(),
    },
    '& > span': {
      ...theme.typography.paragraph(),
    },
    '@media (max-width: 768px)': {
      alignItems: 'center',
      textAlign: 'center',
    },
  }),
  path: scoped({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing[2],
    width: '100%',
    maxWidth: '420px',
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
    backgroundColor: theme.colors.background.surfaceAlt,
    border: `1px solid ${theme.colors.border.tertiary}`,
    borderRadius: theme.radius.lg,
    boxSizing: 'border-box',
    textAlign: 'left',
  }),
  pathLabel: scoped({
    ...theme.typography.small('medium'),
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: theme.colors.text.subdued,
  }),
  pathCode: scoped({
    display: 'block',
    width: '100%',
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    ...theme.typography.small(),
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.fill,
    border: `1px solid ${theme.colors.border.secondary}`,
    borderRadius: theme.radius.md,
    wordBreak: 'break-all',
    boxSizing: 'border-box',
  }),
  actions: scoped({
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
    paddingTop: theme.spacing[1],
    '@media (max-width: 768px)': {
      justifyContent: 'center',
    },
  }),
  illustrationCol: scoped({
    display: 'flex',
    flex: '1 1 0',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 0,
    '@media (max-width: 768px)': {
      order: 2,
    },
  }),
};
