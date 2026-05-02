// Brand Kit tip ve sabitleri — route dosyalarından ayrı (Next.js route export kısıtlaması).

export type BrandKit = {
  primaryColor?: string;
  accentColor?: string;
  bgColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  watermark?: boolean;
  watermarkPosition?: "tl" | "tr" | "bl" | "br";
  intro?: string;
  outro?: string;
  defaultAspect?: string;
  defaultResolution?: string;
  globalStyle?: string;
  voicePreference?: string;
};

export const DEFAULT_BRAND_KIT: BrandKit = {
  primaryColor: "#A855F7",
  accentColor: "#F59E0B",
  bgColor: "#0A0A0B",
  fontFamily: "Inter",
  watermark: false,
  watermarkPosition: "br",
  defaultAspect: "16:9",
  defaultResolution: "720p",
  globalStyle: "",
};

export const BRAND_KIT_FIELDS: (keyof BrandKit)[] = [
  "primaryColor", "accentColor", "bgColor", "fontFamily", "logoUrl",
  "watermark", "watermarkPosition", "intro", "outro",
  "defaultAspect", "defaultResolution", "globalStyle", "voicePreference",
];
