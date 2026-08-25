import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';

const CAMPUS_CENTER = [36.3014, -82.3699];
const CAMPUS_ZOOM = 16;

const SOURCES = {
  buildings: 'https://services5.arcgis.com/ZYK688A64hFRZ5yX/arcgis/rest/services/ETSU_Building_Footprints_(Editable)/FeatureServer/0/query',
  roads: 'https://services5.arcgis.com/ZYK688A64hFRZ5yX/arcgis/rest/services/ETSU_Campus_Roads_2_19_2024_WFL1/FeatureServer/0/query',
  sidewalks: 'https://services5.arcgis.com/ZYK688A64hFRZ5yX/arcgis/rest/services/ETSU_Sidewalks/FeatureServer/0/query',
  parking: 'https://services5.arcgis.com/ZYK688A64hFRZ5yX/arcgis/rest/services/ETSU_parking_lots/FeatureServer/0/query',
  trails: 'https://services5.arcgis.com/ZYK688A64hFRZ5yX/arcgis/rest/services/ETSU_Trails/FeatureServer/0/query',
};

const NAME_FIELDS = ['BUILDING_NAME', 'BLDG_NAME', 'BUILDING', 'NAME', 'FACILITY', 'DESCRIPTION', 'LOCATION'];
const NUMBER_FIELDS = ['BUILDING_NUMBER', 'BLDG_NUMBER', 'BUILDING_NO', 'BLDG_NO', 'BLDG_NUM', 'NUMBER', 'BUILDINGID', 'BUILDING_ID'];

