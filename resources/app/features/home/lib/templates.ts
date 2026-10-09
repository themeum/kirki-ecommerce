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
    { name: 'Oblack', author, image: templateImage('oblack.webp'), url: '#' },
    { name: 'Esencia', author, image: templateImage('esencia.webp'), url: '#' },
    { name: 'Noiread', author, image: templateImage('noiread.webp'), url: '#' },
  ];
};

export { getStoreTemplates };
