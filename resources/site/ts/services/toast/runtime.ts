import { type ToastConfig, type ToastOptions, type ToastType } from '../../types';

type ToastEntry = {
  id: string;
  element: HTMLElement;
  timerId: ReturnType<typeof setTimeout> | null;
  height: number;
  exiting: boolean;
  swiping: boolean;
};

const DEFAULT_STACK_DEPTH = {
  gap: 10,
  peek: 120,
  scaleStep: 0.034,
  scaleFloor: 0.883,
  opacity1: 0.78,
  opacity2: 0.52,
  opacity3: 0,
} as const;

const TOAST_ATTR = {
  ariaLive: 'aria-live',
  ariaAtomic: 'aria-atomic',
  ariaLabel: 'aria-label',
  ariaLabelledBy: 'aria-labelledby',
  dataPositionX: 'data-position-x',
  dataPositionY: 'data-position-y',
  dataRichColors: 'data-rich-colors',
  dataType: 'data-type',
  dataFront: 'data-front',
  dataExpanded: 'data-expanded',
  dataEntering: 'data-entering',
  dataExiting: 'data-exiting',
  dataSwiping: 'data-swiping',
  dataSwipeOut: 'data-swipe-out',

  dir: 'dir',
  role: 'role',
  tabIndex: 'tabindex',
} as const;

const TOAST_ATTR_VALUE = {
  polite: 'polite',
  assertive: 'assertive',
  region: 'region',
  list: 'list',
  listItem: 'listitem',
  alert: 'alert',
  status: 'status',
  true: 'true',
  frontZIndex: '10',
} as const;

export type ToastApi = {
  (message: string, options?: ToastOptions): string;
  success: (message: string, duration?: number, options?: ToastOptions) => string;
  error: (message: string, duration?: number, options?: ToastOptions) => string;
  warning: (message: string, duration?: number, options?: ToastOptions) => string;
  info: (message: string, duration?: number, options?: ToastOptions) => string;
  dismiss: (id?: string) => void;
  clear: () => void;
  configure: (options: ToastConfig) => void;
};

const DEFAULT_CONFIG: ToastConfig = {
  position: 'bottom-right',
  duration: 5000,
  closeButton: true,
};

const TOAST_CSS_VAR = {
  frontHeight: '--kecom-toast-front-height',
  y: '--kecom-toast-y',
  scale: '--kecom-toast-scale',
  opacity: '--kecom-toast-opacity',
} as const;

const TOAST_CLASS = {
  container: 'kecom-toast-container',
  item: 'kecom-toast-item',
  card: 'kecom-toast-card',
  icon: 'kecom-toast-icon',
  content: 'kecom-toast-content',
  title: 'kecom-toast-title',
  description: 'kecom-toast-description',
  closeButton: 'kecom-toast-close',
  thumbnailContainer: 'kecom-toast-thumbnail-container',
  thumbnail: 'kecom-toast-thumbnail',
  actionButton: 'kecom-toast-action-button',
  stack: 'kecom-toast-stack',
} as const;

const DEFAULT_LABELS: Record<ToastType, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
  default: 'Notification',
  action: '',
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
  action:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="m6 12 4-4-4-4"/></svg>'
};

export class ToastManager {
  private config: ToastConfig = { ...DEFAULT_CONFIG };
  private readonly entries = new Map<string, ToastEntry>();
  private idCounter = 0;
  private container: HTMLDivElement | null = null;
  private stack: HTMLDivElement | null = null;
  private expanded = false;

  private ensureParentContainer(containerClass: string) {
    if (!this.container) {
      return;
    }
    const parent = document.getElementsByClassName(containerClass);
    if (parent && parent.length > 0) {
      const container = parent[0] as HTMLElement;
      const rect = container.getBoundingClientRect();
      const rightOffset = (window.innerWidth - rect.right) + 16;
      this.container.style.right = `${rightOffset}px`;
      this.container.style.top = `${rect.top > 0 ? rect.top : 100}px`;
    }
  }

  private ensureContainer(containerClass?: string): void {
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

    this.ensureParentContainer(containerClass ?? '');

    document.body.appendChild(this.container);
  }

