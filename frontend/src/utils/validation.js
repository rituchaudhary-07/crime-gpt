/**
 * Cyber Security & Data Sanitization Validators for CrimeGPT
 */

export const sanitizePhoneNumber = (value = "") => {
  // Strip all non-digit characters and limit length to 10
  return value.replace(/\D/g, "").slice(0, 10);
};

export const validatePhoneNumber = (value = "") => {
  // Must be exactly 10 numeric digits
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(value);
};

export const validateEmail = (value = "") => {
  if (!value) return false;
  const emailLower = value.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(emailLower);
};
