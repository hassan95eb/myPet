import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PetRenderer } from '../components/PetRenderer';
import { StaticPetFallback } from '../components/StaticPetFallback';
import { PetDevControls } from '../components/PetDevControls';
import { usePetStore } from '../model/pet.store';

describe('PetRenderer', () => {
  beforeEach(() => {
    act(() => {
      usePetStore.setState({ state: 'idle' });
    });
  });

  it('renders with idle state in Rive container by default', () => {
    render(<PetRenderer />);
    const container = screen.getByTestId('pet-renderer-container');
    expect(container).toHaveAttribute('data-pet-state', 'idle');
  });

  it('updates data-pet-state when store state changes', () => {
    render(<PetRenderer />);
    act(() => {
      usePetStore.getState().setState('sleeping');
    });

    const container = screen.getByTestId('pet-renderer-container');
    expect(container).toHaveAttribute('data-pet-state', 'sleeping');
  });
});

describe('StaticPetFallback', () => {
  it('renders static fallback with correct label and state attribute', () => {
    render(<StaticPetFallback petState="happy" />);
    const container = screen.getByTestId('pet-renderer-container');
    expect(container).toHaveAttribute('data-pet-state', 'happy');
    expect(screen.getByText('Happy')).toBeInTheDocument();
  });

  it('renders fallback for all pet states without crashing', () => {
    const states = ['idle', 'walking', 'sleeping', 'happy', 'angry', 'surprised', 'listening'] as const;
    states.forEach((state) => {
      const { unmount } = render(<StaticPetFallback petState={state} />);
      const container = screen.getByTestId('pet-renderer-container');
      expect(container).toHaveAttribute('data-pet-state', state);
      unmount();
    });
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
