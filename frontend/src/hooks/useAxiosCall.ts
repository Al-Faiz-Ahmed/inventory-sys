import { useState, useCallback } from 'react';

import type { AxiosResponse, AxiosError } from 'axios';

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
      const axiosError = err as AxiosError;
      let errorMessage = 'An error occurred';
      if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      options?.onError?.(axiosError);
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
