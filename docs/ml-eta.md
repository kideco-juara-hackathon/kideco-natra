# ML ETA

## Objective

Build a baseline model to estimate road segment travel time.

## Recommended Target

```text
duration_sec
```

## Recommended Features

- `distance_m`
- `load_state`
- `shift`
- `hour_of_day`
- `traffic_level`
- `road_condition`
- `road_type`
- `speed_limit_kmh`
- `slope_level`
- `vehicle_class`

## Notes

Avoid using internal waypoint names and raw `StartX`/`StartY` as primary features for the MVP model. The model should learn general travel-time patterns that can be applied to the KIDECO simulation graph.
