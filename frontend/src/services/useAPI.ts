/**
 * Hook useAPI - для удобного использования API в React компонентах
 * Поддерживает loading, error, retry логику
 */

import { useState, useCallback, useEffect } from 'react';
import { ApiResponse } from './api';
import * as apiService from './api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  status: number | null;
}

interface UseApiOptions {
  autoFetch?: boolean;
  deps?: unknown[];
}

/**
 * Hook для автоматического fetch'а данных при монтировании компонента
 */
export function useFetchData<T>(
  endpoint: string,
  options: UseApiOptions = {}
) {
  const { autoFetch = true, deps = [] } = options;
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: autoFetch,
    error: null,
    status: null,
  });

  const fetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    const response = await apiService.get<T>(endpoint);

    setState({
      data: response.data || null,
      loading: false,
      error: response.error || null,
      status: response.status,
    });
  }, [endpoint]);

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [autoFetch, fetch, ...deps]);

  const retry = useCallback(() => {
    fetch();
  }, [fetch]);

  return { ...state, retry, fetch };
}

/**
 * Hook для создания/обновления данных
 */
export function useMutation<T, R = unknown>(
  apiCall: (data: T) => Promise<ApiResponse<R>>
) {
  const [state, setState] = useState<UseApiState<R>>({
    data: null,
    loading: false,
    error: null,
    status: null,
  });

  const mutate = useCallback(
    async (data: T) => {
      setState((prev) => ({ ...prev, loading: true }));

      const response = await apiCall(data);

      setState({
        data: response.data || null,
        loading: false,
        error: response.error || null,
        status: response.status,
      });

      return response;
    },
    [apiCall]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      status: null,
    });
  }, []);

  return { ...state, mutate, reset };
}

export default {
  useFetchData,
  useMutation,
};
