import {
  type ToastConfig,
  type ToastOptions,
  type ToastPosition,
  type ToastType,
} from '../../types';

type ToastEntry = {
  id: string;
  element: HTMLElement;
  timerId: ReturnType<typeof setTimeout> | null;
  endsAt: number;
  remainingMs: number;
  paused: boolean;
  exiting: boolean;
  swiping: boolean;
  height: number;
  type: ToastType;
};

const DEFAULT_STACK_DEPTH = {
  gap: 12,
  peek: 14,
  scaleStep: 0.05,
  scaleFloor: 0.85,
  opacity1: 0.8,
  opacity2: 0.5,
  opacity3: 0,
  maxVisible: 3,
} as const;

const SCROLL_PADDING = 12;

const TOAST_ATTR = {
  ariaLive: 'aria-live',
  ariaLabel: 'aria-label',
  role: 'role',
  dataPositionX: 'data-position-x',
  dataPositionY: 'data-position-y',
  dataType: 'data-type',
  dataFront: 'data-front',
  dataExpanded: 'data-expanded',
  dataEntering: 'data-entering',
  dataExiting: 'data-exiting',
  dataSwiping: 'data-swiping',
  dataScrolling: 'data-scrolling',
  dataOverflowing: 'data-overflowing',
} as const;

const TOAST_ATTR_VALUE = {
  polite: 'polite',
  region: 'region',
  status: 'status',
  true: 'true',
} as const;

export type ToastApi = {
  (message: string, options?: ToastOptions): string;
  success: (message: string, duration?: number, options?: ToastOptions) => string;
  error: (message: string, duration?: number, options?: ToastOptions) => string;
  warning: (message: string, duration?: number, options?: ToastOptions) => string;
  info: (message: string, duration?: number, options?: ToastOptions) => string;
  action: (message: string, duration?: number, options?: ToastOptions) => string;
  dismiss: (id?: string) => void;
  clear: () => void;
  configure: (options: ToastConfig) => void;
};

const DEFAULT_CONFIG: ToastConfig = {
  position: 'bottom-right',
  duration: 5000,
  closeButton: true,
  expandMode: 'hover',
  maxVisible: 3,
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
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="m6 12 4-4-4-4"/></svg>',
};

export class ToastManager {
  private config: ToastConfig = { ...DEFAULT_CONFIG };
  private readonly entries = new Map<string, ToastEntry>();
  private idCounter = 0;
  private container: HTMLDivElement | null = null;
  private stack: HTMLDivElement | null = null;
  private expanded = false;
  private scrollOffset = 0;
  private scrollTimeout: ReturnType<typeof setTimeout> | null = null;

  private getMaxAvailableHeight(): number {
    if (typeof window === 'undefined') {
      return 600;
    }
    const wpAdminBar = document.getElementById('wpadminbar');
    const adminBarHeight = wpAdminBar ? wpAdminBar.offsetHeight : 0;
    const topMargin = Math.max(20, adminBarHeight + 20);
    const bottomMargin = 20;
    return Math.max(160, window.innerHeight - topMargin - bottomMargin);
  }

  private ensureParentContainer(containerClass: string): void {
    if (!this.container || !containerClass) {
      return;
    }
    const parent = document.getElementsByClassName(containerClass);
    if (parent && parent.length > 0) {
      const container = parent[0] as HTMLElement;
      const rect = container.getBoundingClientRect();
      const rightOffset = window.innerWidth - rect.right + 16;
      this.container.style.right = `${rightOffset}px`;
      this.container.style.top = `${rect.top > 0 ? rect.top : 100}px`;
    }
  }

  private clearTimer(id: string): void {
    const entry = this.entries.get(id);
    if (entry?.timerId) {
      clearTimeout(entry.timerId);
      entry.timerId = null;
    }
  }

  private pauseAll(): void {
    this.entries.forEach((entry) => this.pauseEntry(entry));
  }

  private resumeAll(): void {
    this.entries.forEach((entry) => this.resumeEntry(entry));
  }

  private pauseEntry(entry: ToastEntry): void {
    if (entry.paused || entry.exiting) {
      return;
    }

    this.clearTimer(entry.id);
    entry.remainingMs = Math.max(0, entry.endsAt - Date.now());
    entry.paused = true;
  }

