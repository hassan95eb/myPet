import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventSimulatorDevControl } from '../EventSimulatorDevControl';
import { domainEventBus } from '../../../../core/events/domain-event-bus.instance';

describe('EventSimulatorDevControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders simulator buttons in dev environment', () => {
    render(<EventSimulatorDevControl />);

    expect(screen.getByTestId('event-simulator-dev-control')).toBeInTheDocument();
    expect(screen.getByText('App Opened')).toBeInTheDocument();
    expect(screen.getByText('Net Online')).toBeInTheDocument();
    expect(screen.getByText('User Idle')).toBeInTheDocument();
  });

  it('publishes domain event when App Opened button is clicked', () => {
    const publishSpy = vi.spyOn(domainEventBus, 'publish');
    render(<EventSimulatorDevControl />);

    const appInput = screen.getByLabelText('App Name:');
    fireEvent.change(appInput, { target: { value: 'VS Code' } });

    const openBtn = screen.getByText('App Opened');
    fireEvent.click(openBtn);

    expect(publishSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'application.opened',
        payload: { applicationName: 'VS Code' },
      })
    );
  });

  it('publishes domain event when Net Offline button is clicked', () => {
    const publishSpy = vi.spyOn(domainEventBus, 'publish');
    render(<EventSimulatorDevControl />);

    const offlineBtn = screen.getByText('Net Offline');
    fireEvent.click(offlineBtn);

    expect(publishSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'network.offline',
      })
    );
  });

  it('updates last event display upon event publication', () => {
    render(<EventSimulatorDevControl />);

    const idleBtn = screen.getByText('User Idle');
    fireEvent.click(idleBtn);

    expect(screen.getByText(/user\.idle/)).toBeInTheDocument();
  });
});
