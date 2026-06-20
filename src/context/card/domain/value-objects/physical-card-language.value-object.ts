export type PhysicalCardLanguageValue =
  | 'EN'
  | 'ES'
  | 'FR'
  | 'DE'
  | 'IT'
  | 'PT'
  | 'JP';

export class PhysicalCardLanguage {
  private constructor(private readonly value: PhysicalCardLanguageValue) {}

  static create(value: string): PhysicalCardLanguage {
    const normalized = value.trim().toUpperCase() as PhysicalCardLanguageValue;

    const validValues: PhysicalCardLanguageValue[] = [
      'EN',
      'ES',
      'FR',
      'DE',
      'IT',
      'PT',
      'JP',
    ];

    if (!validValues.includes(normalized)) {
      throw new Error(
        `Invalid card language: ${value}. Valid values: ${validValues.join(', ')}`,
      );
    }

    return new PhysicalCardLanguage(normalized);
  }

  toPrimitives(): PhysicalCardLanguageValue {
    return this.value;
  }
}
