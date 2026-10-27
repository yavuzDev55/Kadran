export const getAuthErrorMessage = (error, fallback) => {
  const apiError = error.response?.data?.error;
  if (import.meta.env.DEV && apiError?.detail) {
    return `${apiError.message || fallback} (${apiError.detail})`;
  }
  if (apiError?.message) return apiError.message;
  if (!error.response) return "Unable to connect to the server. Check that the backend is running.";
  return fallback;
};
