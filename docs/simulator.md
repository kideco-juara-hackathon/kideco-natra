# Telemetry Simulator

The simulator produces IoT-like vehicle telemetry for demo and development.

## Initial Transport

HTTP POST is used for MVP simplicity.

```text
simulator -> POST /api/telemetry -> backend -> frontend
```

## Roadmap

MQTT, pub/sub, LoRa gateway, and direct Safebox integration can be added after the core route and dashboard flows are running.

## Scenarios

- `normal`: vehicle moves with normal speed and health.
- `overspeed`: speed exceeds safety threshold.
- `high-temp`: engine temperature rises.
- `high-vibration`: vibration rises and health risk increases.
- `route-delay`: speed drops and ETA shifts.
- `idle-waiting`: vehicle remains idle too long.
