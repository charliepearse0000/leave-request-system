import LoginForm from './components/LoginForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Leave Request System
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in to your account
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
