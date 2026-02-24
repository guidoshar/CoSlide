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

export type LogoPosition = "top-right" | "bottom-left";

export interface LogoConfig {
  data: string;
  position: LogoPosition;
}

export interface AttachedFile {
  id: string;
  fileName: string;
  fileType: "pdf" | "docx" | "image";
  content: string;
  status: "parsing" | "ready" | "error";
  error?: string;
}
