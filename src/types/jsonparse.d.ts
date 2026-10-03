declare module 'jsonparse' {
  class JSONParser {
    stack: unknown[];
    key: string | number | undefined;
    onValue: (value: unknown) => void;
    write(chunk: Buffer | string): void;
    end(): void;
  }

  export = JSONParser;
}
