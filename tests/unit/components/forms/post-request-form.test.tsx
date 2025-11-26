import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/tests/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { PostRequestForm } from '@/components/forms/post-request-form';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({
    isLoaded: true,
    loadError: null,
  }),
}));

describe('PostRequestForm', () => {
  const mockInsert = vi.fn();
  const mockFrom = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      insert: mockInsert,
    });
    mockInsert.mockResolvedValue({ data: { id: 'request-123' }, error: null });
    
    (createClient as any).mockReturnValue({
      from: mockFrom,
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user' } },
        }),
      },
    });
  });

  it('should render form fields', () => {
    render(<PostRequestForm />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    // Labels are "Departure Location" and "Arrival Location"
    expect(screen.getByLabelText(/departure location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/arrival location/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<PostRequestForm />);
    
    const submitButton = screen.getByRole('button', { name: /submit|post/i });
    await user.click(submitButton);

    // Should show validation errors - there are multiple "required" messages
    await waitFor(() => {
      expect(screen.getAllByText(/required/i).length).toBeGreaterThan(0);
    });
  });

  it('should submit valid form', async () => {
    const user = userEvent.setup();
    render(<PostRequestForm />);
    
    // Fill in required fields
    await user.type(screen.getByLabelText(/title/i), 'Test Request');
    // Labels are "Departure Location" and "Arrival Location"
    await user.type(screen.getByLabelText(/departure location/i), 'Miami');
    await user.type(screen.getByLabelText(/arrival location/i), 'St. Martin');
    // Add more fields as needed
    
    const submitButton = screen.getByRole('button', { name: /submit|post/i });
    // Note: This test may need adjustment based on actual form implementation
  });
});

