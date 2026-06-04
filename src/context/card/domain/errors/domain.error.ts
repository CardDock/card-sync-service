export type DomainErrorContext = Record<string, unknown>;

interface DomainErrorParams {
  code: string;
  message: string;
  context?: DomainErrorContext;
  cause?: unknown;
}

export class DomainError extends Error {
  readonly code: string;
  readonly context: DomainErrorContext;
  readonly cause?: unknown;

  constructor({ code, message, context = {}, cause }: DomainErrorParams) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.context = context;
    this.cause = cause;
  }
}
