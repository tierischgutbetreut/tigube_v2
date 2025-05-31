import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PawPrint as Paw, Eye, EyeOff } from 'lucide-react';
import Button from '../components/ui/Button';

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would handle authentication
    console.log({ email, password, rememberMe });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center">
          <Paw className="h-10 w-10 text-primary-500" />
          <span className="ml-2 text-2xl font-bold">PetPal</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to your account to continue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember_me"
                  name="remember_me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
              >
                Sign in
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div>
                <a
                  href="#"
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M22.0367422,12.0772727 C22.0367422,11.3318487 21.9726855,10.6155195 21.8535621,9.92727273 L12.2367422,9.92727273 L12.2367422,13.5011364 L17.6853801,13.5011364 C17.4367422,14.7011364 16.7367422,15.6999432 15.6580165,16.3613636 L15.6580165,18.8181818 L19.0139752,18.8181818 C21.0004928,16.9629545 22.0367422,14.7272727 22.0367422,12.0772727 L22.0367422,12.0772727 Z"
                      clipRule="evenodd"
                    />
                    <path
                      fillRule="evenodd"
                      d="M12.2367422,22 C15.0367422,22 17.3872596,21.0045455 19.0139752,18.8181818 L15.6580165,16.3613636 C14.7367422,17.0011364 13.5649928,17.375 12.2367422,17.375 C9.54037596,17.375 7.25855506,15.5488636 6.52628099,13.0909091 L3.06855506,13.0909091 L3.06855506,15.6363636 C4.68310187,19.3181818 8.19219324,22 12.2367422,22 L12.2367422,22 Z"
                      clipRule="evenodd"
                    />
                    <path
                      fillRule="evenodd"
                      d="M6.52628099,13.0909091 C6.31037596,12.4522727 6.19219324,11.7693182 6.19219324,11.0681818 C6.19219324,10.3670455 6.31037596,9.68409091 6.52628099,9.04545455 L6.52628099,6.5 L3.06855506,6.5 C2.39219324,7.88636364 1.99219324,9.42954545 1.99219324,11.0681818 C1.99219324,12.7068182 2.39219324,14.25 3.06855506,15.6363636 L6.52628099,13.0909091 L6.52628099,13.0909091 Z"
                      clipRule="evenodd"
                    />
                    <path
                      fillRule="evenodd"
                      d="M12.2367422,4.76136364 C13.7458983,4.76136364 15.0945801,5.27272727 16.1694206,6.30681818 L19.1399928,3.33636364 C17.3872596,1.70454545 15.0367422,0.75 12.2367422,0.75 C8.19219324,0.75 4.68310187,3.43181818 3.06855506,7.11363636 L6.52628099,9.65909091 C7.25855506,7.20113636 9.54037596,4.76136364 12.2367422,4.76136364 L12.2367422,4.76136364 Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>

              <div>
                <a
                  href="#"
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M10,0 C4.4771525,0 0,4.47593818 0,10 C0,14.4194126 2.86666667,18.1622278 6.83866667,19.4822278 C7.33866667,19.5732278 7.52,19.2732278 7.52,19.0073444 C7.52,18.7682278 7.51333333,18.1407611 7.51333333,17.303778 C5,17.741778 4.35333333,16.6562278 4.15333333,16.0800611 C4.03666667,15.7910611 3.55333333,14.9013944 3.13333333,14.6622778 C2.78,14.4700611 2.28,14.0322778 3.12,14.0253944 C3.92,14.0185111 4.49333333,14.7542778 4.68666667,15.0532278 C5.59333333,16.5544944 7.04,16.1184944 7.56,15.8527111 C7.65333333,15.1964944 7.91333333,14.7610611 8.2,14.5009778 C5.97333333,14.2408944 3.64666667,13.3831111 3.64666667,9.53553442 C3.64666667,8.43837775 4.03666667,7.53593442 4.7,6.82182218 C4.59333333,6.56964385 4.24666667,5.53935552 4.8,4.15826661 C4.8,4.15826661 5.64666667,3.89222275 7.52,5.18984495 C8.32,4.96584495 9.16,4.85384495 10,4.85384495 C10.84,4.85384495 11.68,4.96584495 12.48,5.18984495 C14.3533333,3.8853561 15.2,4.15826661 15.2,4.15826661 C15.7533333,5.53935552 15.4066667,6.56964385 15.3,6.82182218 C15.9633333,7.53593442 16.3533333,8.43153329 16.3533333,9.53553442 C16.3533333,13.3899944 14.02,14.2408944 11.7933333,14.5009778 C12.16,14.8204944 12.48,15.4446611 12.48,16.4097611 C12.48,17.7824944 12.4733333,18.6780611 12.4733333,19.0073444 C12.4733333,19.2732278 12.6533333,19.5800611 13.1533333,19.4822278 C15.1744,18.8183324 16.8833089,17.5292525 18.0577342,15.8309062 C19.2321594,14.1325598 19.8334462,12.0932482 19.8333333,10 C19.8333333,4.47593818 15.3561808,0 10,0 Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;