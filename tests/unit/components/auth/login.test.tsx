import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/tests/utils/test-utils';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/auth/login/page';
import { supabase } from '@/tests/mocks/supabase/mockClient';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form', () => {
    render(<LoginPage />);
    expect(screen.getByText('Welcome to CarrySpace')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument();
  });

  it('should submit magic link form with email', async () => {
    const user = userEvent.setup();
    const signInSpy = vi.spyOn(supabase.auth, 'signInWithOtp');

    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send magic link/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(signInSpy).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          emailRedirectTo: expect.stringContaining('/auth/callback'),
        },
      });
    });
  });

  it('should show error message on failed login', async () => {
    const user = userEvent.setup();
    vi.spyOn(supabase.auth, 'signInWithOtp').mockResolvedValueOnce({
      data: {},
      error: { message: 'Invalid email' } as never,
    });

    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send magic link/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('should handle OAuth login', async () => {
    const user = userEvent.setup();
    const oauthSpy = vi.spyOn(supabase.auth, 'signInWithOAuth');

    render(<LoginPage />);
    
    const googleButton = screen.getByRole('button', { name: /google/i });
    await user.click(googleButton);

    await waitFor(() => {
      expect(oauthSpy).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
        },
      });
    });
  });
});

