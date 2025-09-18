import { useState, useCallback } from 'react';

/**
 * Custom hook for managing form submission states
 * Provides loading state, error handling, and prevents duplicate submissions
 */
export const useFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Execute a form submission with loading state management
   * @param {Function} submitFunction - The async function to execute
   * @param {Object} options - Configuration options
   * @param {Function} options.onSuccess - Callback for successful submission
   * @param {Function} options.onError - Callback for error handling
   * @param {string} options.successMessage - Success message to show
   * @param {string} options.errorMessage - Error message to show
   */
  const submitForm = useCallback(async (submitFunction, options = {}) => {
    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await submitFunction();
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || options.errorMessage || 'An error occurred';
      setError(errorMessage);
      
      if (options.onError) {
        options.onError(err);
      }
      
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  /**
   * Reset the form submission state
   */
  const resetForm = useCallback(() => {
    setIsSubmitting(false);
    setError(null);
  }, []);

  /**
   * Clear only the error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSubmitting,
    error,
    submitForm,
    resetForm,
    clearError
  };
};

export default useFormSubmission;
