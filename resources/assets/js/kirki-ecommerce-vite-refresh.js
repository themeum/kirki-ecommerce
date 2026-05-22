const refreshUrl = window.kirkiEcommerceViteRefresh.refreshUrl;

import(refreshUrl).then(({ default: RefreshRuntime }) => {
  RefreshRuntime.injectIntoGlobalHook(window);
  window.$RefreshReg$ = () => {};
  window.$RefreshSig$ = () => (type) => type;
  window.__vite_plugin_react_preamble_installed__ = true;
});
