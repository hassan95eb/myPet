import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RivePetRenderer } from '../RivePetRenderer';

// Mock @rive-app/react-canvas
vi.mock('@rive-app/react-canvas', () => {
  return {
    useRive: vi.fn(({ onLoadError }) => {
      return {
        RiveComponent: (props: Record<string, unknown>) => (
          <div data-testid="rive-canvas-mock" {...props} />
        ),
        rive: {
          stateMachineInputs: vi.fn(() => [{ name: 'idle', fire: vi.fn() }]),
        },
        __triggerLoadError: onLoadError,
      };
    }),
    Layout: vi.fn(),
    Fit: { Contain: 'contain' },
    Alignment: { Center: 'center' },
  };
});

describe('RivePetRenderer', () => {
  it('renders Rive canvas component when asset is loading', () => {
    render(<RivePetRenderer petState="idle" />);
    expect(screen.getByTestId('pet-renderer-container')).toBeInTheDocument();
    expect(screen.getByTestId('rive-canvas-mock')).toBeInTheDocument();
  });

  it('renders data-pet-state corresponding to domain state', () => {
    render(<RivePetRenderer petState="happy" />);
    const container = screen.getByTestId('pet-renderer-container');
    expect(container).toHaveAttribute('data-pet-state', 'happy');
  });
});
