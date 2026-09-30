import { useState, useEffect, useCallback } from 'react';
import { errorMessage } from './api';

interface QueryState<T> {
  data?: T;
  error?: string;
  loading: boolean;
}

/**
 * Bir API isteğini bileşene bağlar. `deps` değişince istek yeniden atılır, önceki istek iptal edilir.
 * Yeni sonuç gelene kadar eski `data` korunur (liste yenilenirken ekran boşalmaz).
 */
export function useApiQuery<T>(load: (signal: AbortSignal) => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<QueryState<T>>({ loading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal)
      .then((data) => setState({ data, loading: false }))
      .catch((err) => {
        if (!controller.signal.aborted) setState((prev) => ({ ...prev, loading: false, error: errorMessage(err) }));
      });
    return () => {
      controller.abort();
      setState((prev) => ({ ...prev, loading: true, error: undefined }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}
