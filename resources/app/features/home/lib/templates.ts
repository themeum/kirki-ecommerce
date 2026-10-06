import { __, sprintf } from '@/wpi18n';

type StoreTemplate = {
  name: string;
  author: string;
  image: string | null;
  url: string;
};

// @todo: Replace the placeholder images and links with the real template catalog.
const templateImage = (fileName: string) =>
  `${window.kirki_ecommerce.assets_url}/images/templates/${fileName}`;

const getStoreTemplates = (): StoreTemplate[] => {
  const author = sprintf(__('By %s', 'kirki-ecommerce'), 'Kirki');

  return [
    { name: 'Dogolala', author, image: templateImage('dogolala.webp'), url: '#' },
    { name: 'Beauty Pie', author, image: templateImage('beauty-pie.webp'), url: '#' },
    { name: 'Kiddon', author, image: templateImage('kiddon.webp'), url: '#' },
  ];
};

export { getStoreTemplates };
