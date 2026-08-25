import MediaStack from '@/components/media-stack';
import Placeholder from '@/components/ui/placeholder';
import Thumbnail from '@/components/ui/thumbnail';
import type { MediaRef } from '@/schemas/shared/media';
import type { MediaChangePayload } from '@/types/pages/common';
import { __ } from '@/wpi18n';

type VariantThumbnailSelectorProps = {
  src?: string;
  stackMedia?: MediaRef[];
  galleryIds: number[];
  onChange: (media: MediaChangePayload | null, gallery: MediaRef[]) => void;
};

type GalleryAttachment = {
  toJSON: () => MediaRef;
  fetch: () => void;
};

type GalleryCollection = {
  map: <T>(callback: (attachment: GalleryAttachment) => T) => T[];
  reset: (attachments: GalleryAttachment[]) => void;
};

type GalleryToolbarButton = {
  model: { set: (attrs: Record<string, unknown>) => void };
};

type GalleryFrame = {
  on: (event: string, callback: () => void) => void;
  open: () => void;
  state: () => { get: (key: string) => GalleryCollection };
  toolbar: { get: () => { get: (key: string) => GalleryToolbarButton | undefined } };
};

type GalleryFrameFactory = (options: {
  frame: string;
  state: string;
  title: string;
  multiple: boolean;
  library: { type: string };
}) => GalleryFrame;

const toMediaRef = (attachment: GalleryAttachment) => attachment.toJSON();

const openGalleryFrame = (
  galleryIds: number[],
  onSelect: (media: MediaChangePayload | null, gallery: MediaRef[]) => void,
) => {
  if (typeof wp === 'undefined' || !wp?.media) {
    return;
  }

  const createFrame = wp.media as unknown as GalleryFrameFactory;
  const getAttachment = wp.media as unknown as { attachment: (id: number) => GalleryAttachment };

  const frame = createFrame({
    frame: 'post',
    state: 'gallery-edit',
    title: __('Select Variant Image', 'kirki-ecommerce'),
    multiple: true,
    library: { type: 'image' },
  });

  frame.on('open', () => {
    const attachments = galleryIds.map((id) => {
      const attachment = getAttachment.attachment(id);
      attachment.fetch();
      return attachment;
    });
    frame.state().get('library').reset(attachments);
  });

  frame.on('toolbar:render:gallery-edit', () => {
    const insert = frame.toolbar.get().get('insert');

    if (!insert) {
      return;
    }

    insert.model.set({ requires: false, text: __('Select Image', 'kirki-ecommerce') });
  });

  frame.on('select update insert', () => {
    const state = frame.state();
    const gallery = state.get('library').map(toMediaRef);
    const selected = state.get('selection').map(toMediaRef)[0] ?? null;
    onSelect(selected, gallery);
  });

  frame.open();
};

const VariantThumbnailSelector = ({ src, stackMedia, galleryIds, onChange }: VariantThumbnailSelectorProps) => {
  const handleOpen = () => openGalleryFrame(galleryIds, onChange);

  if (stackMedia && stackMedia.length > 1) {
    return (
      <div
        onClick={handleOpen}
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        aria-label={__('Select Variant Image', 'kirki-ecommerce')}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleOpen();
          }
        }}
      >
        <MediaStack size="small" mediaArray={stackMedia} />
      </div>
    );
  }

  if (!src) {
    return <Placeholder size="small" type="primary" cssOverride={{ width: 32, height: 32 }} onClick={handleOpen} />;
  }

  return (
    <div
      onClick={handleOpen}
      style={{ cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      aria-label={__('Select Variant Image', 'kirki-ecommerce')}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleOpen();
        }
      }}
    >
      <Thumbnail src={src} size="small" />
    </div>
  );
};

VariantThumbnailSelector.displayName = 'VariantThumbnailSelector';

export default VariantThumbnailSelector;
