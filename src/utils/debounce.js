/**
 * Debounce utility — delays function execution until after a specified wait period
 * has elapsed since the last invocation. Returns a debounced function with a cancel method.
 *
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function with .cancel() method
 */
const debounce = (fn, delay) => {
  let timeoutId = null;

  const debounced = (...args) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn(...args);
    }, delay);
  };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
};

export default debounce;
