import { css } from '@emotion/react';
import { useLocation, useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import { CLASS_PREFIX } from '@/conf';
import { ArrowLeftIcon, BoxIcon } from '@/icons';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import Text from '@/components/ui/text';
import { __ } from '@/wpi18n';

import NotFoundIllustration from '@/pages/not-found/not-found-illustration/not-found-illustration';

const notFoundCss = css({
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 'calc(100vh - 32px - 41px)',
  marginTop: 0,
  padding: `${theme.spacing['4xl']} ${theme.spacing['6xl']}`,
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
    padding: theme.spacing['4xl'],
  },
});

const notFoundCopyCss = css({
  width: '100%',
  maxWidth: '420px',
  alignItems: 'flex-start',
  textAlign: 'left',
  '@media (max-width: 768px)': {
    alignItems: 'center',
    textAlign: 'center',
  },
});

const notFoundActionsCss = css({
  flexWrap: 'wrap',
  justifyContent: 'flex-start',
  width: '100%',
  paddingTop: theme.spacing.xs,
  '@media (max-width: 768px)': {
    justifyContent: 'center',
  },
});

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
    <div className={`${CLASS_PREFIX}-not-found`}>
      <Container size="fullWidth" css={notFoundCss}>
        <div className={`${CLASS_PREFIX}-not-found-inner`}>
          <div className={`${CLASS_PREFIX}-not-found-copy-col`}>
            <span
              className={`${CLASS_PREFIX}-not-found-code`}
              aria-hidden="true"
            >
              404
            </span>

            <Flex direction="column" gap={8} css={notFoundCopyCss}>
              <Text
                type="primary"
                header={__('Page not found', 'kirki-ecommerce')}
                subHeader={__(
                  'Sorry, the page you are looking for could not be found. It may have been moved or never existed.',
                  'kirki-ecommerce',
                )}
              />
            </Flex>

            {showPath && (
              <div className={`${CLASS_PREFIX}-not-found-path`}>
                <span className={`${CLASS_PREFIX}-not-found-path-label`}>
                  {__('Requested path', 'kirki-ecommerce')}
                </span>
                <code>{pathname}</code>
              </div>
            )}

            <Flex gap={12} css={notFoundActionsCss}>
              <Button variant="primary" onClick={handleGoToProducts}>
                <BoxIcon color="var(--decom-text-text-light)" />
                {__('Go to Products', 'kirki-ecommerce')}
              </Button>
              <Button variant="secondary" onClick={handleGoBack}>
                <ArrowLeftIcon />
                {__('Go back', 'kirki-ecommerce')}
              </Button>
            </Flex>
          </div>

          <div
            className={`${CLASS_PREFIX}-not-found-illustration-col`}
            aria-hidden="true"
          >
            <NotFoundIllustration />
          </div>
        </div>
      </Container>
    </div>
  );
};

NotFound.displayName = 'NotFound';

export default NotFound;
