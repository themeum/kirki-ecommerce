import { useLocation, useNavigate } from 'react-router';

import { CLASS_PREFIX } from '@/conf';
import { ArrowLeftIcon, BoxIcon } from '@/icons';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import { __ } from '@/wpi18n';

const NotFound = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleGoToProducts = () => {
    navigate('/products');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Container size="fullWidth" className={`${CLASS_PREFIX}-not-found`}>
      <Card type="large" className={`${CLASS_PREFIX}-not-found-card`}>
        <Flex
          direction="column"
          gap={32}
          className={`${CLASS_PREFIX}-not-found-content`}
        >
          <div
            className={`${CLASS_PREFIX}-not-found-visual`}
            aria-hidden="true"
          >
            <span className={`${CLASS_PREFIX}-not-found-badge`}>404</span>
            <div className={`${CLASS_PREFIX}-not-found-icon`}>
              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="12"
                  y="8"
                  width="24"
                  height="32"
                  rx="3"
                  fill="var(--decom-background-bg-fill)"
                  stroke="var(--decom-border-border-secondary)"
                  strokeWidth="1.5"
                />
                <path
                  d="M18 18H30M18 24H26M18 30H28"
                  stroke="var(--decom-border-border)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle
                  cx="34"
                  cy="34"
                  r="9"
                  fill="var(--decom-background-bg-fill-brand)"
                  fillOpacity="0.12"
                  stroke="var(--decom-background-bg-fill-brand)"
                  strokeWidth="1.5"
                />
                <path
                  d="M31.5 34L34 36.5L36.5 31.5"
                  stroke="var(--decom-background-bg-fill-brand)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <Flex
            direction="column"
            gap={8}
            className={`${CLASS_PREFIX}-not-found-copy`}
          >
            <Text
              type="primary"
              header={__('Page not found', 'kirki-ecommerce')}
              subHeader={__(
                'The page you are looking for does not exist or has not been built yet.',
                'kirki-ecommerce',
              )}
            />
          </Flex>

          {pathname && pathname !== '/' && (
            <div className={`${CLASS_PREFIX}-not-found-path`}>
              <span className={`${CLASS_PREFIX}-not-found-path-label`}>
                {__('Requested path', 'kirki-ecommerce')}
              </span>
              <code>{pathname}</code>
            </div>
          )}

          <Flex
            gap={12}
            className={`${CLASS_PREFIX}-not-found-actions`}
          >
            <Button
              type="primary"
              text={__('Go to Products', 'kirki-ecommerce')}
              leftIcon={<BoxIcon color="var(--decom-text-text-light)" />}
              onClick={handleGoToProducts}
            />
            <Button
              type="secondary"
              text={__('Go back', 'kirki-ecommerce')}
              leftIcon={<ArrowLeftIcon />}
              onClick={handleGoBack}
            />
          </Flex>
        </Flex>
      </Card>
    </Container>
  );
};

NotFound.displayName = 'NotFound';

export default NotFound;
