import Flex from '@/components/ui/flex';
import Image from '@/components/ui/image';
import Text from '@/components/ui/text';
import type { MediaRef } from '@/schemas/shared/media';

type CustomerProfileCardProps = {
  name: string;
  email?: string | null;
  phone?: string | null;
  photo?: MediaRef | null;
};

const CustomerProfileCard = ({ name, email, phone, photo }: CustomerProfileCardProps) => {
  return (
    <Flex gap={2} align="center">
      <Image shape="circle" src={photo} alt={name} />
      <Flex direction="column" gap={1}>
        <Text variant="small" weight="medium">{name}</Text>
        <Text variant="tiny" color="secondary">
          {email || phone || ''}
        </Text>
      </Flex>
    </Flex>
  );
};

CustomerProfileCard.displayName = 'CustomerProfileCard';

export default CustomerProfileCard;
