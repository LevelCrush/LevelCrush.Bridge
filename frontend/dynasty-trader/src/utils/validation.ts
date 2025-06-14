// Validation utility functions for form inputs

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }
  
  return { isValid: true };
};

// Password strength checker
export const getPasswordStrength = (password: string): {
  strength: 'weak' | 'medium' | 'strong';
  score: number;
  suggestions: string[];
} => {
  let score = 0;
  const suggestions: string[] = [];
  
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  
  if (password.length < 8) suggestions.push('Use at least 8 characters');
  if (!/[a-z]/.test(password)) suggestions.push('Include lowercase letters');
  if (!/[A-Z]/.test(password)) suggestions.push('Include uppercase letters');
  if (!/[0-9]/.test(password)) suggestions.push('Include numbers');
  if (!/[^a-zA-Z0-9]/.test(password)) suggestions.push('Include special characters');
  
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 5) strength = 'strong';
  else if (score >= 3) strength = 'medium';
  
  return { strength, score, suggestions };
};

// Username validation
export const validateUsername = (username: string): ValidationResult => {
  if (!username || username.trim() === '') {
    return { isValid: false, error: 'Username is required' };
  }
  
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }
  
  if (username.length > 20) {
    return { isValid: false, error: 'Username must be 20 characters or less' };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, hyphens, and underscores' };
  }
  
  return { isValid: true };
};

// Name validation (for dynasty/character names)
export const validateName = (name: string, fieldName: string = 'Name'): ValidationResult => {
  if (!name || name.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters long` };
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, error: `${fieldName} must be 50 characters or less` };
  }
  
  if (!/^[a-zA-Z0-9\s'-]+$/.test(name)) {
    return { isValid: false, error: `${fieldName} can only contain letters, numbers, spaces, hyphens, and apostrophes` };
  }
  
  return { isValid: true };
};

// Price validation
export const validatePrice = (price: string | number): ValidationResult => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return { isValid: false, error: 'Please enter a valid price' };
  }
  
  if (numPrice <= 0) {
    return { isValid: false, error: 'Price must be greater than 0' };
  }
  
  if (numPrice > 999999) {
    return { isValid: false, error: 'Price cannot exceed 999,999' };
  }
  
  return { isValid: true };
};

// Quantity validation
export const validateQuantity = (
  quantity: string | number,
  max: number
): ValidationResult => {
  const numQuantity = typeof quantity === 'string' ? parseInt(quantity) : quantity;
  
  if (isNaN(numQuantity)) {
    return { isValid: false, error: 'Please enter a valid quantity' };
  }
  
  if (numQuantity < 1) {
    return { isValid: false, error: 'Quantity must be at least 1' };
  }
  
  if (numQuantity > max) {
    return { isValid: false, error: `Quantity cannot exceed ${max}` };
  }
  
  return { isValid: true };
};

// Motto validation (optional field)
export const validateMotto = (motto: string): ValidationResult => {
  if (motto && motto.length > 200) {
    return { isValid: false, error: 'Motto must be 200 characters or less' };
  }
  
  return { isValid: true };
};

// Generic required field validation
export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  return { isValid: true };
};