import axios from 'axios';
import { RETRYABLE_STATUS } from './constants';
import { sleep } from './sleep';

export async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 500): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (retries > 0 && status && RETRYABLE_STATUS.includes(status)) {
      await sleep(delayMs);
      return withRetry(fn, retries - 1, delayMs * 2);
    }
    throw error;
  }
}
