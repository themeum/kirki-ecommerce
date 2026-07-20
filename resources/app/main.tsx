import './styles/main.scss';
import { createRoot } from 'react-dom/client';

import App from '@/app';

const INTER_FONT_LOADS = [
  '400 14px Inter',
  '500 14px Inter',
  '600 14px Inter',
  '700 14px Inter',
];

const wait_for_app_fonts = async (): Promise<void> => {
  if (!document.fonts) {
    return;
  }

  await document.fonts.ready;

  await Promise.all(
    INTER_FONT_LOADS.map((font) => {
      return document.fonts.load(font);
    }),
  );

  await document.fonts.ready;
};

const rootElement = document.getElementById('kirki-ecommerce-root');

if (rootElement) {
  createRoot(rootElement).render(<App />);

  const revealRoot = () => {
    rootElement.classList.add('kirki-ecommerce-root--ready');
  };

  if (document.fonts) {
    Promise.race([
      wait_for_app_fonts(),
      new Promise<void>((resolve) => {
        setTimeout(resolve, 3000);
      }),
    ])
      .then(revealRoot)
      .catch(revealRoot);
  } else {
    revealRoot();
  }
}
