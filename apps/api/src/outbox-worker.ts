export type OutboxEvent = { id: string; event_type: string; published_at?: string | null; publish_attempts: number; last_error?: string | null };
export function simulateOutboxPublish(events: OutboxEvent[], now = new Date().toISOString()) { return events.map((event) => event.published_at ? event : { ...event, published_at: now, publish_attempts: event.publish_attempts + 1, last_error: null }); }
