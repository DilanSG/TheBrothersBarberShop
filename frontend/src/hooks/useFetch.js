import { useCallback, useEffect, useState } from 'react';
import { useUI } from '../utils/UIContext';
import { useApp } from '../utils/AppContext';

export function useFetch(service, options = {}) {
  const { setLoadingState, handleError } = useUI();
  const { needsUpdate } = useApp();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    key = 'default',
    dependencies = [],
    transform,
    onSuccess,
    onError,
    cacheTime = 300000, // 5 minutos por defecto
    enabled = true
  } = options;

  const execute = useCallback(async (...args) => {
    try {
      setError(null);
      setIsLoading(true);
      setLoadingState(key, true);

      const response = await service(...args);
      const transformedData = transform ? transform(response) : response;

      setData(transformedData);
      onSuccess?.(transformedData);

      return transformedData;
    } catch (err) {
      setError(err);
      onError?.(err);
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
      setLoadingState(key, false);
    }
  }, [service, transform, onSuccess, onError, handleError, setLoadingState, key]);

  useEffect(() => {
    if (!enabled) return;

    // Si hay datos en caché y no necesitan actualización, no hacer fetch
    if (data && !needsUpdate(key, cacheTime)) return;

    execute();
  }, [enabled, execute, needsUpdate, key, cacheTime, data, ...dependencies]);

  return {
    data,
    error,
    isLoading,
    execute,
    setData
  };
}
