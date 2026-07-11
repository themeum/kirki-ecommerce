import type { ReactNode, CSSProperties } from 'react';
import classNames from 'classnames';
import { useNavigate } from 'react-router';

import { CLASS_PREFIX } from '@/conf';
import type { CardType } from '@/types';

type CardVariantType = CardType | 'large' | 'tartiary' | 'navbar';

type CardProps = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  type?: CardVariantType;
  link?: string | false;
};

const Card = ({
  children,
  className = '',
  style = {},
  type = 'default',
  link = false,
}: CardProps) => {
  const navigate = useNavigate();

  const cardVariants = {
    type: {
      default: `${CLASS_PREFIX}-card-default`,
      table: `${CLASS_PREFIX}-card-table`,
      form: `${CLASS_PREFIX}-card-form`,
      inner: `${CLASS_PREFIX}-card-inner`,
      dark: `${CLASS_PREFIX}-card-dark`,
      innerDark: `${CLASS_PREFIX}-card-inner-dark`,
      light: `${CLASS_PREFIX}-card-light`,
      shadow: `${CLASS_PREFIX}-card-shadow`,
      large: `${CLASS_PREFIX}-card-large`,
      tartiary: `${CLASS_PREFIX}-card-tartiary`,
      navbar: `${CLASS_PREFIX}-card-navbar`,
    },
    default: `${CLASS_PREFIX}-card`,
  };

  const allClassNames = classNames(
    cardVariants.default,
    cardVariants.type[type],
    className,
  );

  const handleOnClick = () => {
    if (link) {
      navigate(link);
    }
  };
  return (
    <div
      className={allClassNames}
      style={{ ...style, cursor: link ? 'pointer' : undefined }}
      onClick={handleOnClick}
    >
      {children}
    </div>
  );
};

export default Card;
