import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../app/page';

describe('Home CTA buttons', () => {
  it('opens waitlist when plane button clicked', async () => {
    render(<Home />);
    const button = screen.getByRole('button', { name: /traveling by plane/i });
    await userEvent.click(button);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });
});
