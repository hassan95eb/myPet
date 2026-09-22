import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PetRenderer } from '../components/PetRenderer';
import { PetDevControls } from '../components/PetDevControls';
import { usePetStore } from '../model/pet.store';

describe('PetRenderer', () => {
  beforeEach(() => {
    act(() => {
      usePetStore.setState({ state: 'idle' });
    });
  });

  it('renders idle state by default', () => {
    render(<PetRenderer />);
    const container = screen.getByTestId('pet-renderer-container');
    expect(container).toHaveAttribute('data-pet-state', 'idle');
    expect(screen.getByText('Idle')).toBeInTheDocument();
  });

  it('renders updated visual state when store changes', () => {
    render(<PetRenderer />);
    act(() => {
      usePetStore.getState().setState('sleeping');
    });

    const container = screen.getByTestId('pet-renderer-container');
    expect(container).toHaveAttribute('data-pet-state', 'sleeping');
    expect(screen.getByText('Sleeping')).toBeInTheDocument();
  });
});

describe('PetDevControls', () => {
  beforeEach(() => {
    act(() => {
      usePetStore.setState({ state: 'idle' });
    });
  });

  it('allows changing state via dropdown in DEV mode', () => {
    render(<PetDevControls />);
    const select = screen.getByRole('combobox', { name: /pet state controls/i });
    expect(select).toHaveValue('idle');

    fireEvent.change(select, { target: { value: 'angry' } });

    expect(usePetStore.getState().state).toBe('angry');
    expect(select).toHaveValue('angry');
  });
});
