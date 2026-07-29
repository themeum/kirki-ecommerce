/**
 * Alpine component: imageSlider
 * Product image gallery with main image and thumbnails.
 *
 * PHP usage:
 *   <div x-data="imageSlider({ 
 *     images: <?= json_encode($product_images) ?>,
 *     startIndex: 0
 *   })">
 */

export interface ImageSlide {
  id: string | number;
  url: string;
  alt?: string;
  thumb?: string;
}

export interface ImageSliderConfig {
  images: ImageSlide[];
  startIndex?: number;
}

export function imageSlider(config: ImageSliderConfig) {
  return {
    images: config.images,
    currentIndex: config.startIndex ?? 0,

    get currentImage(): ImageSlide {
      return this.images[this.currentIndex] || this.images[0];
    },

    get hasNext(): boolean {
      return this.currentIndex < this.images.length - 1;
    },

    get hasPrev(): boolean {
      return this.currentIndex > 0;
    },

    next() {
      if (this.hasNext) {
        this.currentIndex++;
      }
    },

    prev() {
      if (this.hasPrev) {
        this.currentIndex--;
      }
    },

    goTo(index: number) {
      this.currentIndex = index;
    },

    handleKeydown(event: KeyboardEvent) {
      if (event.key === 'ArrowRight') this.next();
      if (event.key === 'ArrowLeft') this.prev();
    },
  };
}
