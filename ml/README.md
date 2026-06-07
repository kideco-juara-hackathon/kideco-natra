# ML

Machine learning workspace for ETA, fuel, and maintenance experiments.

## First Target

Baseline ETA model for road segment travel time.

## Recommended Data Flow

```text
raw road segment CSV
        -> cleaning
        -> feature engineering
        -> train baseline model
        -> evaluate model
        -> export model artifact
```

## Notes

Do not commit raw internal datasets without explicit permission.
