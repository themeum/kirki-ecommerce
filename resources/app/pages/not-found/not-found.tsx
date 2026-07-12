import { useLocation, useNavigate } from 'react-router';

import { CLASS_PREFIX } from '@/conf';
import { ArrowLeftIcon, BoxIcon } from '@/icons';
import Button from '@/molecules/button';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import { __ } from '@/wpi18n';

import NotFoundIllustration from '@/pages/not-found/not-found-illustration/not-found-illustration';

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
    <Container size="fullWidth" className={`${CLASS_PREFIX}-not-found`}>
      <div className={`${CLASS_PREFIX}-not-found-inner`}>
        <div className={`${CLASS_PREFIX}-not-found-copy-col`}>
          <span
            className={`${CLASS_PREFIX}-not-found-code`}
            aria-hidden="true"
          >
            404
          </span>

          <Flex
            direction="column"
            gap={8}
            className={`${CLASS_PREFIX}-not-found-copy`}
          >
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
        </div>

        <div
          className={`${CLASS_PREFIX}-not-found-illustration-col`}
          aria-hidden="true"
        >
          <NotFoundIllustration />
        </div>
      </div>
    </Container>
  );
};

NotFound.displayName = 'NotFound';

export default NotFound;
