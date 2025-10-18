import { useState, useCallback } from 'react';
import { ApiResponse, ApiError, NetworkError } from '../types/api';
import logger from '../utils/logger';

/**
 * Custom hook for API operations with loading states and error handling
 */
export const useApi = <T = any>() => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | NetworkError | null>(null);

  const execute = useCallback(
    async <P = any>(
      apiCall: () => Promise<ApiResponse<T>>,
      options?: {
        showError?: boolean;
        errorMessage?: string;
        onSuccess?: (data: T) => void;
        onError?: (error: ApiError | NetworkError) => void;
      },
    ): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);

        logger.debug(
          'API call started',
          { apiCall: apiCall.toString() },
          'useApi',
        );

        const response = await apiCall();

        if (response.success && response.data) {
          setData(response.data);
          options?.onSuccess?.(response.data);
          logger.info(
            'API call successful',
            { status: response.status },
            'useApi',
          );
          return response.data;
        } else {
          throw new Error(response.error || 'API call failed');
        }
      } catch (err) {
        const apiError: ApiError = {
          code: 'API_ERROR',
          message: options?.errorMessage || err.message || 'An error occurred',
          timestamp: new Date().toISOString(),
        };

        setError(apiError);
        options?.onError?.(apiError);

        logger.error('API call failed', err as Error, 'useApi');

        if (options?.showError !== false) {
          // You could integrate with a toast notification system here
          // DISABLED FOR PERFORMANCE
          // console.log('API Error:', apiError.message);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    isSuccess: !!data && !error,
    isError: !!error,
  };
};

/**
 * Hook for handling form submissions with API calls
 */
export const useFormApi = <T = any, F = any>(initialValues: F) => {
  const [values, setValues] = useState<F>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { data, loading, error, execute, reset } = useApi<T>();

  const setValue = useCallback(
    (field: keyof F, value: any) => {
      setValues(prev => ({ ...prev, [field]: value }));

      // Clear field error when user starts typing
      if (errors[field as string]) {
        setErrors(prev => ({ ...prev, [field as string]: '' }));
      }
    },
    [errors],
  );

  const setFieldTouched = useCallback((field: keyof F, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field as string]: isTouched }));
  }, []);

  const setFieldError = useCallback((field: keyof F, error: string) => {
    setErrors(prev => ({ ...prev, [field as string]: error }));
  }, []);

  const validateField = useCallback(
    (field: keyof F, value: any): string => {
      // Basic validation - you can extend this based on your needs
      if (!value && touched[field as string]) {
        return `${String(field)} is required`;
      }
      return '';
    },
    [touched],
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(values).forEach(key => {
      const fieldError = validateField(key as keyof F, values[key as keyof F]);
      if (fieldError) {
        newErrors[key] = fieldError;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateField]);

  const handleSubmit = useCallback(
    async (
      submitFn: (formData: F) => Promise<ApiResponse<T>>,
      options?: {
        validate?: boolean;
        onSuccess?: (data: T) => void;
        onError?: (error: ApiError | NetworkError) => void;
      },
    ) => {
      const shouldValidate = options?.validate !== false;

      if (shouldValidate && !validateForm()) {
        return null;
      }

      return execute(() => submitFn(values), {
        onSuccess: options?.onSuccess,
        onError: options?.onError,
      });
    },
    [values, validateForm, execute],
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    reset();
  }, [initialValues, reset]);

  return {
    // Form state
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    setFieldError,

    // Form actions
    validateField,
    validateForm,
    handleSubmit,
    resetForm,

    // API state
    data,
    loading,
    error,
    isSuccess: !!data && !error,
    isError: !!error,

    // Computed
    isDirty: JSON.stringify(values) !== JSON.stringify(initialValues),
    isValid: Object.keys(errors).length === 0,
  };
};

export default useApi;
