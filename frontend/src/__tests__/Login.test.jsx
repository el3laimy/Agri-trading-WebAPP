import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Login from '../pages/Login';
import { AuthProvider } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock the context if needed, but wrapping in AuthProvider is better integration test
// However, AuthContext might make API calls on mount.
// Let's assume AuthProvider is safe or mock it.

const MockAuthProvider = ({ children }) => {
    return <div>{children}</div>
}

test('renders login page', () => {
  render(
    <AuthProvider>
        <BrowserRouter>
            <Login />
        </BrowserRouter>
    </AuthProvider>
  );
  // It might show "تسجيل الدخول" as a button or header.
  // Let's debug what's on screen if it fails, but usually Login page has this text.
  const linkElement = screen.getByRole('button', { name: /تسجيل الدخول/i });
  expect(linkElement).toBeInTheDocument();

  const emailInput = screen.getByPlaceholderText(/اسم المستخدم/i);
  expect(emailInput).toBeInTheDocument();
});
