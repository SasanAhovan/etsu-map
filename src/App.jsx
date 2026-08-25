import { useMemo, useState } from 'react';

const PDF_MAP = 'https://www.etsu.edu/ehome/documents/etsu-campusmap.pdf#toolbar=0&navpanes=0&scrollbar=0&view=FitH';

const buildings = [
  { id: '92', name: 'D.P. Culp Student Center', category: 'Student Life', x: 34, y: 48 },
  { id: '320', name: 'Sherrod Library', category: 'Academic', x: 55, y: 35 },
  { id: '910', name: 'Martin Center for the Arts', category: 'Arts', x: 72, y: 55 },
  { id: '904a', name: 'Niswonger Digital Media Center', category: 'Academic', x: 63, y: 42 },
  { id: '201', name: 'Gilbreath Hall', category: 'Academic', x: 47, y: 43 },
  { id: '202', name: 'Brown Hall', category: 'Academic', x: 43, y: 57 },
];

function App() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return buildings;
    return buildings.filter((b) => `${b.id} ${b.name} ${b.category}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark">ETSU</div><div><div className="brand-title">Campus Map</div><div className="brand-subtitle">East Tennessee State University</div></div></div>
        <div className="search-wrap"><span className="search-icon">⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search buildings, offices, rooms..." aria-label="Search campus" />{query && <button className="clear-button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}</div>
      </header>
      <section className="workspace">
        <aside className="search-panel">
          <span className="eyebrow">Explore ETSU</span><h1>Find your way around campus</h1>
          <p className="intro">Official ETSU campus map with interactive building information.</p>
          <div className="map-source">Official ETSU campus map</div>
          <div className="results-heading"><span>{query ? 'Search results' : 'Buildings'}</span><span>{results.length}</span></div>
          <div className="building-list">{results.map((building) => <button key={building.id} className={`building-card ${selected?.id === building.id ? 'selected' : ''}`} onClick={() => setSelected(building)}><span className="building-number">{building.id}</span><span className="building-copy"><strong>{building.name}</strong><small>{building.category}</small></span><span className="chevron">›</span></button>)}{!results.length && <div className="empty">No campus locations found.</div>}</div>
        </aside>
        <section className="map-area" aria-label="Official ETSU campus map">
          <iframe className="pdf-map" title="Official ETSU Campus Map" src={PDF_MAP} />
          <div className="pdf-overlay">{buildings.map((building) => <button key={building.id} className={`building-hotspot ${selected?.id === building.id ? 'active' : ''}`} style={{ left: `${building.x}%`, top: `${building.y}%` }} onClick={() => setSelected(building)} aria-label={`Select ${building.name}`} title={building.name}><span>{building.id}</span></button>)}</div>
          {selected && <article className="building-detail"><button className="detail-close" onClick={() => setSelected(null)} aria-label="Close">×</button><div className="detail-icon">{selected.id}</div><div className="detail-content"><span className="detail-number">BUILDING {selected.id}</span><h2>{selected.name}</h2><p>{selected.category} · ETSU Main Campus</p><div className="detail-actions"><button className="primary-action" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.name + ', East Tennessee State University')}`, '_blank')}>↗ Get directions</button><button className="secondary-action" onClick={() => setSelected(null)}>Close</button></div></div></article>}
          <div className="map-attribution">Official ETSU campus map</div>
        </section>
      </section>
    </main>
  );
}
export default App;
