import Button from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const CardPreview = () => {
  return (
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
  );
};

CardPreview.displayName = 'CardPreview';

export default CardPreview;