  private resumeEntry(entry: ToastEntry): void {
    if (!entry.paused || entry.exiting) {
      return;
    }

    entry.paused = false;

    if (entry.remainingMs > 0) {
      entry.endsAt = Date.now() + entry.remainingMs;
      entry.timerId = setTimeout(() => this.dismiss(entry.id), entry.remainingMs);
    } else {
      this.dismiss(entry.id);
    }
  }

  private setScrollingState(isScrolling: boolean): void {
    this.entries.forEach((entry) => {
      if (isScrolling) {
        entry.element.setAttribute(TOAST_ATTR.dataScrolling, TOAST_ATTR_VALUE.true);
      } else {
        entry.element.removeAttribute(TOAST_ATTR.dataScrolling);
      }
    });
  }

  private handleWheel(e: WheelEvent): void {
    const isExpanded = this.expanded || this.config.expandMode === 'always';
    if (!isExpanded) {
      return;
    }

    const maxAvailableHeight = this.getMaxAvailableHeight();
    const visibleEntries = Array.from(this.entries.values()).filter(
      (entry) => !entry.exiting && !entry.swiping,
    );

    const rawTotalHeight =
      visibleEntries.reduce((sum, entry) => sum + (entry.height || 64), 0) +
      Math.max(0, visibleEntries.length - 1) * DEFAULT_STACK_DEPTH.gap;

    const scrollPadding = isExpanded && rawTotalHeight > maxAvailableHeight ? SCROLL_PADDING : 0;
    const totalHeight = rawTotalHeight + scrollPadding * 2;

    const maxScroll = Math.max(0, totalHeight - maxAvailableHeight);
    if (maxScroll <= 0) {
      return;
    }

    e.preventDefault();

    const isTop = (this.config.position || '').includes('top');
    // For bottom: scrolling UP (deltaY < 0) moves to top/older toasts (increases offset).
    //             scrolling DOWN (deltaY > 0) moves back down to bottom toast (decreases offset to 0).
    // For top:    scrolling DOWN (deltaY > 0) moves down to lower toasts (increases offset).
    //             scrolling UP (deltaY < 0) moves back up to top toast (decreases offset to 0).
    const scrollDelta = isTop ? e.deltaY : -e.deltaY;
    this.scrollOffset = Math.max(0, Math.min(maxScroll, this.scrollOffset + scrollDelta));

    this.setScrollingState(true);
    this.restack();

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.scrollTimeout = setTimeout(() => {
      this.setScrollingState(false);
    }, 120);
  }

  private ensureContainer(containerClass?: string): void {
    if (this.container) {
      this.ensureParentContainer(containerClass ?? '');
      return;
    }

    this.container = document.createElement('div');
    this.container.className = TOAST_CLASS.container;
    this.container.setAttribute(TOAST_ATTR.role, TOAST_ATTR_VALUE.region);
    this.container.setAttribute(TOAST_ATTR.ariaLive, TOAST_ATTR_VALUE.polite);
    this.container.setAttribute(TOAST_ATTR.ariaLabel, 'Notifications');

    const position = this.config.position || 'bottom-right';
    this.updateContainerPosition(position, containerClass);

    this.stack = document.createElement('div');
    this.stack.className = TOAST_CLASS.stack;

    // Hover expand & pause listeners
    this.stack.addEventListener('mouseenter', () => {
      if (this.config.expandMode !== 'never') {
        this.expanded = true;
        this.restack();
      }
      this.pauseAll();
    });

    this.stack.addEventListener('mouseleave', () => {
      this.scrollOffset = 0;
      this.setScrollingState(false);
      if (this.config.expandMode !== 'always') {
        this.expanded = false;
        this.restack();
      }
      this.resumeAll();
    });

    // Wheel scroll listener for expanded toasts
    this.stack.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

    this.container.appendChild(this.stack);
    document.body.appendChild(this.container);
  }

  private updateContainerPosition(position: ToastPosition, containerClass?: string): void {
    if (!this.container) {
      return;
    }

    const posX = position.includes('left')
      ? 'left'
      : position.includes('center')
        ? 'center'
        : 'right';
    const posY = position.includes('top') ? 'top' : 'bottom';

    this.container.setAttribute(TOAST_ATTR.dataPositionX, posX);
    this.container.setAttribute(TOAST_ATTR.dataPositionY, posY);

    this.ensureParentContainer(containerClass ?? '');
  }

