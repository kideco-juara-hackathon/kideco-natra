import { Gauge, Route, Truck, Wrench } from "lucide-react";

const items = [
  { label: "Overview", icon: Gauge },
  { label: "Route Intelligence", icon: Route },
  { label: "Hauling Darat", icon: Truck },
  { label: "Maintenance", icon: Wrench },
];

export function AppSidebar() {
  return (
    <aside className="app-sidebar">
      <div className="brand">
        <div className="brand-mark">KC</div>
        <div>
          <strong>Kideco</strong>
          <span>Logistics Control</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <button key={item.label} className="nav-item" type="button">
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
