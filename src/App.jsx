import { useMemo, useState } from 'react';

const buildings = [
  { id: '92', name: 'D.P. Culp Student Center', category: 'Student Life' },
  { id: '320', name: 'Sherrod Library', category: 'Academic' },
  { id: '910', name: 'Martin Center for the Arts', category: 'Arts' },
  { id: '904a', name: 'Niswonger Digital Media Center', category: 'Academic' },
  { id: '201', name: 'Gilbreath Hall', category: 'Academic' },
  { id: '202', name: 'Brown Hall', category: 'Academic' },
  { id: '203', name: 'Ball Hall', category: 'Academic' },
  { id: '204', name: 'Carter Hall', category: 'Academic' },
];

function App() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return buildings.slice(0, 6);
    return buildings.filter((building) =>
      `${building.name} ${building.id} ${building.category}`.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">ETSU</div>
          <div>
            <div className="brand-title">Campus Map</div>
            <div className="brand-subtitle">East Tennessee State University</div>
          </div>
        </div>

        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search buildings, offices, rooms..."
            aria-label="Search campus"
          />
          {query && <button className="clear-button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
        </div>
      </header>

      <section className="workspace">
        <aside className="search-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Explore ETSU</span>
              <h1>Find your way around campus</h1>
            </div>
          </div>

          <div className="quick-actions">
            <button>⌖<span>My location</span></button>
            <button>♿<span>Accessible</span></button>
            <button>☷<span>Categories</span></button>
          </div>

          <div className="results-heading">
            <span>{query ? 'Search results' : 'Popular buildings'}</span>
            <span>{results.length}</span>
          </div>

          <div className="building-list">
            {results.map((building) => (
              <button
                className={`building-card ${selected?.id === building.id ? 'selected' : ''}`}
                key={building.id}
                onClick={() => setSelected(building)}
              >
                <span className="building-number">{building.id}</span>
                <span className="building-copy">
                  <strong>{building.name}</strong>
                  <small>{building.category}</small>
                </span>
                <span className="chevron">›</span>
              </button>
            ))}
            {!results.length && <div className="empty">No campus locations found.</div>}
          </div>
        </aside>

        <section className="map-area" aria-label="ETSU interactive map">
          <div className="map-placeholder">
            <div className="map-grid" />
            <div className="map-road road-a" />
            <div className="map-road road-b" />
            <div className="map-road road-c" />
            <div className="map-water" />

            <div className="map-label label-library">SHERROD LIBRARY</div>
            <div className="map-label label-culp">CULP STUDENT CENTER</div>
            <div className="map-label label-martin">MARTIN CENTER</div>

            {buildings.slice(0, 6).map((building, index) => (
              <button
                key={building.id}
                className={`map-pin pin-${index + 1} ${selected?.id === building.id ? 'active' : ''}`}
                onClick={() => setSelected(building)}
                aria-label={building.name}
              >
                <span>{building.id}</span>
              </button>
            ))}

            <div className="you-are-here" title="Your location">●</div>
            <div className="map-attribution">ETSU Campus Map · Prototype</div>
          </div>

          <div className="map-controls">
            <button aria-label="Zoom in">+</button>
            <button aria-label="Zoom out">−</button>
          </div>

          {selected && (
            <article className="building-detail">
              <button className="detail-close" onClick={() => setSelected(null)} aria-label="Close">×</button>
              <div className="photo-placeholder">
                <span>Building photo</span>
              </div>
              <div className="detail-content">
                <span className="detail-number">BUILDING {selected.id}</span>
                <h2>{selected.name}</h2>
                <p>{selected.category} · ETSU Main Campus</p>
                <div className="detail-actions">
                  <button className="primary-action">↗ Get directions</button>
                  <button className="secondary-action">More info</button>
                </div>
              </div>
            </article>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
