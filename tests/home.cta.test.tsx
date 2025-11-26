import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/tests/utils/test-utils';
import userEvent from '@testing-library/user-event';
import Home from '@/app/page';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
  })),
}));

describe('Home CTA buttons', () => {
  it('navigates to login when plane button clicked', async () => {
    const user = userEvent.setup();
    render(<Home />);
    
    const button = screen.getByRole('button', { name: /traveling by plane/i });
    expect(button).toBeInTheDocument();
    
    await user.click(button);
    
    // Button should trigger navigation (mocked)
    expect(mockPush).toHaveBeenCalledWith('/auth/login?redirect=/home');
  });
});