  private buildActionCard(
    id: string,
    title: string,
    description: string,
    type: ToastType,
    thumbnail?: string,
    actionUrl?: string,
    actionText?: string,
  ): HTMLElement {
    const item = document.createElement('div');
    item.className = TOAST_CLASS.item;
    item.setAttribute(TOAST_ATTR.role, TOAST_ATTR_VALUE.status);
    item.setAttribute(TOAST_ATTR.dataType, type);

    const card = document.createElement('div');
    card.className = TOAST_CLASS.card;
    card.setAttribute(TOAST_ATTR.dataType, type);

    if (thumbnail) {
      const thumbnailContainer = document.createElement('div');
      thumbnailContainer.className = TOAST_CLASS.thumbnailContainer;

      const thumbnailElement = document.createElement('img');
      thumbnailElement.src = thumbnail;
      thumbnailElement.alt = title;
      thumbnailElement.className = TOAST_CLASS.thumbnail;
      thumbnailContainer.appendChild(thumbnailElement);
      card.appendChild(thumbnailContainer);
    }

    const content = document.createElement('div');
    content.className = TOAST_CLASS.content;

    if (title) {
      const titleElement = document.createElement('div');
      titleElement.className = TOAST_CLASS.title;
      titleElement.textContent = title;
      content.appendChild(titleElement);
    }

    if (description) {
      const descriptionElement = document.createElement('div');
      descriptionElement.className = TOAST_CLASS.description;
      descriptionElement.textContent = description;
      content.appendChild(descriptionElement);
    }

    if (actionText) {
      const actionButton = document.createElement('a');
      actionButton.href = actionUrl ?? '#';
      actionButton.className = TOAST_CLASS.actionButton;
      actionButton.innerHTML = `<span>${actionText}</span>${TOAST_ICON_MARKUP[type] || ''}`;
      actionButton.style.textDecoration = 'none';
      content.appendChild(actionButton);
    }

    card.appendChild(content);

    if (this.config.closeButton) {
      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = TOAST_CLASS.closeButton;
      closeButton.setAttribute('aria-label', 'Close');
      closeButton.innerHTML = '&times;';
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dismiss(id);
      });
      card.appendChild(closeButton);
    }

    item.appendChild(card);
    return item;
  }

  private buildCard(id: string, message: string, options: ToastOptions = {}): HTMLElement {
    const type = options.type || 'info';
    const title =
      options.title || (message && options.description ? message : DEFAULT_LABELS[type]);
    const description = options.description ?? (options.title ? message : message);

    const item = document.createElement('div');
    item.className = TOAST_CLASS.item;
    item.setAttribute(TOAST_ATTR.role, TOAST_ATTR_VALUE.status);
    item.setAttribute(TOAST_ATTR.dataType, type);

    const card = document.createElement('div');
    card.className = TOAST_CLASS.card;
    card.setAttribute(TOAST_ATTR.dataType, type);

    if (options.icon !== null) {
      const icon = document.createElement('div');
      icon.className = TOAST_CLASS.icon;
      icon.innerHTML = options.icon ?? TOAST_ICON_MARKUP[type] ?? TOAST_ICON_MARKUP.default;
      card.appendChild(icon);
    }

    const content = document.createElement('div');
    content.className = TOAST_CLASS.content;

    if (title) {
      const titleEl = document.createElement('div');
      titleEl.className = TOAST_CLASS.title;
      titleEl.textContent = title;
      content.appendChild(titleEl);
    }

    if (description && description !== title) {
      const descEl = document.createElement('div');
      descEl.className = TOAST_CLASS.description;
      descEl.textContent = description;
      content.appendChild(descEl);
    }

    card.appendChild(content);

    if (options.closeButton ?? this.config.closeButton) {
      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = TOAST_CLASS.closeButton;
      closeButton.setAttribute('aria-label', 'Close');
      closeButton.innerHTML = '&times;';
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dismiss(id);
      });
      card.appendChild(closeButton);
    }

    item.appendChild(card);
    return item;
  }

  private attachSwipeHandler(item: HTMLElement, id: string): void {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isTracking = false;

    const onPointerDown = (e: PointerEvent) => {
      if (
        (e.target as HTMLElement)?.closest(
          `.${TOAST_CLASS.closeButton}, .${TOAST_CLASS.actionButton}`,
        )
      ) {
        return;
      }
      startX = e.clientX;
      startY = e.clientY;
      currentX = startX;
      currentY = startY;
      isTracking = true;
      item.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isTracking) {
        return;
      }
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      // When expanded and vertical movement dominates, allow vertical drag scroll
      if (
        (this.expanded || this.config.expandMode === 'always') &&
        Math.abs(deltaY) > Math.abs(deltaX) &&
        Math.abs(deltaY) > 5
      ) {
        const maxAvailableHeight = this.getMaxAvailableHeight();
        const visibleEntries = Array.from(this.entries.values()).filter(
          (entry) => !entry.exiting && !entry.swiping,
        );
        const rawTotalHeight =
          visibleEntries.reduce((sum, entry) => sum + (entry.height || 64), 0) +
          Math.max(0, visibleEntries.length - 1) * DEFAULT_STACK_DEPTH.gap;
        const scrollPadding = rawTotalHeight > maxAvailableHeight ? SCROLL_PADDING : 0;
        const totalHeight = rawTotalHeight + scrollPadding * 2;
        const maxScroll = Math.max(0, totalHeight - maxAvailableHeight);

        if (maxScroll > 0) {
          const isTop = (this.config.position || '').includes('top');
          const stepY = e.clientY - currentY;
          currentY = e.clientY;
          // Drag down (stepY > 0) on bottom stack increases scrollOffset to pull upper items into view
          const scrollDelta = isTop ? -stepY : stepY;
          this.scrollOffset = Math.max(0, Math.min(maxScroll, this.scrollOffset + scrollDelta));
          this.setScrollingState(true);
          this.restack();
          return;
        }
      }

      if (Math.abs(deltaX) > 5 && Math.abs(deltaX) > Math.abs(deltaY)) {
        currentX = e.clientX;
        const entry = this.entries.get(id);
        if (entry) {
          entry.swiping = true;
        }
        item.setAttribute(TOAST_ATTR.dataSwiping, TOAST_ATTR_VALUE.true);
        const opacity = Math.max(0, 1 - Math.abs(deltaX) / 200);
        item.style.transform = `translate3d(${deltaX}px, var(${TOAST_CSS_VAR.y}, 0px), 0) scale(var(${TOAST_CSS_VAR.scale}, 1))`;
        item.style.opacity = String(opacity);
      }
    };

    const onPointerEnd = (e: PointerEvent) => {
      if (!isTracking) {
        return;
      }
      isTracking = false;
      this.setScrollingState(false);
      try {
        item.releasePointerCapture?.(e.pointerId);
      } catch {
        // Ignore if pointer capture already released
      }

      const deltaX = currentX - startX;
      const entry = this.entries.get(id);

      if (Math.abs(deltaX) > 80) {
        // Swiped away
        if (entry) {
          entry.swiping = false;
        }
        const swipeDir = deltaX > 0 ? 1 : -1;
        item.style.transition = 'transform 200ms ease, opacity 200ms ease';
        item.style.transform = `translate3d(${swipeDir * 350}px, var(${TOAST_CSS_VAR.y}, 0px), 0)`;
        item.style.opacity = '0';
        setTimeout(() => this.dismiss(id), 200);
      } else {
        // Snap back
        if (entry) {
          entry.swiping = false;
        }
        item.removeAttribute(TOAST_ATTR.dataSwiping);
        item.style.transform = `translateY(var(${TOAST_CSS_VAR.y}, 0px)) scale(var(${TOAST_CSS_VAR.scale}, 1))`;
        item.style.opacity = `var(${TOAST_CSS_VAR.opacity}, 1)`;
        this.restack();
      }
    };

    item.addEventListener('pointerdown', onPointerDown);
    item.addEventListener('pointermove', onPointerMove);
    item.addEventListener('pointerup', onPointerEnd);
    item.addEventListener('pointercancel', onPointerEnd);
  }

  public dismiss(id?: string): void {
    if (id) {
      const entry = this.entries.get(id);
      if (!entry || entry.exiting) {
        return;
      }

      entry.exiting = true;
      this.clearTimer(id);

      const isTop = (this.config.position || '').includes('top');
      const exitDirection = isTop ? -1 : 1;

      entry.element.removeAttribute(TOAST_ATTR.dataEntering);
      entry.element.setAttribute(TOAST_ATTR.dataExiting, TOAST_ATTR_VALUE.true);
      entry.element.style.transform = `translateY(${exitDirection * 16}px) scale(0.95)`;
      entry.element.style.opacity = '0';

      setTimeout(() => {
        entry.element.remove();
        this.entries.delete(id);
        this.restack();
      }, 250);

      // Immediately restack remaining items so they move towards the front
      this.restack();
    } else {
      // Dismiss all
      this.entries.forEach((entry) => {
        this.clearTimer(entry.id);
        entry.exiting = true;
        entry.element.setAttribute(TOAST_ATTR.dataExiting, TOAST_ATTR_VALUE.true);
        entry.element.style.opacity = '0';
        setTimeout(() => {
          entry.element.remove();
        }, 250);
      });
      this.entries.clear();
      if (this.stack) {
        this.stack.style.height = '0px';
      }
    }
  }

  public clear(): void {
    this.dismiss();
  }

  public restack(): void {
    if (!this.stack) {
      return;
    }

    const isTop = (this.config.position || '').includes('top');
    const direction = isTop ? 1 : -1;
    const gap = DEFAULT_STACK_DEPTH.gap;
    const peek = DEFAULT_STACK_DEPTH.peek;
    const scaleStep = DEFAULT_STACK_DEPTH.scaleStep;

    const visibleEntries = Array.from(this.entries.values())
      .filter((entry) => !entry.exiting && !entry.swiping)
      .reverse(); // Newest is index 0 (front)

    visibleEntries.forEach((entry) => {
      const height = entry.element.offsetHeight;
      if (height > 0) {
        entry.height = height;
      }
    });

    const isExpanded = this.expanded || this.config.expandMode === 'always';
    const maxAvailableHeight = this.getMaxAvailableHeight();
    const rawTotalHeight =
      visibleEntries.reduce((sum, entry) => sum + (entry.height || 64), 0) +
      Math.max(0, visibleEntries.length - 1) * gap;

    const scrollPadding = isExpanded && rawTotalHeight > maxAvailableHeight ? SCROLL_PADDING : 0;
    const totalHeight = rawTotalHeight + scrollPadding * 2;

    const isOverflowing = isExpanded && totalHeight > maxAvailableHeight;
    const maxScroll = isOverflowing ? totalHeight - maxAvailableHeight : 0;
    this.scrollOffset = Math.max(0, Math.min(maxScroll, this.scrollOffset));

    if (isOverflowing) {
      this.stack.setAttribute(TOAST_ATTR.dataOverflowing, TOAST_ATTR_VALUE.true);
    } else {
      this.stack.removeAttribute(TOAST_ATTR.dataOverflowing);
    }

    if (isExpanded) {
      this.stack.setAttribute(TOAST_ATTR.dataExpanded, TOAST_ATTR_VALUE.true);
    } else {
      this.stack.removeAttribute(TOAST_ATTR.dataExpanded);
    }

    visibleEntries.forEach((entry, index) => {
      const isFront = index === 0;

      entry.element.setAttribute(TOAST_ATTR.dataFront, String(isFront));
      entry.element.setAttribute(TOAST_ATTR.dataPositionY, isTop ? 'top' : 'bottom');

      if (isExpanded) {
        entry.element.setAttribute(TOAST_ATTR.dataExpanded, TOAST_ATTR_VALUE.true);
      } else {
        entry.element.removeAttribute(TOAST_ATTR.dataExpanded);
      }

      entry.element.style.pointerEvents = isFront || isExpanded ? 'auto' : 'none';
      entry.element.style.zIndex = String(100 - index);

      let y: number;
      let scale: number;
      let opacity: number;

      if (!isExpanded) {
        if (isFront) {
          y = 0;
          scale = 1;
          opacity = 1;
        } else {
          y = direction * index * peek;
          scale = Math.max(DEFAULT_STACK_DEPTH.scaleFloor, 1 - index * scaleStep);
          opacity =
            index === 1
              ? DEFAULT_STACK_DEPTH.opacity1
              : index === 2
                ? DEFAULT_STACK_DEPTH.opacity2
                : DEFAULT_STACK_DEPTH.opacity3;
        }
      } else {
        let offset = 0;
        for (let cursor = 0; cursor < index; cursor += 1) {
          offset += (visibleEntries[cursor].height || 64) + gap;
        }
        const adjustedOffset = offset + scrollPadding - this.scrollOffset;
        y = direction * adjustedOffset;
        scale = 1;
        opacity = 1;
      }

      entry.element.style.setProperty(TOAST_CSS_VAR.y, `${y}px`);
      entry.element.style.setProperty(TOAST_CSS_VAR.scale, String(scale));
      entry.element.style.setProperty(TOAST_CSS_VAR.opacity, String(opacity));
    });

    const frontHeight = visibleEntries[0]?.height || 0;
    this.stack.style.setProperty(TOAST_CSS_VAR.frontHeight, `${frontHeight}px`);

    if (isExpanded && visibleEntries.length > 0) {
      const displayHeight = Math.min(totalHeight, maxAvailableHeight);
      this.stack.style.height = `${displayHeight}px`;
    } else {
      this.stack.style.height = `${frontHeight}px`;
    }
  }

  public show(message: string, options: ToastOptions = {}): string {
    const position = options.position || this.config.position || 'bottom-right';
    this.ensureContainer(options.containerClass);
    this.updateContainerPosition(position, options.containerClass);

    const id = String(++this.idCounter);
    const type = options.type || 'info';
    const duration = options.duration ?? this.config.duration ?? 5000;

    const item =
      type === 'action'
        ? this.buildActionCard(
            id,
            options.title || message,
            options.description ?? (options.title ? message : ''),
            type,
            options.thumbnail,
            options.actionUrl,
            options.actionText,
          )
        : this.buildCard(id, message, options);

    const isTop = position.includes('top');
    item.setAttribute(TOAST_ATTR.dataPositionY, isTop ? 'top' : 'bottom');
    item.setAttribute(TOAST_ATTR.dataEntering, TOAST_ATTR_VALUE.true);

    // Initial positioning for enter animation
    const enterDirection = isTop ? -1 : 1;
    item.style.setProperty(TOAST_CSS_VAR.y, `${enterDirection * 16}px`);
    item.style.setProperty(TOAST_CSS_VAR.scale, '0.95');
    item.style.setProperty(TOAST_CSS_VAR.opacity, '0');

    // Attach into stack container
    this.stack?.appendChild(item);

    // Attach swipe gesture handling
    this.attachSwipeHandler(item, id);

    let timerId: ReturnType<typeof setTimeout> | null = null;
    if (duration > 0) {
      timerId = setTimeout(() => this.dismiss(id), duration);
    }

    const entry: ToastEntry = {
      id,
      element: item,
      timerId,
      height: 0,
      exiting: false,
      swiping: false,
      paused: false,
      endsAt: duration > 0 ? Date.now() + duration : 0,
      remainingMs: duration,
      type,
    };

    this.entries.set(id, entry);

    // Trigger enter transition on next animation frame
    requestAnimationFrame(() => {
      item.removeAttribute(TOAST_ATTR.dataEntering);
      this.restack();
    });

    return id;
  }

  public action(message: string, duration?: number, options?: ToastOptions): string {
    return this.show(message, { ...options, type: 'action', duration });
  }

  public success(message: string, duration?: number, options?: ToastOptions): string {
    return this.show(message, { ...options, type: 'success', duration });
  }

  public error(message: string, duration?: number, options?: ToastOptions): string {
    return this.show(message, { ...options, type: 'error', duration });
  }

  public warning(message: string, duration?: number, options?: ToastOptions): string {
    return this.show(message, { ...options, type: 'warning', duration });
  }

  public info(message: string, duration?: number, options?: ToastOptions): string {
    return this.show(message, { ...options, type: 'info', duration });
  }

  public configure(options: ToastConfig): void {
    this.config = { ...this.config, ...options };
    if (this.config.position && this.container) {
      this.updateContainerPosition(this.config.position);
    }
  }
}

export function createToastApi(manager: ToastManager): ToastApi {
  const api = ((message: string, options?: ToastOptions) =>
    manager.show(message, options)) as ToastApi;

  api.success = (message, duration, options) => manager.success(message, duration, options);
  api.error = (message, duration, options) => manager.error(message, duration, options);
  api.warning = (message, duration, options) => manager.warning(message, duration, options);
  api.info = (message, duration, options) => manager.info(message, duration, options);
  api.action = (message, duration, options) => manager.action(message, duration, options);
  api.dismiss = (id) => manager.dismiss(id);
  api.clear = () => manager.clear();
  api.configure = (options) => manager.configure(options);

  return api;
}

const manager = new ToastManager();

export const toastManager = manager;

export const toast = createToastApi(manager);

// Expose to window for site/theme usage
if (typeof window !== 'undefined') {
  (window as any).kecomToast = toast;
}
