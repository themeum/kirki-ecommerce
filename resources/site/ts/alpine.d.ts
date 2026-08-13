/**
 * Alpine.js type declarations for magic properties
 */

declare global {
  interface Window {
    Alpine: any;
  }
}

declare module 'alpinejs' {
  type Alpine = {
    data(name: string, callback: (...args: any[]) => any): Alpine;
    store(name: string, value?: any): any;
    start(): Alpine;
  };

  const Alpine: Alpine;
  export default Alpine;
}

// Add magic properties to any object that might be an Alpine component
declare global {
  interface Object {
    $dispatch?: (event: string, detail?: any) => CustomEvent;
    $store?: any;
  }
}
