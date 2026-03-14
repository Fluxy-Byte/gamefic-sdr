const SENSITIVE_FIELDS = new Set([
  'client_id',
  'client_secret',
  'refresh_token',
  'access_token',
  'authorization',
  'api_key',
  'token'
]);

function maskValue(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) return '***';
  if (value.length <= 6) return '***';
  return `${value.slice(0, 3)}***${value.slice(-2)}`;
}

function redactRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => {
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        return [key, maskValue(value)];
      }
      return [key, value];
    })
  );
}

export function serializeBody(body: URLSearchParams | Record<string, unknown> | null | undefined) {
  if (!body) return undefined;

  if (body instanceof URLSearchParams) {
    return redactRecord(Object.fromEntries(body.entries()));
  }

  return redactRecord(body);
}
