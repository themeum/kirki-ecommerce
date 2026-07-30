import Button from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { cardStyles } from '@/theme/card-styles';

const CardPreview = () => {
  return (
    <Flex direction="column" gap={4}>
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>
            This is a short description of the card content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          Card body content goes here. Use this area for primary information.
        </CardContent>
        <CardFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="primary">Save</Button>
        </CardFooter>
      </Card>

      <Card cssOverride={cardStyles.formCard}>
        <CardContent>Form card variant</CardContent>
      </Card>

      <Card cssOverride={cardStyles.innerCard}>
        <CardContent cssOverride={cardStyles.innerContent}>Inner card variant</CardContent>
      </Card>

      <Card cssOverride={cardStyles.darkCard}>
        <CardContent>Dark card variant</CardContent>
      </Card>

      <Card cssOverride={cardStyles.lightCard}>
        <CardContent>Light card variant</CardContent>
      </Card>

      <Card cssOverride={cardStyles.tableCard}>
        <CardContent cssOverride={cardStyles.tableContent}>Table card variant</CardContent>
      </Card>

      <Card cssOverride={cardStyles.shadowCard}>
        <CardContent>Shadow card variant</CardContent>
      </Card>

      <Card cssOverride={cardStyles.largeCard}>
        <CardContent cssOverride={cardStyles.largeContentPadded}>Large card variant</CardContent>
      </Card>
    </Flex>
  );
};

CardPreview.displayName = 'CardPreview';

export default CardPreview;

