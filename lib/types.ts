export type SlideLayout = "cover" | "content" | "ending";

export interface Slide {
  title: string;
  body: string[];
  notes?: string;
  layout?: SlideLayout;
}

export interface Presentation {
  title: string;
  slides: Slide[];
}

export interface GenerateResponse {
  presentation: Presentation;
}
