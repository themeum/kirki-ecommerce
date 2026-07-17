const PORTAL_ROOT_ID = 'kirki-ecommerce-root';

const getPortalContainer = (): HTMLElement => {
  return document.getElementById(PORTAL_ROOT_ID) ?? document.body;
};

export { getPortalContainer, PORTAL_ROOT_ID };
