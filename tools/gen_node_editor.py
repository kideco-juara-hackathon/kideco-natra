#!/usr/bin/env python3
"""Generate a standalone visual node editor (tools/node-editor.html).

Reads the current node coordinates + edge connectivity from
frontend/src/data/generated/hauling-seeds.ts and embeds them into a
self-contained HTML file (Leaflet from CDN). Open the HTML in a browser,
drag nodes, then "Copy coordinates" and paste the result back into the
seed files.

Re-run this script after editing the seeds to refresh the tool's starting
positions:  python tools/gen_node_editor.py
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEEDS = os.path.join(ROOT, "frontend", "src", "data", "generated", "hauling-seeds.ts")
OUT = os.path.join(ROOT, "tools", "node-editor.html")


def extract():
    src = open(SEEDS, "r", encoding="utf-8").read()
    nodes_block = src.split("export const dispatchSeedNodes")[1].split("] as const;")[0]
    nodes = []
    for o in re.findall(r"\{(.*?)\}", nodes_block, re.S):
        def g(key):
            m = re.search(r'"%s":\s*"?([^",\n]+)"?' % key, o)
            return m.group(1).strip().strip('"') if m else None
        nid = g("id")
        if not nid:
            continue
        nodes.append({
            "id": nid,
            "code": g("code"),
            "name": g("name"),
            "type": g("type"),
            "lat": float(g("visualLat")),
            "lng": float(g("visualLng")),
        })
    edges_block = src.split("export const dispatchSeedEdges")[1]
    edges = [
        {"from": f, "to": t, "type": ty}
        for f, t, ty in re.findall(
            r'"fromNodeId":\s*"([^"]+)",\s*"toNodeId":\s*"([^"]+)",\s*"type":\s*"([^"]+)"',
            edges_block,
        )
    ]
    return {"nodes": nodes, "edges": edges}


TEMPLATE = r'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>NATRA Node Editor</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
  #app { display: flex; height: 100vh; }
  #map { flex: 1; }
  #panel { width: 380px; background: #0d1321; color: #e2e8f0; display: flex; flex-direction: column; border-left: 1px solid #1e293b; }
  #panel header { padding: 14px 16px; border-bottom: 1px solid #1e293b; }
  #panel header h1 { font-size: 15px; margin: 0 0 4px; }
  #panel header p { font-size: 12px; margin: 0; color: #94a3b8; line-height: 1.4; }
  .toolbar { display: flex; gap: 8px; flex-wrap: wrap; padding: 12px 16px; border-bottom: 1px solid #1e293b; }
  button { font: inherit; font-size: 12px; padding: 7px 10px; border-radius: 6px; border: 1px solid #334155; background: #1e293b; color: #e2e8f0; cursor: pointer; }
  button:hover { background: #334155; }
  button.primary { background: #e81b2d; border-color: #e81b2d; color: #fff; }
  button.primary:hover { background: #cc1324; }
  #list { flex: 1; overflow-y: auto; padding: 8px 0; }
  .row { display: flex; align-items: center; gap: 8px; padding: 6px 16px; font-size: 12px; cursor: pointer; border-left: 3px solid transparent; }
  .row:hover { background: #1e293b; }
  .row.sel { background: #1e293b; border-left-color: #e81b2d; }
  .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; border: 1px solid #fff3; }
  .row .id { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .row .coord { font-family: ui-monospace, Consolas, monospace; color: #94a3b8; font-size: 11px; }
  #out { margin: 0; padding: 12px 16px; border-top: 1px solid #1e293b; }
  textarea { width: 100%; height: 110px; background: #060a12; color: #93c5fd; border: 1px solid #334155; border-radius: 6px; font-family: ui-monospace, Consolas, monospace; font-size: 11px; padding: 8px; resize: vertical; }
  .hint { font-size: 11px; color: #64748b; margin: 6px 0 0; }
  .node-label { background: rgba(13,19,33,.85); color: #fff; font-size: 10px; padding: 1px 5px; border-radius: 4px; border: none; white-space: nowrap; }
  .leaflet-marker-icon.node-handle { cursor: grab; }
</style>
</head>
<body>
<div id="app">
  <div id="map"></div>
  <div id="panel">
    <header>
      <h1>NATRA Node Editor</h1>
      <p>Drag any node on the map. Edges redraw live. When happy, <b>Copy coordinates</b> and paste into <code>hauling-seeds.ts</code> / <code>nodes.json</code>.</p>
    </header>
    <div class="toolbar">
      <button class="primary" id="copy">Copy coordinates</button>
      <button id="toggleLabels">Toggle labels</button>
      <button id="toggleTiles">Satellite</button>
      <button id="reset">Reset</button>
    </div>
    <div id="list"></div>
    <div id="out">
      <div class="hint">Paste a coordinates JSON here and click Load to re-seed the editor (use this to refresh after editing the seed files):</div>
      <textarea id="loadBox" placeholder='{ "DISPATCH-01": [-1.8649, 115.8864], ... }'></textarea>
      <button id="load" style="margin-top:8px;">Load coordinates</button>
    </div>
  </div>
</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const DATA = __PAYLOAD__;
const ORIGINAL = JSON.parse(JSON.stringify(DATA));

const NODE_COLOR = { dispatch:"#111827", pit:"#7C3AED", loading_point:"#0F766E", dump_point:"#EA580C", checkpoint:"#64748B" };
const EDGE_STYLE = {
  loaded_haul: { color:"#E81B2D", weight:3, opacity:.7 },
  empty_haul:  { color:"#2563EB", weight:2, opacity:.6, dashArray:"8 8" },
  connector:   { color:"#64748B", weight:2, opacity:.45, dashArray:"4 6" },
};

const byId = new Map(DATA.nodes.map(n => [n.id, n]));
let showLabels = true;
let satellite = false;

const map = L.map("map", { zoomControl: true });
const street = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap" });
const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: "&copy; Esri" });
street.addTo(map);

const edgeLayer = L.layerGroup().addTo(map);
const markers = new Map();

function fit() {
  const b = L.latLngBounds(DATA.nodes.map(n => [n.lat, n.lng]));
  map.fitBounds(b, { padding: [50, 50] });
}

function drawEdges() {
  edgeLayer.clearLayers();
  for (const e of DATA.edges) {
    const a = byId.get(e.from), b = byId.get(e.to);
    if (!a || !b) continue;
    L.polyline([[a.lat,a.lng],[b.lat,b.lng]], EDGE_STYLE[e.type] || EDGE_STYLE.connector).addTo(edgeLayer);
  }
}

function handleIcon(n) {
  const c = NODE_COLOR[n.type] || "#64748B";
  const size = (n.type==="dispatch"||n.type==="dump_point") ? 16 : (n.type==="loading_point"?13:11);
  return L.divIcon({
    className: "node-handle",
    html: '<div style="width:'+size+'px;height:'+size+'px;border-radius:50%;background:'+c+';border:2px solid #fff;box-shadow:0 0 0 1px #0006;"></div>',
    iconSize: [size, size], iconAnchor: [size/2, size/2],
  });
}

function makeMarkers() {
  markers.forEach(m => map.removeLayer(m));
  markers.clear();
  for (const n of DATA.nodes) {
    const m = L.marker([n.lat, n.lng], { draggable: true, icon: handleIcon(n) }).addTo(map);
    if (showLabels) m.bindTooltip(n.code, { permanent: true, direction: "right", className: "node-label", offset: [8,0] });
    m.on("drag", (ev) => {
      const ll = ev.target.getLatLng();
      n.lat = +ll.lat.toFixed(4); n.lng = +ll.lng.toFixed(4);
      drawEdges(); updateRow(n.id);
    });
    m.on("dragend", () => { renderList(); });
    m.on("click", () => selectRow(n.id));
    markers.set(n.id, m);
  }
}

const listEl = document.getElementById("list");
let selected = null;

function renderList() {
  listEl.innerHTML = "";
  for (const n of DATA.nodes) {
    const row = document.createElement("div");
    row.className = "row" + (n.id===selected ? " sel" : "");
    row.id = "row-" + n.id;
    row.innerHTML = '<span class="dot" style="background:'+(NODE_COLOR[n.type]||'#64748B')+'"></span>'
      + '<span class="id">'+n.code+'</span>'
      + '<span class="coord">'+n.lat.toFixed(4)+', '+n.lng.toFixed(4)+'</span>';
    row.onclick = () => { selectRow(n.id); const m = markers.get(n.id); if (m) map.panTo(m.getLatLng()); };
    listEl.appendChild(row);
  }
}
function updateRow(id) {
  const n = byId.get(id); const row = document.getElementById("row-"+id);
  if (n && row) row.querySelector(".coord").textContent = n.lat.toFixed(4)+', '+n.lng.toFixed(4);
}
function selectRow(id) { selected = id; renderList(); }

document.getElementById("copy").onclick = () => {
  const obj = {}; for (const n of DATA.nodes) obj[n.id] = [n.lat, n.lng];
  const text = JSON.stringify(obj, null, 2);
  navigator.clipboard.writeText(text).then(
    () => { const b = document.getElementById("copy"); b.textContent = "Copied!"; setTimeout(()=>b.textContent="Copy coordinates",1200); },
    () => { document.getElementById("loadBox").value = text; }
  );
};
document.getElementById("toggleLabels").onclick = () => { showLabels = !showLabels; makeMarkers(); };
document.getElementById("toggleTiles").onclick = (e) => {
  satellite = !satellite;
  if (satellite) { map.removeLayer(street); sat.addTo(map); e.target.textContent = "Street"; }
  else { map.removeLayer(sat); street.addTo(map); e.target.textContent = "Satellite"; }
};
document.getElementById("reset").onclick = () => {
  for (const n of DATA.nodes) { const o = ORIGINAL.nodes.find(x=>x.id===n.id); n.lat=o.lat; n.lng=o.lng; }
  makeMarkers(); drawEdges(); renderList();
};
document.getElementById("load").onclick = () => {
  try {
    const obj = JSON.parse(document.getElementById("loadBox").value);
    for (const n of DATA.nodes) if (obj[n.id]) { n.lat = +obj[n.id][0]; n.lng = +obj[n.id][1]; }
    makeMarkers(); drawEdges(); renderList(); fit();
  } catch (err) { alert("Invalid JSON: " + err.message); }
};

fit(); drawEdges(); makeMarkers(); renderList();
</script>
</body>
</html>
'''


def main():
    data = extract()
    html = TEMPLATE.replace("__PAYLOAD__", json.dumps(data, indent=2))
    open(OUT, "w", encoding="utf-8").write(html)
    print("Wrote %s (%d nodes, %d edges)" % (OUT, len(data["nodes"]), len(data["edges"])))


if __name__ == "__main__":
    main()