function firstValue(properties, fields) {
  for (const field of fields) {
    const value = properties?.[field];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return '';
}

function normalizeBuilding(feature, index) {
  const properties = feature.properties || {};
  return {
    ...feature,
    properties: {
      ...properties,
      __name: firstValue(properties, NAME_FIELDS) || `ETSU Building ${index + 1}`,
      __number: firstValue(properties, NUMBER_FIELDS) || '',
    },
  };
}

async function loadLayer(url) {
  const params = new URLSearchParams({
    where: '1=1',
    outFields: '*',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'geojson',
  });
  const response = await fetch(`${url}?${params}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'ArcGIS error');
  return data;
}

function featureCollection(features) {
  return { type: 'FeatureCollection', features };
}

function App() {
  const mapElement = useRef(null);
  const map = useRef(null);
  const buildingLayer = useRef(null);
  const [layers, setLayers] = useState({ buildings: [], roads: [], sidewalks: [], parking: [], trails: [] });
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Loading official ETSU GIS data…');

  useEffect(() => {
    if (!mapElement.current || map.current) return;
    map.current = L.map(mapElement.current, { zoomControl: true, preferCanvas: true }).setView(CAMPUS_CENTER, CAMPUS_ZOOM);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map.current);
    return () => map.current?.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const entries = Object.entries(SOURCES);
      const results = await Promise.allSettled(entries.map(([, url]) => loadLayer(url)));
      if (cancelled) return;
      const next = { buildings: [], roads: [], sidewalks: [], parking: [], trails: [] };
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value.features)) next[entries[index][0]] = result.value.features;
      });
      next.buildings = next.buildings.map(normalizeBuilding);
      setLayers(next);
      const loaded = Object.entries(next).filter(([, items]) => items.length).map(([key]) => key);
      setMessage(loaded.length ? `Official ETSU GIS: ${loaded.join(' · ')}` : 'ETSU GIS layers could not be loaded');
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || loading) return;

    const roads = L.geoJSON(featureCollection(layers.roads), { style: { color: '#68747d', weight: 4, opacity: .75 } }).addTo(m);
    const sidewalks = L.geoJSON(featureCollection(layers.sidewalks), { style: { color: '#c49a58', weight: 2, opacity: .75, dashArray: '5 4' } }).addTo(m);
    const parking = L.geoJSON(featureCollection(layers.parking), { style: { color: '#87939e', weight: 1, fillColor: '#dce2e7', fillOpacity: .5 } }).addTo(m);
    const trails = L.geoJSON(featureCollection(layers.trails), { style: { color: '#4f875b', weight: 3, opacity: .8, dashArray: '7 5' } }).addTo(m);

    buildingLayer.current = L.geoJSON(featureCollection(layers.buildings), {
      style: feature => ({
        color: selected?.properties?.OBJECTID === feature?.properties?.OBJECTID ? '#041e42' : '#7c8792',
        weight: selected?.properties?.OBJECTID === feature?.properties?.OBJECTID ? 3 : 1.5,
        fillColor: selected?.properties?.OBJECTID === feature?.properties?.OBJECTID ? '#f4c542' : '#d8dee5',
        fillOpacity: .82,
      }),
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};
        layer.bindTooltip(`${p.__number ? `${p.__number} · ` : ''}${p.__name}`, { sticky: true });
        layer.on({
          click: () => { setSelected(feature); m.fitBounds(layer.getBounds(), { padding: [70, 70], maxZoom: 18 }); },
          mouseover: () => layer.setStyle({ weight: 3, fillOpacity: .95 }),
          mouseout: () => buildingLayer.current?.resetStyle(layer),
        });
      },
    }).addTo(m);

    return () => {
      [roads, sidewalks, parking, trails, buildingLayer.current].forEach(layer => layer && m.removeLayer(layer));
      buildingLayer.current = null;
    };
  }, [layers, loading, selected]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return layers.buildings.slice(0, 15);
    return layers.buildings.filter(feature => {
      const p = feature.properties || {};
      return `${p.__name} ${p.__number} ${Object.values(p).join(' ')}`.toLowerCase().includes(q);
    }).slice(0, 30);
  }, [layers.buildings, query]);

  function selectBuilding(feature) {
    setSelected(feature);
    const target = feature.properties?.OBJECTID;
    buildingLayer.current?.eachLayer(layer => {
      if (layer.feature?.properties?.OBJECTID === target) {
        map.current.fitBounds(layer.getBounds(), { padding: [80, 80], maxZoom: 18 });
        layer.openTooltip();
      }
    });
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">ETSU</div>
          <div><div className="brand-title">Campus Map</div><div className="brand-subtitle">East Tennessee State University</div></div>
        </div>
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search buildings, offices, rooms…" aria-label="Search campus" />
          {query && <button className="clear-button" onClick={() => setQuery('')} aria-label="Clear">×</button>}
        </div>
      </header>

      <section className="workspace">
        <aside className="search-panel">
          <span className="eyebrow">Official ETSU GIS</span>
          <h1>Find your way around campus</h1>
          <p className="intro">This map uses live ETSU GIS layers for campus features.</p>
          <div className={`status ${loading ? 'loading' : ''}`}><span />{message}</div>
          <div className="results-heading"><span>{query ? 'Matching buildings' : 'Campus buildings'}</span><span>{results.length}</span></div>
          <div className="building-list">
            {results.map((feature, i) => {
              const p = feature.properties || {};
              return <button className={`building-card ${selected?.properties?.OBJECTID === p.OBJECTID ? 'selected' : ''}`} key={p.OBJECTID ?? i} onClick={() => selectBuilding(feature)}>
                <span className="building-number">{p.__number || '—'}</span>
                <span className="building-copy"><strong>{p.__name}</strong><small>Official GIS footprint</small></span>
                <span className="chevron">›</span>
              </button>;
            })}
            {!loading && !results.length && <div className="empty">No buildings found.</div>}
          </div>
        </aside>

        <section className="map-area" aria-label="Official ETSU campus map">
          <div ref={mapElement} className="map-container" />
          <div className="legend">
            <div><i className="building-key" /> Buildings</div>
            <div><i className="road-key" /> Roads</div>
            <div><i className="sidewalk-key" /> Sidewalks</div>
            <div><i className="parking-key" /> Parking</div>
            <div><i className="trail-key" /> Trails</div>
          </div>
          {selected && <article className="building-detail">
            <button className="detail-close" onClick={() => setSelected(null)} aria-label="Close">×</button>
            <span className="detail-number">{selected.properties?.__number ? `BUILDING ${selected.properties.__number}` : 'ETSU BUILDING'}</span>
            <h2>{selected.properties?.__name}</h2>
            <p>Actual ETSU GIS building footprint</p>
            <button className="primary-action" onClick={() => map.current.fitBounds(L.geoJSON(selected).getBounds(), { padding: [80, 80], maxZoom: 18 })}>⌖ Locate building</button>
          </article>}
          <div className="map-attribution">ETSU GIS data · OpenStreetMap basemap</div>
        </section>
      </section>
    </main>
  );
}

export default App;
