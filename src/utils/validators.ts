export type SignupValidationInput = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase());
}

export function isValidUsername(value: string): boolean {
  return /^[a-zA-Z0-9_]+$/.test(value);
}

export function isStrongEnoughPassword(value: string): boolean {
  return value.length >= 6;
}

export function arePasswordsMatching(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}

export function validateSignInIdentifier(identifier: string): {
  isEmail: boolean;
  valid: boolean;
  message?: string;
} {
  const normalized = identifier.trim();
  const isEmail = normalized.includes('@');

  if (isEmail && !isValidEmail(normalized)) {
    return {
      isEmail,
      valid: false,
      message: 'Please enter a valid email address',
    };
  }

  if (!normalized) {
    return {
      isEmail,
      valid: false,
      message: 'Please enter your email or username',
    };
  }

  return {
    isEmail,
    valid: true,
  };
}

export function validateSignupForm(input: SignupValidationInput): {
  valid: boolean;
  message?: string;
  field?: keyof SignupValidationInput;
} {
  if (!isValidUsername(input.username)) {
    return {
      valid: false,
      field: 'username',
      message: 'Username can only contain letters, numbers, and underscores',
    };
  }

  if (input.username.length < 3) {
    return {
      valid: false,
      field: 'username',
      message: 'Username must be at least 3 characters long',
    };
  }

  if (!input.email.trim()) {
    return {
      valid: false,
      field: 'email',
      message: 'Email is required',
    };
  }

  if (!isValidEmail(input.email)) {
    return {
      valid: false,
      field: 'email',
      message: 'Please enter a valid email address',
    };
  }

  if (!isStrongEnoughPassword(input.password)) {
    return {
      valid: false,
      field: 'password',
      message: 'Password must be at least 6 characters long',
    };
  }

  if (!arePasswordsMatching(input.password, input.confirmPassword)) {
    return {
      valid: false,
      field: 'confirmPassword',
      message: 'Passwords do not match',
    };
  }

  return {
    valid: true,
  };
}

export function mapAuthErrorMessage(message: string): string {
  if (message.includes('already') || message.includes('exist')) {
    return 'This username is already taken. Please choose a different username or sign in if you already have an account.';
  }

  if (message.includes('Invalid') || message.includes('credentials')) {
    return 'Invalid username or password. Please check your credentials and try again.';
  }

  if (message.includes('not found')) {
    return 'Account not found. Please check your username or sign up for a new account.';
  }

  if (message.includes('Email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }

  if (message.includes('email')) {
    return 'Email address is invalid or already in use.';
  }

  if (message.includes('password')) {
    return 'Password does not meet requirements. Use at least 6 characters.';
  }

  return message;
}
