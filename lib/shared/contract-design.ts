export type PaperSizePreset = "A4" | "A5" | "B5" | "letter" | "legal" | "custom";

export const PAPER_SIZE_PRESETS: Record<PaperSizePreset, { width: string; height: string; label: string }> = {
  A4: { width: "210mm", height: "297mm", label: "A4 (210×297 mm)" },
  A5: { width: "148mm", height: "210mm", label: "A5 (148×210 mm)" },
  B5: { width: "176mm", height: "250mm", label: "B5 (176×250 mm)" },
  letter: { width: "216mm", height: "279mm", label: "Letter (216×279 mm)" },
  legal: { width: "216mm", height: "356mm", label: "Legal (216×356 mm)" },
  custom: { width: "210mm", height: "297mm", label: "Custom" },
};

export interface ContractDesignSettings {
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
  logoUrl: string;
  logoSize: number;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  direction: "rtl" | "ltr";
  paperSize: PaperSizePreset;
  pageWidth: string;
  pageHeight: string;
  titleColor: string;
  subtitleColor: string;
  textColor: string;
  backgroundColor: string;
  backgroundImage: string;
  showHeader: boolean;
  showFooter: boolean;
  showClauses: boolean;
  showSignature: boolean;
}

export const defaultContractDesignSettings: ContractDesignSettings = {
  marginTop: 10,
  marginBottom: 10,
  marginLeft: 15,
  marginRight: 15,
  paddingTop: 24,
  paddingBottom: 24,
  paddingLeft: 24,
  paddingRight: 24,
  logoUrl: "/galeria-logo.png",
  logoSize: 72,
  fontSize: 15,
  lineHeight: 1.75,
  fontFamily: "B Nazanin",
  direction: "rtl",
  paperSize: "A4",
  pageWidth: "210mm",
  pageHeight: "297mm",
  titleColor: "#c2410c",
  subtitleColor: "#e11d48",
  textColor: "#1c1917",
  backgroundColor: "#ffffff",
  backgroundImage: "",
  showHeader: true,
  showFooter: true,
  showClauses: true,
  showSignature: true,
};

const STORAGE_KEY = "karayehban_contract_design";

export function loadContractDesignSettings(): ContractDesignSettings {
  if (typeof window === "undefined") return defaultContractDesignSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultContractDesignSettings;
    return { ...defaultContractDesignSettings, ...JSON.parse(raw) };
  } catch {
    return defaultContractDesignSettings;
  }
}

export function saveContractDesignSettings(settings: ContractDesignSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
