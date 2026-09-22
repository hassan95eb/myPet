import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PetPlaceholder } from '../PetPlaceholder';

const mockClose = vi.fn().mockResolvedValue(undefined);

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    close: mockClose,
  }),
}));

describe('PetPlaceholder', () => {
  it('renders the DeskBuddy placeholder text correctly', () => {
    render(<PetPlaceholder />);
    expect(screen.getByText('DeskBuddy')).toBeInTheDocument();
    expect(screen.getByText('Step 01 Shell')).toBeInTheDocument();
  });

  it('contains the native tauri drag region attribute', () => {
    const { container } = render(<PetPlaceholder />);
    const dragElement = container.querySelector('[data-tauri-drag-region]');
    expect(dragElement).not.toBeNull();
  });

  it('triggers window close when the dev close button is clicked', async () => {
    render(<PetPlaceholder />);
    const closeBtn = screen.getByRole('button', { name: /close deskbuddy/i });
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
