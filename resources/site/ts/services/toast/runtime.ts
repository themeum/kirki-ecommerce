import {
  type ToastConfig,
  type ToastOptions,
  type ToastType,
} from '../../types';

interface ToastEntry {
  id: string;
  element: HTMLElement;
  timerId: ReturnType<typeof setTimeout> | null;
}

export interface ToastApi {
  (message: string, options?: ToastOptions): string;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  dismiss: (id?: string) => void;
  clear: () => void;
}

const DEFAULT_CONFIG: ToastConfig = {
  position: 'bottom-right',
  duration: 5000,
  closeButton: true,
};

const TOAST_CLASS = {
  container: 'kecom-toast-container',
  item: 'kecom-toast-item',
  card: 'kecom-toast-card',
  icon: 'kecom-toast-icon',
  content: 'kecom-toast-content',
  title: 'kecom-toast-title',
  description: 'kecom-toast-description',
  closeButton: 'kecom-toast-close',
} as const;

const DEFAULT_LABELS: Record<ToastType, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
  default: 'Notification',
};

const TOAST_ICON_MARKUP: Record<ToastType, string> = {
  success:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  error:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  warning:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><path d="M12 11v6"/></svg>',
  default:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><path d="M12 11v6"/></svg>',
};

export class ToastManager {
  private config: ToastConfig = { ...DEFAULT_CONFIG };
  private readonly entries = new Map<string, ToastEntry>();
  private idCounter = 0;
  private container: HTMLDivElement | null = null;

  private ensureContainer(): void {
    if (this.container) {
      return;
    }

    this.container = document.createElement('div');
    this.container.className = TOAST_CLASS.container;
    
    const position = this.config.position || 'bottom-right';
    this.container.style.position = 'fixed';
    this.container.style.zIndex = '9999';
    
    if (position.includes('top')) {
      this.container.style.top = '16px';
    } else {
      this.container.style.bottom = '16px';
    }
    
    if (position.includes('left')) {
      this.container.style.left = '16px';
    } else if (position.includes('right')) {
      this.container.style.right = '16px';
    } else {
      this.container.style.left = '50%';
      this.container.style.transform = 'translateX(-50%)';
    }
    
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.gap = '8px';
    
    document.body.appendChild(this.container);
  }

  private buildCard(id: string, message: string, type: ToastType): HTMLElement {
    const item = document.createElement('div');
    item.className = TOAST_CLASS.item;
    
    const card = document.createElement('div');
    card.className = TOAST_CLASS.card;
    card.setAttribute('data-type', type);
    
    const icon = document.createElement('div');
    icon.className = TOAST_CLASS.icon;
    icon.innerHTML = TOAST_ICON_MARKUP[type] || TOAST_ICON_MARKUP.default;
    card.appendChild(icon);
    
    const content = document.createElement('div');
    content.className = TOAST_CLASS.content;
    
    const title = document.createElement('div');
    title.className = TOAST_CLASS.title;
    title.textContent = DEFAULT_LABELS[type] || DEFAULT_LABELS.default;
    content.appendChild(title);
    
    const description = document.createElement('div');
    description.className = TOAST_CLASS.description;
    description.textContent = message;
    content.appendChild(description);
    
    card.appendChild(content);
    
    if (this.config.closeButton) {
      const closeButton = document.createElement('button');
      closeButton.className = TOAST_CLASS.closeButton;
      closeButton.innerHTML = '&times;';
      closeButton.addEventListener('click', () => this.dismiss(id));
      card.appendChild(closeButton);
    }
    
    item.appendChild(card);
    return item;
  }

  public dismiss(id?: string): void {
    if (id) {
      const entry = this.entries.get(id);
      if (entry) {
        if (entry.timerId) {
          clearTimeout(entry.timerId);
        }
        entry.element.style.opacity = '0';
        entry.element.style.transform = 'translateX(100px)';
        setTimeout(() => {
          entry.element.remove();
          this.entries.delete(id);
        }, 300);
      }
    } else {
      this.entries.forEach((entry, entryId) => {
        if (entry.timerId) {
          clearTimeout(entry.timerId);
        }
        entry.element.style.opacity = '0';
        entry.element.style.transform = 'translateX(100px)';
        setTimeout(() => {
          entry.element.remove();
        }, 300);
      });
      this.entries.clear();
    }
  }

  public clear(): void {
    this.dismiss();
  }

  public show(message: string, options: ToastOptions = {}): string {
    this.ensureContainer();
    
    const id = String(++this.idCounter);
    const type = options.type || 'info';
    const duration = options.duration ?? this.config.duration ?? 5000;
    
    const item = this.buildCard(id, message, type);
    
    item.style.opacity = '0';
    item.style.transform = 'translateX(100px)';
    item.style.transition = 'all 300ms ease';
    
    if (this.container?.firstChild) {
      this.container.insertBefore(item, this.container.firstChild);
    } else {
      this.container?.appendChild(item);
    }
    
    requestAnimationFrame(() => {
      item.style.opacity = '1';
      item.style.transform = 'translateX(0)';
    });
    
    let timerId: ReturnType<typeof setTimeout> | null = null;
    if (duration > 0) {
      timerId = setTimeout(() => this.dismiss(id), duration);
    }
    
    this.entries.set(id, { id, element: item, timerId });
    
    return id;
  }

  public success(message: string, duration?: number): string {
    return this.show(message, { type: 'success', duration });
  }

  public error(message: string, duration?: number): string {
    return this.show(message, { type: 'error', duration });
  }

  public warning(message: string, duration?: number): string {
    return this.show(message, { type: 'warning', duration });
  }

  public info(message: string, duration?: number): string {
    return this.show(message, { type: 'info', duration });
  }

  public configure(options: ToastConfig): void {
    this.config = { ...this.config, ...options };
  }
}

export function createToastApi(manager: ToastManager): ToastApi {
  const api = ((message: string, options?: ToastOptions) => manager.show(message, options)) as ToastApi;
  
  api.success = (message, duration) => manager.success(message, duration);
  api.error = (message, duration) => manager.error(message, duration);
  api.warning = (message, duration) => manager.warning(message, duration);
  api.info = (message, duration) => manager.info(message, duration);
  api.dismiss = (id) => manager.dismiss(id);
  api.clear = () => manager.clear();
  
  return api;
}

const manager = new ToastManager();

export const toastManager = manager;

export const toast = createToastApi(manager);
