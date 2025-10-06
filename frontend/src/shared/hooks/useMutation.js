import { useCallback, useState } from 'react';
import { useUI } from '../utils/UIContext';

export function useMutation(mutationFn, options = {}) {
  const { setLoadingState, handleError, notify } = useUI();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const {
    key = 'mutation',
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    showSuccessToast = true,
    showErrorToast = true
  } = options;

  const mutate = useCallback(async (variables) => {
    try {
      setError(null);
      setIsLoading(true);
      setLoadingState(key, true);

      const result = await mutationFn(variables);
      setData(result);
      
      if (showSuccessToast) {
        notify({
          type: 'success',
          message: successMessage || 'Operación exitosa'
        });
      }

      onSuccess?.(result, variables);
      return result;
    } catch (err) {
      setError(err);
      
      if (showErrorToast) {
        notify({
          type: 'error',
          message: errorMessage || err.message || 'Error en la operación'
        });
      }

      onError?.(err);
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
      setLoadingState(key, false);
    }
  }, [
    mutationFn,
    key,
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    showSuccessToast,
    showErrorToast,
    setLoadingState,
    handleError,
    notify
  ]);

  const reset = useCallback(() => {
    setError(null);
    setData(null);
  }, []);

  return {
    mutate,
    isLoading,
    error,
    data,
    reset
  };
}
