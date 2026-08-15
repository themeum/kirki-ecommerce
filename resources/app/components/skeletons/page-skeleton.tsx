import PageHeadingSkeleton from '@/components/skeletons/page-heading-skeleton';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Page from '@/components/ui/page';
import Skeleton from '@/components/ui/skeleton';
import { cardStyles } from '@/theme/card-styles';

const CONTENT_ROW_COUNT = 6;
const CONTENT_ROW_HEIGHT = 12;
const ACTION_WIDTH = 72;
const ACTION_HEIGHT = 32;

const PageSkeleton = () => {
  return (
    <Page>
      <PageHeadingSkeleton>
        <Skeleton width={ACTION_WIDTH} height={ACTION_HEIGHT} />
      </PageHeadingSkeleton>
      <Container>
        <Card cssOverride={cardStyles.formCard}>
          <CardContent>
            <Flex direction="column" gap={4}>
              {Array.from({ length: CONTENT_ROW_COUNT }, (_, index) => (
                <Skeleton key={index} height={CONTENT_ROW_HEIGHT} />
              ))}
            </Flex>
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
};

PageSkeleton.displayName = 'PageSkeleton';

export default PageSkeleton;
