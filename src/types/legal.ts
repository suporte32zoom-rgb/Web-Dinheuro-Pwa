export type LegalDocId =
  | "termos-de-uso"
  | "politica-de-privacidade"
  | "politica-de-cookies"
  | "sobre"
  | "disclaimer";

export interface LegalSection {
  id: string;
  title: string;
  content: string[];
}

export interface LegalDocument {
  id: LegalDocId;
  title: string;
  subtitle: string;
  path: string;
  lastUpdated: string;
  badge?: string;
  sections: LegalSection[];
}
