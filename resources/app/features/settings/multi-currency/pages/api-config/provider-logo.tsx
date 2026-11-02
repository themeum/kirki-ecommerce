import Image from '@/components/ui/image';
import { FlagIcon } from '@/icons/common';
import { __ } from '@/wpi18n';

type ProviderLogoProps = {
  icon?: string | null;
};

const ProviderLogo = ({ icon }: ProviderLogoProps) => {
  if (!icon) {
    return <FlagIcon />;
  }

  return (
    <Image
      src={icon}
      width={20}
      height={20}
      fit="contain"
      alt={__('Provider icon', 'kirki-ecommerce')}
    />
  );
};

ProviderLogo.displayName = 'ProviderLogo';

export default ProviderLogo;