  private buildActionCard(id: string, title: string, description: string, type: ToastType, thumbnail?: string, actionUrl?: string, actionText?: string) {

    const item = document.createElement('div');
    item.className = TOAST_CLASS.item;

    const card = document.createElement('div');
    card.className = TOAST_CLASS.card;
    card.setAttribute('data-type', type);

    const content = document.createElement('div');
    content.className = TOAST_CLASS.content;

    const titleElement = document.createElement('div');
    titleElement.className = TOAST_CLASS.title;
    titleElement.textContent = title;
    content.appendChild(titleElement);

    const descriptionElement = document.createElement('div');
    descriptionElement.className = TOAST_CLASS.description;
    descriptionElement.textContent = description;
    content.appendChild(descriptionElement);

    const actionButton = document.createElement('a');
    actionButton.href = actionUrl ?? '';
    actionButton.className = TOAST_CLASS.actionButton;
    actionButton.innerHTML = actionText + TOAST_ICON_MARKUP[type];
    actionButton.style.textDecoration = 'none';
    content.appendChild(actionButton);

    if (thumbnail) {
      const thumbnailContainer = document.createElement('div');
      thumbnailContainer.className = TOAST_CLASS.thumbnailContainer;

      const thumbnailElement = document.createElement('img');
      thumbnailElement.src = thumbnail;
      thumbnailElement.className = TOAST_CLASS.thumbnail;
      thumbnailContainer.appendChild(thumbnailElement);
      card.appendChild(thumbnailContainer);
    }

    card.appendChild(content);

    if (this.config.closeButton) {
      const closeButton = document.createElement('button');
      closeButton.className = TOAST_CLASS.closeButton;
      closeButton.innerHTML = '&times;';
      closeButton.addEventListener('click', () => this.dismiss(id,type));
      card.appendChild(closeButton);
    }

    item.appendChild(card);
    return item;
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

  public dismiss(id?: string, type?: ToastType): void {
    if (id) {
      const entry = this.entries.get(id);
      if (entry) {
        if (entry.timerId) {
          clearTimeout(entry.timerId);
        }
        entry.element.style.opacity = '0';
        entry.element.style.transform = 'action' === type ? 'translateY(10px)' : 'translateX(100px)';
        setTimeout(() => {
          entry.element.remove();
          this.entries.delete(id);
        }, 300);
      }
    } else {
      this.entries.forEach((entry) => {
        if (entry.timerId) {
          clearTimeout(entry.timerId);
        }
        entry.element.style.opacity = '0';
        entry.element.style.transform = 'action' === type ? 'translateY(10px)' : 'translateX(100px)';
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

  private setExpanded(isExpanded: boolean): void {
    if (this.config.expandMode === 'always') {
      this.expanded = true;
    } else if (this.config.expandMode === 'never') {
      this.expanded = false;
    } else {
      this.expanded = isExpanded;
    }

    this.restack();
  }

  private restack(): void {
    if (!this.stack) {
      return;
    }

    const visibleEntries = Array.from(this.entries.values())
      .filter((entry) => !entry.exiting && !entry.swiping)
      .reverse();

    const gap = DEFAULT_STACK_DEPTH.gap;
    const peek = DEFAULT_STACK_DEPTH.peek;
    const scaleStep = DEFAULT_STACK_DEPTH.scaleStep;
    const direction = -1;

    visibleEntries.forEach((entry) => {
      const height = entry.element.offsetHeight;
      if (height > 0) {
        entry.height = height;
      }
    });

    visibleEntries.forEach((entry, index) => {
      const isFront = index === 0;

      entry.element.setAttribute(TOAST_ATTR.dataFront, String(isFront));
      if (this.expanded) {
        entry.element.setAttribute(TOAST_ATTR.dataExpanded, TOAST_ATTR_VALUE.true);
      } else {
        entry.element.removeAttribute(TOAST_ATTR.dataExpanded);
      }

      entry.element.style.pointerEvents = isFront || this.expanded ? 'all' : 'none';

      if (!this.expanded) {
        if (isFront) {
          entry.element.style.setProperty(TOAST_CSS_VAR.y, '0px');
          entry.element.style.setProperty(TOAST_CSS_VAR.scale, '1');
          entry.element.style.setProperty(TOAST_CSS_VAR.opacity, '1');
        } else {
          const offset = index * peek;
          const scale = Math.max(DEFAULT_STACK_DEPTH.scaleFloor, 1 - index * scaleStep);
          const opacity =
            index === 1
              ? DEFAULT_STACK_DEPTH.opacity1
              : index === 2
                ? DEFAULT_STACK_DEPTH.opacity2
                : DEFAULT_STACK_DEPTH.opacity3;

          entry.element.style.setProperty(TOAST_CSS_VAR.y, `${direction * offset}px`);
          entry.element.style.setProperty(TOAST_CSS_VAR.scale, String(scale));
          entry.element.style.setProperty(TOAST_CSS_VAR.opacity, String(opacity));
        }
      } else {
        let offset = 0;
        for (let cursor = 0; cursor < index; cursor += 1) {
          offset += (visibleEntries[cursor].height || 72) + gap;
        }

        entry.element.style.setProperty(TOAST_CSS_VAR.y, `${direction * offset}px`);
        entry.element.style.setProperty(TOAST_CSS_VAR.scale, '1');
        entry.element.style.setProperty(TOAST_CSS_VAR.opacity, '1');
      }

      entry.element.style.zIndex = String(Number(TOAST_ATTR_VALUE.frontZIndex) - index);
      if (!entry.element.hasAttribute(TOAST_ATTR.dataEntering)) {
        entry.element.style.transform = `translateY(var(${TOAST_CSS_VAR.y}, 0px)) scale(var(${TOAST_CSS_VAR.scale}, 1))`;
        entry.element.style.opacity = `var(${TOAST_CSS_VAR.opacity}, 1)`;
      }
    });

    const frontHeight = visibleEntries[0]?.height || 0;
    this.stack.style.setProperty(TOAST_CSS_VAR.frontHeight, `${frontHeight}px`);

    if (this.expanded && visibleEntries.length > 0) {
      const totalHeight =
        visibleEntries.reduce((sum, entry) => sum + (entry.height || 72), 0) +
        Math.max(0, visibleEntries.length - 1) * gap;
      this.stack.style.height = `${totalHeight}px`;
    } else {
      this.stack.style.height = `${frontHeight}px`;
    }
  }

  public show(message: string, options: ToastOptions = {}): string {
    this.ensureContainer(options.containerClass);

    const id = String(++this.idCounter);
    const type = options.type || 'info';
    const duration = options.duration ?? this.config.duration ?? 5000;
    const position = options.position || this.config.position || 'bottom-right';

    // Update container position for this toast
    this.updateContainerPosition(position, options.containerClass);

    const item = type === 'action' ? this.buildActionCard(id, message, options.description ?? '', type, options.thumbnail, options.actionUrl, options.actionText) : this.buildCard(id, message, type);

    item.style.opacity = '0';
    item.style.transform = type === 'action' ? '' : 'translateX(100px)';
    item.style.transition = 'all 300ms ease';
    item.setAttribute(TOAST_ATTR.dataEntering, TOAST_ATTR_VALUE.true);
    item.setAttribute(TOAST_ATTR.dataPositionY, 'top');
   
    if ( type === 'action' ) {
      this.stack = document.createElement('div');
      this.stack.className = TOAST_CLASS.stack;
      if ( this.stack?.firstChild ) {
        this.stack.insertBefore(item, this.stack.firstChild);
      } else {
        this.stack?.appendChild(item);
      }
      this.container?.appendChild(this.stack);
    }

    if (this.container?.firstChild) {
      this.container.insertBefore(item, this.container.firstChild);
    } else {
      this.container?.appendChild(item);
    }

    setTimeout(() => {
      item.removeAttribute(TOAST_ATTR.dataEntering);
      this.restack();
    }, 420);

    requestAnimationFrame(() => {
      item.style.opacity = '1';
      item.style.transform = type === 'action' ? '' : 'translateX(0)';
    });

    let timerId: ReturnType<typeof setTimeout> | null = null;
    if (duration > 0) {
      timerId = setTimeout(() => this.dismiss(id,type), duration);
    }

    this.entries.set(id, {
      id, element: item, timerId, height: 0,
      exiting: false,
      swiping: false,
    });
    if ( type === 'action' ) {
      this.restack();
    }
 
    return id;
  }

  private updateContainerPosition(position: string, containerClass?: string): void {
    if (!this.container) {
      return;
    }

    if (position.includes('top')) {
      this.container.style.top = '16px';
      this.container.style.bottom = 'auto';
    } else {
      this.container.style.bottom = '16px';
      this.container.style.top = 'auto';
    }

    if (position.includes('left')) {
      this.container.style.left = '16px';
      this.container.style.right = 'auto';
      this.container.style.transform = 'none';
    } else if (position.includes('right')) {
      this.container.style.right = '16px';
      this.container.style.left = 'auto';
      this.container.style.transform = 'none';
    } else {
      this.container.style.left = '50%';
      this.container.style.right = 'auto';
      this.container.style.transform = 'translateX(-50%)';
    }

    this.ensureParentContainer(containerClass ?? '');
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
  const api = ((message: string, options?: ToastOptions) =>
    manager.show(message, options)) as ToastApi;

  api.success = (message, duration, options) =>
    manager.show(message, { ...options, type: 'success', duration });
  api.error = (message, duration, options) =>
    manager.show(message, { ...options, type: 'error', duration });
  api.warning = (message, duration, options) =>
    manager.show(message, { ...options, type: 'warning', duration });
  api.info = (message, duration, options) =>
    manager.show(message, { ...options, type: 'info', duration });
  api.dismiss = (id) => manager.dismiss(id);
  api.clear = () => manager.clear();
  api.configure = (options) => manager.configure(options);

  return api;
}

const manager = new ToastManager();

export const toastManager = manager;

export const toast = createToastApi(manager);

// Expose to window for demo purposes
if (typeof window !== 'undefined') {
  (window as any).kecomToast = toast;
}
