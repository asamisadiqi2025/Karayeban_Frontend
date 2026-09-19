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
  pageWidth: string;
  pageHeight: string;
  titleColor: string;
  subtitleColor: string;
  textColor: string;
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
  pageWidth: "210mm",
  pageHeight: "297mm",
  titleColor: "#c2410c",
  subtitleColor: "#e11d48",
  textColor: "#1c1917",
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
