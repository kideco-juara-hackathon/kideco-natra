import { createRoutePlan } from "../lib/api";

export function HaulingRouteIntelligence() {
  async function handleCreateRoute() {
    const result = await createRoutePlan({
      vehicleId: "DT-01",
      originNodeId: "DISPATCH-01",
      destinationNodeId: "LP-ROTO-S-01",
      loadState: "Empty",
    });
    console.log(result);
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>Route Intelligence</h1>
        <button type="button" onClick={handleCreateRoute}>
          Generate Route
        </button>
      </header>

      <div className="dashboard-grid">
        <article className="panel map-panel">
          <h2>Simulation Map</h2>
          <div className="map-placeholder">OSM map layer will render here.</div>
        </article>
        <article className="panel">
          <h2>Route Recommendation</h2>
          <p>Select a truck and destination to calculate ETA, fuel, and risk.</p>
        </article>
        <article className="panel">
          <h2>Telemetry</h2>
          <p>Latest vehicle telemetry will appear after simulator events are posted.</p>
        </article>
      </div>
    </section>
  );
}
