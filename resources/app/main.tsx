import './styles/main.scss';
import { createRoot } from 'react-dom/client';

import App from '@/app';

const rootElement = document.getElementById('kirki-ecommerce-root');

if (rootElement) {
  createRoot(rootElement).render(<App />);

  const revealRoot = () => {
    rootElement.classList.add('kirki-ecommerce-root--ready');
  };

  if (document.fonts?.ready) {
    Promise.race([
      document.fonts.ready,
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
