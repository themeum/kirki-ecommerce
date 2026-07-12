type MediaSize = {
  height: number;
  width: number;
  url: string;
  orientation?: 'portrait' | 'landscape';
};

type MediaRef = {
  id: string | number;
  url: string;
  filename?: string;
  sizes?: Record<string, MediaSize>;
  height?: number;
  width?: number;
  filesize?: number;
  mime?: string;
  type?: string;
  thumb?: string | null;
  author?: string;
  author_name?: string;
  date?: string;
  alt?: string;
  poster?: MediaRef | null;
};

export type { MediaSize, MediaRef };
