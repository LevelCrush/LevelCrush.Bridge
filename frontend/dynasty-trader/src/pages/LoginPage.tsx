import { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { FormField, Input } from '@/components/FormField';
import { validateEmail, validatePassword } from '@/utils/validation';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [touched, setTouched] = useState<{
    email?: boolean;
    password?: boolean;
  }>({});

  // Check for return URL in query params first, then location state
  const returnUrl = searchParams.get('return');
  const from = returnUrl || location.state?.from?.pathname || '/dashboard';

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }
    
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched({ ...touched, [field]: true });
    
    if (field === 'email') {
      const validation = validateEmail(formData.email);
      setErrors(prev => ({ ...prev, email: validation.error }));
    } else if (field === 'password') {
      const validation = validatePassword(formData.password);
      setErrors(prev => ({ ...prev, password: validation.error }));
    }
  };

  const handleChange = (field: 'email' | 'password', value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear error when user starts typing
    if (touched[field] && errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    setTouched({ email: true, password: true });
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      await login(formData);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid credentials';
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
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-dynasty-400 hover:text-dynasty-300"
            >
              create a new account
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
                placeholder="Enter your email"
                error={touched.email && !!errors.email}
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
              />
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
                autoComplete="current-password"
                placeholder="Enter your password"
                error={touched.password && !!errors.password}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
              />
            </FormField>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || (touched.email && !!errors.email) || (touched.password && !!errors.password)}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}