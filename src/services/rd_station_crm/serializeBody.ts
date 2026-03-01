export function serializeBody(body: URLSearchParams | Record<string, unknown> | null | undefined) {
  if (!body) return undefined;
  if (body instanceof URLSearchParams) return Object.fromEntries(body.entries());
  return body;
}
