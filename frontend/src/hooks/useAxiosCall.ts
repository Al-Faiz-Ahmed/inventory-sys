import { useState, useCallback } from 'react';

import type { AxiosResponse, AxiosError } from 'axios';
import { isAxiosError } from 'axios';
import type { ApiEnvelope } from '../../../shared/error';

interface UseAxiosCallOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: AxiosError) => void;
}

export function useAxiosCall() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T>(
    axiosCall: () => Promise<AxiosResponse<T>>,
    options?: UseAxiosCallOptions
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosCall();
      options?.onSuccess?.(response.data);
      return response.data;
    } catch (err) {
      let errorMessage = 'An error occurred';
      if (isAxiosError(err)) {
        const data = err.response?.data as unknown;
        if (data && typeof data === 'object') {
          const env = data as Partial<ApiEnvelope<unknown>>;
          if (typeof env.message === 'string') {
            errorMessage = env.message;
          } else if (env.error && typeof (env.error as any).message === 'string') {
            errorMessage = (env.error as any).message;
          } else if (typeof err.message === 'string') {
            errorMessage = err.message;
          }
        } else if (typeof err.message === 'string') {
          errorMessage = err.message;
        }
        options?.onError?.(err);
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError,
  };
}
