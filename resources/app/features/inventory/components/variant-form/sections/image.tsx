import MediaField from '@/components/form/media-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const Image = () => {
  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle>{__('Image', 'kirki-ecommerce')}</CardTitle>
      </CardHeader>
      <CardContent>
        <MediaField name="media" size="fullWidth" />
      </CardContent>
    </Card>
  );
};

Image.displayName = 'Image';

export default Image;
