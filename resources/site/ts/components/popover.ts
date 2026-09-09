/**
 * Alpine component: popover
 * Reusable popover / dropdown menu component with toggle, click-outside, and keyboard support.
 *
 * PHP usage:
 *   <div class="kecom-popover" x-data="popover()" @click.outside="close()" @keydown.escape.window="close()">
 *     <button type="button" class="kecom-btn" @click.stop="toggle()">
 *       Trigger
 *     </button>
 *
 *     <div class="kecom-popover-panel kecom-popover-panel-bottom-end" x-show="isOpen" x-cloak>
 *       <button type="button" class="kecom-popover-item" @click="doSomething(); close()">Item 1</button>
 *       <button type="button" class="kecom-popover-item kecom-popover-item-danger" @click="doDelete(); close()">Delete</button>
 *     </div>
 *   </div>
 */

export type PopoverPlacement =
  | 'bottom-end'
  | 'bottom-start'
  | 'bottom'
  | 'top-end'
  | 'top-start'
  | 'top';

export type PopoverConfig = {
  open?: boolean;
  placement?: PopoverPlacement;
  onClose?: () => void;
  onOpen?: () => void;
};

let popoverIdCounter = 0;

export function popover(config: PopoverConfig = {}) {
  const instanceId = ++popoverIdCounter;

  return {
    isOpen: config.open ?? false,
    placement: config.placement ?? 'bottom-end',
    id: instanceId,

    init() {
      // Automatically close this popover if another popover opens
      window.addEventListener('kecom:popover:opened', ((
        event: CustomEvent<{ id: number }>,
      ) => {
        if (event.detail?.id !== this.id && this.isOpen) {
          this.close();
        }
      }) as EventListener);
    },

    open() {
      this.isOpen = true;
      if (config.onOpen) {
        config.onOpen();
      }
      (this as any).$dispatch('kecom:popover:opened', { id: this.id });
    },

    close() {
      this.isOpen = false;
      if (config.onClose) {
        config.onClose();
      }
      (this as any).$dispatch('kecom:popover:closed', { id: this.id });
    },

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    },
  };
}
