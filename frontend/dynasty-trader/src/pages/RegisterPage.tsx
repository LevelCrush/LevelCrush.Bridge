import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { FormField, Input, PasswordStrength } from '@/components/FormField';
import { 
  validateEmail, 
  validatePassword, 
  validateUsername, 
  getPasswordStrength 
} from '@/utils/validation';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [touched, setTouched] = useState<{
    email?: boolean;
    username?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
  }>({});
  const [passwordStrength, setPasswordStrength] = useState<{
    strength: 'weak' | 'medium' | 'strong';
    score: number;
    suggestions: string[];
  }>({ strength: 'weak', score: 0, suggestions: [] });

  // Update password strength when password changes
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(getPasswordStrength(formData.password));
    }
  }, [formData.password]);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }
    
    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.error;
    }
    
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error;
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: keyof typeof formData) => {
    setTouched({ ...touched, [field]: true });
    
    const newErrors = { ...errors };
    
    switch (field) {
      case 'email':
        const emailValidation = validateEmail(formData.email);
        newErrors.email = emailValidation.error;
        break;
      case 'username':
        const usernameValidation = validateUsername(formData.username);
        newErrors.username = usernameValidation.error;
        break;
      case 'password':
        const passwordValidation = validatePassword(formData.password);
        newErrors.password = passwordValidation.error;
        break;
      case 'confirmPassword':
        if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear error when user starts typing
    if (touched[field] && errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Special handling for confirm password
    if (field === 'confirmPassword' && touched.confirmPassword) {
      if (value && formData.password && value !== formData.password) {
        setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: undefined }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      email: true,
      username: true,
      password: true,
      confirmPassword: true,
    });
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });
      toast.success('Account created! Welcome to Dynasty Trader!');
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      
      // If it's a validation error from server, show it on the appropriate field
      if (error.response?.status === 400 && error.response?.data?.field) {
        setErrors(prev => ({ 
          ...prev, 
          [error.response.data.field]: error.response.data.message 
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-display font-bold text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-dynasty-400 hover:text-dynasty-300"
            >
              sign in to existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <FormField
              label="Email address"
              error={touched.email ? errors.email : undefined}
              required
            >
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                error={touched.email && !!errors.email}
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
              />
            </FormField>
            
            <FormField
              label="Username"
              error={touched.username ? errors.username : undefined}
              required
            >
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Choose a username"
                error={touched.username && !!errors.username}
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                onBlur={() => handleBlur('username')}
              />
              <p className="text-xs text-gray-400 mt-1">This will be your account username</p>
            </FormField>
            
            <FormField
              label="Password"
              error={touched.password ? errors.password : undefined}
              required
            >
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a strong password"
                error={touched.password && !!errors.password}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
              />
              <PasswordStrength 
                strength={passwordStrength.strength} 
                show={formData.password.length > 0}
              />
              {formData.password && passwordStrength.suggestions.length > 0 && (
                <div className="mt-2 text-xs text-gray-400">
                  <p className="font-medium mb-1">To improve your password:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {passwordStrength.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </FormField>
            
            <FormField
              label="Confirm password"
              error={touched.confirmPassword ? errors.confirmPassword : undefined}
              required
            >
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                error={touched.confirmPassword && !!errors.confirmPassword}
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
              />
            </FormField>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || Object.keys(errors).some(key => touched[key as keyof typeof touched] && errors[key as keyof typeof errors])}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}