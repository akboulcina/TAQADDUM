let stopping = false;
const log = (event: string) => console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', service: 'worker', event }));
const stop = () => { if (stopping) return; stopping = true; log('worker_stopped'); process.exit(0); };
process.on('SIGTERM', stop); process.on('SIGINT', stop); log('worker_started');
setInterval(() => undefined, 1000).unref();
