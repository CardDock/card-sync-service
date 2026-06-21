export abstract class Logger {
  abstract info(meta: Record<string, unknown>, message: string): void;
  abstract warn(meta: Record<string, unknown>, message: string): void;
  abstract error(meta: Record<string, unknown>, message: string): void;
  abstract debug(meta: Record<string, unknown>, message: string): void;
}
