import axios from 'axios';
import { serializeBody } from './serializeBody';

export async function callWithLog<T>(
  op: string,
  requestBody: URLSearchParams | Record<string, unknown> | null | undefined,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const data = axios.isAxiosError(error) ? error.response?.data : undefined;
    console.error(`[RD_STATION][${op}] falhou`, {
      status,
      data,
      requestBody: serializeBody(requestBody)
    });
    throw error;
  }
}
