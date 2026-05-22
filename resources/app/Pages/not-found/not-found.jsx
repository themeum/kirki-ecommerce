import { CLASS_PREFIX } from "@/conf";
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import { __ } from "@/wpi18n";
import { useLocation, useNavigate } from "react-router";

const NotFound = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleGoToProducts = () => {
    navigate("/products");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Container size="fullWidth" className={`${CLASS_PREFIX}-not-found`}>
      <Card
        type="large"
        className={`${CLASS_PREFIX}-not-found-card`}
      >
        <Flex
          direction="column"
          gap={24}
          className={`${CLASS_PREFIX}-not-found-content`}
          style={{ alignItems: "center", textAlign: "center" }}
        >
          <div
            className={`${CLASS_PREFIX}-not-found-illustration`}
            aria-hidden="true"
          >
            <span className={`${CLASS_PREFIX}-not-found-code`}>404</span>
            <svg
              className={`${CLASS_PREFIX}-not-found-graphic`}
              viewBox="0 0 200 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="100" cy="60" r="48" fill="var(--decom-color-brand-5)" />
              <path
                d="M72 58C72 48.0589 80.0589 40 90 40H110C119.941 40 128 48.0589 128 58V62C128 71.9411 119.941 80 110 80H90C80.0589 80 72 71.9411 72 62V58Z"
                fill="var(--decom-background-bg-fill-brand)"
                fillOpacity="0.15"
              />
              <circle cx="88" cy="58" r="4" fill="var(--decom-icon-brand)" />
              <circle cx="112" cy="58" r="4" fill="var(--decom-icon-brand)" />
              <path
                d="M92 70C94.5 73 105.5 73 108 70"
                stroke="var(--decom-icon-brand)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M56 44L48 36M144 44L152 36M56 76L48 84M144 76L152 84"
                stroke="var(--decom-border-border-secondary)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <Flex direction="column" gap={8} style={{ maxWidth: 480 }}>
            <Text
              type="primary"
              header={__("Page not found", "kirki-ecommerce")}
              subHeader={__(
                "The page you are looking for does not exist or has not been built yet.",
                "kirki-ecommerce",
              )}
            />
            {pathname && pathname !== "/" && (
              <p className={`${CLASS_PREFIX}-not-found-path`}>
                <span className={`${CLASS_PREFIX}-not-found-path-label`}>
                  {__("Requested path:", "kirki-ecommerce")}
                </span>
                <code>{pathname}</code>
              </p>
            )}
          </Flex>

          <Flex gap={12} style={{ flexWrap: "wrap", justifyContent: "center" }}>
            <Button
              type="primary"
              text={__("Go to Products", "kirki-ecommerce")}
              onClick={handleGoToProducts}
            />
            <Button
              type="secondary"
              text={__("Go back", "kirki-ecommerce")}
              onClick={handleGoBack}
            />
          </Flex>
        </Flex>
      </Card>
    </Container>
  );
};

export default NotFound;
