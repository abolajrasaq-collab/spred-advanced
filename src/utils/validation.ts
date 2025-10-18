// Validation utilities used by SignIn and related screens.

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateEmail(email: string | undefined | null): ValidationResult {
  const errors: string[] = [];
  
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }
  
  const trimmedEmail = email.trim();
  if (trimmedEmail.length === 0) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }
  
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(trimmedEmail)) {
    errors.push('Please enter a valid email address');
    return { isValid: false, errors };
  }
  
  return { isValid: true, errors };
}

export function validatePassword(password: string | undefined | null): ValidationResult {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  const trimmedPassword = password.trim();
  if (trimmedPassword.length === 0) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (trimmedPassword.length < 6) {
    errors.push('Password must be at least 6 characters long');
    return { isValid: false, errors };
  }
  
  return { isValid: true, errors };
}

const Validation = { validateEmail, validatePassword };
export default Validation;
