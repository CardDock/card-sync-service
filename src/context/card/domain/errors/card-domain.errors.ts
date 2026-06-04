import { DomainError, type DomainErrorContext } from './domain.error';

interface CardValidationErrorParams {
  field: string;
  message: string;
  value?: unknown;
  source?: string;
  rule?: string;
  cause?: unknown;
}

interface CardProcessErrorParams {
  stage: string;
  message: string;
  context?: DomainErrorContext;
  cause?: unknown;
}

export class CardDomainValidationError extends DomainError {
  constructor({
    field,
    message,
    value,
    source,
    rule,
    cause,
  }: CardValidationErrorParams) {
    super({
      code: 'CARD_VALIDATION_ERROR',
      message,
      cause,
      context: {
        entity: 'Card',
        field,
        value,
        source,
        rule,
      },
    });
  }
}

export class CardDomainProcessError extends DomainError {
  constructor({ stage, message, context = {}, cause }: CardProcessErrorParams) {
    super({
      code: 'CARD_PROCESS_ERROR',
      message,
      cause,
      context: {
        entity: 'Card',
        stage,
        ...context,
      },
    });
  }
}
