export type Para = {
  /** block type: heading, normal, centered, or hanging-indent */
  t: "h" | "p" | "center" | "hang";
  /** text content */
  c: string;
};

export type BookContent = {
  id: string;
  title: string;
  author: string;
  cover: string;
  year: number;
  /** full publication date as ISO yyyy-MM-dd, when known */
  published?: string;
  paragraphs: Para[];
};

export type BookMeta = {
  id: string;
  title: string;
  author: string;
  cover: string;
  year: number;
  /** total word count, used for reading-time estimates */
  words: number;
};

export type Theme =
  | "light"
  | "sepia"
  | "gray"
  | "dark"
  | "night"
  | "forest";
export type FontFamily = "serif" | "sans" | "mono";
export type Align = "left" | "justify";

export type Bookmark = {
  id: number;
  /** scroll offset in px */
  y: number;
  /** progress fraction 0..1 */
  p: number;
  /** short text snippet for the label */
  label: string;
};
