export type SupportedLanguage = 'en' | 'es';

export interface CardTranslationData {
  name: string;
  desc: string;
  type?: string | null;
  humanReadableCardType?: string | null;
  race?: string | null;
}
