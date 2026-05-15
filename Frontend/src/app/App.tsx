import React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <React.StrictMode>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} fallbackElement={<div>Loading...</div>} />
          <Toaster position="top-right" richColors toastOptions={{ style: { marginTop: '4rem' } }} />
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}