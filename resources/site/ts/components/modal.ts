/**
 * Alpine component: modal
 * Reusable modal component with backdrop and keyboard support.
 *
 * PHP usage:
 *   <div x-data="modal({ open: false })">
 *     <button @click="open">Open Modal</button>
 *
 *     <div class="kecom-modal-backdrop" x-show="isOpen" @click="close"></div>
 *     <div class="kecom-modal" x-show="isOpen">
 *       <div class="kecom-modal-content">
 *         <div class="kecom-modal-header">
 *           <h3 class="kecom-modal-header-title">Title</h3>
 *           <button class="kecom-modal-header-close" @click="close">&times;</button>
 *         </div>
 *         <div class="kecom-modal-body">Content</div>
 *         <div class="kecom-modal-footer">
 *           <button class="kecom-btn kecom-btn-secondary" @click="close">Cancel</button>
 *           <button class="kecom-btn kecom-btn-primary">Save</button>
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 */

export type ModalConfig = {
  open?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
};

export function modal(config: ModalConfig = {}) {
  return {
    isOpen: config.open ?? false,

    open() {
      this.isOpen = true;
      document.body.style.overflow = 'hidden';
      if (config.onOpen) {
        config.onOpen();
      }
      (this as any).$dispatch('kecom:modal:opened');
    },

    close() {
      this.isOpen = false;
      document.body.style.overflow = '';
      if (config.onClose) {
        config.onClose();
      }
      (this as any).$dispatch('kecom:modal:closed');
    },

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    },

    handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape' && this.isOpen) {
        this.close();
      }
    },

    init() {
      // Listen for escape key
      window.addEventListener('keydown', this.handleKeydown.bind(this));

      // Clean up on destroy
      (this as any).$cleanup(() => {
        window.removeEventListener('keydown', this.handleKeydown.bind(this));
        if (this.isOpen) {
          document.body.style.overflow = '';
        }
      });
    },
  };
}
