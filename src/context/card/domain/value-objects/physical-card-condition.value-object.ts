export type PhysicalCardConditionValue =
  | 'MINT'
  | 'NEAR_MINT'
  | 'EXCELLENT'
  | 'GOOD'
  | 'LIGHT_PLAYED'
  | 'PLAYED'
  | 'POOR';

export class PhysicalCardCondition {
  private constructor(private readonly value: PhysicalCardConditionValue) {}

  static create(value: string): PhysicalCardCondition {
    const normalized = value.trim().toUpperCase().replace(/\s+/g, '_') as PhysicalCardConditionValue;

    const validValues: PhysicalCardConditionValue[] = [
      'MINT',
      'NEAR_MINT',
      'EXCELLENT',
      'GOOD',
      'LIGHT_PLAYED',
      'PLAYED',
      'POOR',
    ];

    if (!validValues.includes(normalized)) {
      throw new Error(
        `Invalid card condition: ${value}. Valid values: ${validValues.join(', ')}`,
      );
    }

    return new PhysicalCardCondition(normalized);
  }

  toPrimitives(): PhysicalCardConditionValue {
    return this.value;
  }
}
