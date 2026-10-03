export type ErrorCode
  = | 'USAGE'
    | 'ENVIRONMENT'
    | 'NETWORK'
    | 'CONFLICT'
    | 'PREFLIGHT'
    | 'BOOTSTRAP'
    | 'INSTALL'
    | 'SETUP'
    | 'ADOPT'
    | 'CANCEL';

const EXIT_CODES: Record<ErrorCode, number> = {
  USAGE: 2,
  ENVIRONMENT: 10,
  NETWORK: 11,
  CONFLICT: 12,
  PREFLIGHT: 13,
  BOOTSTRAP: 20,
  INSTALL: 30,
  SETUP: 31,
  ADOPT: 32,
  CANCEL: 130,
};

export class CliError extends Error {
  readonly code: ErrorCode;
  readonly hint?: string;

  constructor(code: ErrorCode, message: string, hint?: string) {
    super(message);
    this.code = code;
    this.hint = hint;
    this.name = 'CliError';
  }

  get exitCode(): number {
    return EXIT_CODES[this.code];
  }
}
