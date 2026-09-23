export type ApplicationOpenedEvent = {
  type: 'application.opened';
  occurredAt: number;
  payload: {
    applicationName: string;
  };
};

export type ApplicationClosedEvent = {
  type: 'application.closed';
  occurredAt: number;
  payload: {
    applicationName: string;
  };
};

export type NetworkOnlineEvent = {
  type: 'network.online';
  occurredAt: number;
};

export type NetworkOfflineEvent = {
  type: 'network.offline';
  occurredAt: number;
};

export type UserIdleEvent = {
  type: 'user.idle';
  occurredAt: number;
};

export type UserActiveEvent = {
  type: 'user.active';
  occurredAt: number;
};

export type DomainEvent =
  | ApplicationOpenedEvent
  | ApplicationClosedEvent
  | NetworkOnlineEvent
  | NetworkOfflineEvent
  | UserIdleEvent
  | UserActiveEvent;

export type DomainEventType = DomainEvent['type'];
