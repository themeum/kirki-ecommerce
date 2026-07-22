import Button from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Flex from '@/components/ui/flex';

const CardPreview = () => {
  return (
    <Flex direction="column" gap={16}>
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
      <Card type="form">Form card variant</Card>
      <Card type="inner">Inner card variant</Card>
      <Card type="dark">Dark card variant</Card>
      <Card type="light">Light card variant</Card>
    </Flex>
  );
};

CardPreview.displayName = 'CardPreview';

export default CardPreview;
