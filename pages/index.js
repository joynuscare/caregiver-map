import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

// ──────────────────────────────────────────
// Constants
// ──────────────────────────────────────────
const MILES_TO_METERS = 1609.344;
const STRENGTH_OPTIONS = ['F', 'S', 'R', 'T', 'C', 'M'];
const STRENGTH_LABELS = { F: '음식', S: '중환자', R: '라이드', T: '통역', C: '청소', M: '남자' };
const FILTER_OPTIONS = [
  { key: 'F', label: '음식' },
  { key: 'S', label: '중환자' },
  { key: 'R', label: '라이드' },
  { key: 'T', label: '통역' },
  { key: 'C', label: '청소' },
  { key: 'M', label: '남자' },
];
const NEEDS_WORK_OPTIONS = ['Y', 'N', 'K', 'G'];
const ADMIN_OPTIONS = ['Kim', 'Park', 'Mika', 'Ryu'];
const DEFAULT_CG = { name: '', address: '', needsWork: 'N', strengths: [], memo: '', cgId: '', birthdate: '' };
const DEFAULT_CS = { name: '', address: '', admin: '', birthdate: '' };
const ADMIN_PASSWORD = '30071';
const LA_CENTER = { lat: 34.0522, lng: -118.2437 };
const POPUP_W = 260;

// ──────────────────────────────────────────
// Shared style helpers
// ──────────────────────────────────────────
const S = {
  sectionTitle: {
    fontSize: 11, fontWeight: 700, color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8,
  },
  sectionBox: {
    background: 'white', borderRadius: 10, padding: '12px 14px',
    marginBottom: 10, border: '1px solid #E5E7EB',
  },
  input: {
    width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB',
    borderRadius: 8, fontSize: 14, background: 'white', color: '#1F2937',
  },
  btnAdd: { padding: '5px 11px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  btnEdit: { padding: '5px 11px', background: '#EFF6FF', border: '1px solid #93C5FD', color: '#2563EB', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  btnDel: { padding: '5px 11px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
};

// ──────────────────────────────────────────
// Helper sub-components
// ──────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13 }}>
      <span style={{ color: '#9CA3AF', minWidth: 72, flexShrink: 0 }}>{label}:</span>
      <span style={{ fontWeight: highlight ? 700 : 400, color: highlight ? '#7C3AED' : '#1F2937', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 16, padding: 32, width: 500, maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 12px 48px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 22, color: '#1F2937' }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function LinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ──────────────────────────────────────────
// Caregiver form
// ──────────────────────────────────────────
function CaregiverForm({ data, onSave, onCancel }) {
  const [form, setForm] = useState({ ...data, strengths: [...(data.strengths || [])] });
  const age = calcAge(form.birthdate);

  const toggle = s =>
    setForm(p => ({
      ...p,
      strengths: p.strengths.includes(s) ? p.strengths.filter(x => x !== s) : [...p.strengths, s],
    }));

  return (
    <div>
      <Field label="이름">
        <input style={S.input} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="홍길동" />
      </Field>
      <Field label="ID (4자리 숫자)">
        <input style={S.input} type="number" min="1000" max="9999" value={form.cgId || ''} onChange={e => setForm(p => ({ ...p, cgId: e.target.value }))} placeholder="예: 3088" />
      </Field>
      <Field label="생년월일">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            style={{ ...S.input, flex: 1 }}
            type="date"
            value={form.birthdate || ''}
            onChange={e => setForm(p => ({ ...p, birthdate: e.target.value }))}
          />
          {age !== null && (
            <span style={{ fontSize: 15, fontWeight: 700, color: '#7C3AED', flexShrink: 0 }}>{age}세</span>
          )}
        </div>
      </Field>
      <Field label="주소">
        <input style={S.input} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="123 Main St, Los Angeles, CA" />
      </Field>
      <Field label="업무 필요 여부">
        <select style={S.input} value={form.needsWork} onChange={e => setForm(p => ({ ...p, needsWork: e.target.value }))}>
          {NEEDS_WORK_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </Field>
      <Field label="강점 (복수 선택)">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {STRENGTH_OPTIONS.map(s => (
            <button key={s} type="button" onClick={() => toggle(s)}
              style={{
                padding: '6px 14px', borderRadius: 8,
                border: `1.5px solid ${form.strengths.includes(s) ? '#7C3AED' : '#D1D5DB'}`,
                background: form.strengths.includes(s) ? '#7C3AED' : 'white',
                color: form.strengths.includes(s) ? 'white' : '#374151',
                cursor: 'pointer', fontWeight: 700, fontSize: 13,
              }}
            >
              {STRENGTH_LABELS[s]}
            </button>
          ))}
        </div>
      </Field>
      <Field label="메모">
        <textarea style={{ ...S.input, height: 80, resize: 'vertical' }} value={form.memo} onChange={e => setForm(p => ({ ...p, memo: e.target.value }))} placeholder="특이사항 등" />
      </Field>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <button style={{ ...S.btnEdit, padding: '10px 20px' }} onClick={onCancel}>취소</button>
        <button
          style={{ padding: '10px 20px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
          onClick={() => { if (!form.name || !form.address) return alert('이름과 주소를 입력해주세요.'); onSave(form); }}
        >저장</button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Customer form
// ──────────────────────────────────────────
function CustomerForm({ data, onSave, onCancel }) {
  const [form, setForm] = useState({ ...data });
  const age = calcAge(form.birthdate);

  return (
    <div>
      <Field label="이름">
        <input style={S.input} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="김철수" />
      </Field>
      <Field label="생년월일">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            style={{ ...S.input, flex: 1 }}
            type="date"
            value={form.birthdate || ''}
            onChange={e => setForm(p => ({ ...p, birthdate: e.target.value }))}
          />
          {age !== null && (
            <span style={{ fontSize: 15, fontWeight: 700, color: '#3B82F6', flexShrink: 0 }}>{age}세</span>
          )}
        </div>
      </Field>
      <Field label="주소">
        <input style={S.input} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="456 Oak Ave, Los Angeles, CA" />
      </Field>
      <Field label="담당 Admin">
        <select style={S.input} value={form.admin || ''} onChange={e => setForm(p => ({ ...p, admin: e.target.value }))}>
          <option value="">선택 안 함</option>
          {ADMIN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </Field>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <button style={{ ...S.btnEdit, padding: '10px 20px' }} onClick={onCancel}>취소</button>
        <button
          style={{ padding: '10px 20px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
          onClick={() => { if (!form.name || !form.address) return alert('이름과 주소를 입력해주세요.'); onSave(form); }}
        >저장</button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Main app
// ──────────────────────────────────────────
export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState('');

  const [customers, setCustomers] = useState([]);
  const [caregivers, setCaregivers] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);
  const [selectedCgIds, setSelectedCgIds] = useState([]);
  const [selectedCsIds, setSelectedCsIds] = useState([]);

  const [radii, setRadii] = useState(['5', '10', '']);
  const [activeFilter, setActiveFilter] = useState(null);

  const [cgModal, setCgModal] = useState({ open: false, mode: 'add', data: DEFAULT_CG });
  const [csModal, setCsModal] = useState({ open: false, mode: 'add', data: DEFAULT_CS });
  const [loading, setLoading] = useState('');
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [csSortOrder, setCsSortOrder] = useState('alpha');

  // Map refs
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const cgMarkers = useRef([]);
  const csMarker = useRef(null);
  const radiusCircles = useRef([]);
  const popupRef = useRef(null);

  // Keyboard search refs
  const cgSearchBuf = useRef('');
  const cgSearchTimer = useRef(null);
  const cgItemRefs = useRef({});
  const csSearchBuf = useRef('');
  const csSearchTimer = useRef(null);
  const csItemRefs = useRef({});

  // ── Persistence ────────────────────────
  useEffect(() => {
    try { const k = localStorage.getItem('cgmap_apikey'); if (k) setApiKey(k); } catch {}
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [c, cg] = await Promise.all([
          fetch('/api/customers').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
          fetch('/api/caregivers').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
        ]);
        setCustomers(Array.isArray(c) ? c : []);
        setCaregivers(Array.isArray(cg) ? cg : []);
      } catch {
        try {
          const c = localStorage.getItem('cgmap_customers');
          const cg = localStorage.getItem('cgmap_caregivers');
          if (c) setCustomers(JSON.parse(c));
          if (cg) setCaregivers(JSON.parse(cg));
        } catch {}
      } finally { setIsLoaded(true); }
    }
    load();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(customers) })
      .catch(() => { try { localStorage.setItem('cgmap_customers', JSON.stringify(customers)); } catch {} });
  }, [customers, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    fetch('/api/caregivers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(caregivers) })
      .catch(() => { try { localStorage.setItem('cgmap_caregivers', JSON.stringify(caregivers)); } catch {} });
  }, [caregivers, isLoaded]);

  // ── Close popup on outside click ────────
  useEffect(() => {
    if (!selectedCaregiver) return;
    const handleMouseDown = (e) => {
      if (popupRef.current?.contains(e.target)) return;
      if (mapRef.current?.contains(e.target)) return;
      setSelectedCaregiver(null);
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [selectedCaregiver]);

  // ── Load Google Maps ────────────────────
  useEffect(() => {
    if (!apiKey) return;
    if (typeof window !== 'undefined' && window.google?.maps) { setMapLoaded(true); return; }
    if (document.getElementById('cgmap-gmaps')) return;

    window.gm_authFailure = () => {
      localStorage.removeItem('cgmap_apikey');
      setApiKey(''); setMapLoaded(false);
      setMapError('API 키가 유효하지 않습니다. 다시 확인 후 입력해주세요.');
      mapInst.current = null;
      const s = document.getElementById('cgmap-gmaps');
      if (s) s.remove();
    };

    const script = document.createElement('script');
    script.id = 'cgmap-gmaps';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => {
      localStorage.removeItem('cgmap_apikey');
      setApiKey('');
      setMapError('Google Maps 로드에 실패했습니다. API 키를 확인해주세요.');
      mapInst.current = null;
    };
    document.head.appendChild(script);
  }, [apiKey]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInst.current) return;
    mapInst.current = new window.google.maps.Map(mapRef.current, { center: LA_CENTER, zoom: 11 });
    mapInst.current.addListener('click', () => setSelectedCaregiver(null));
  }, [mapLoaded]);

  // ── Marker color ──────────────────────
  const markerColor = useCallback(cg => {
    if (selectedCgIds.includes(cg.id)) return '#8B5CF6';
    if (cg.needsWork === 'Y') return '#EF4444';
    if (activeFilter && cg.strengths?.includes(activeFilter)) return '#111111';
    return '#FBBF24';
  }, [activeFilter, selectedCgIds]);

  // ── Render caregiver markers ────────────
  useEffect(() => {
    if (!mapInst.current) return;
    cgMarkers.current.forEach(m => m.setMap(null));
    cgMarkers.current = [];

    caregivers.forEach(cg => {
      if (cg.lat == null || cg.lng == null) return;
      if (cg.needsWork === 'G') return;

      const marker = new window.google.maps.Marker({
        position: { lat: cg.lat, lng: cg.lng },
        map: mapInst.current,
        title: cg.name,
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: markerColor(cg), fillOpacity: 0.92, strokeColor: '#fff', strokeWeight: 1.5 },
        zIndex: 5,
      });

      marker.addListener('click', (e) => {
        const mapRect = mapRef.current.getBoundingClientRect();
        setPopupPos({ x: e.domEvent.clientX - mapRect.left, y: e.domEvent.clientY - mapRect.top });
        setSelectedCaregiver(cg);
      });

      cgMarkers.current.push(marker);
    });
  }, [caregivers, activeFilter, mapLoaded, markerColor]);

  // ── Customer marker + radius circles ────
  useEffect(() => {
    if (!mapInst.current) return;
    if (csMarker.current) { csMarker.current.setMap(null); csMarker.current = null; }
    radiusCircles.current.forEach(c => c.setMap(null));
    radiusCircles.current = [];
    if (!selectedCustomer?.lat) return;

    const pos = { lat: selectedCustomer.lat, lng: selectedCustomer.lng };
    csMarker.current = new window.google.maps.Marker({
      position: pos, map: mapInst.current, title: selectedCustomer.name,
      icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#3B82F6', fillOpacity: 0.95, strokeColor: '#fff', strokeWeight: 2 },
      zIndex: 10,
    });
    mapInst.current.panTo(pos);

    radii.forEach(r => {
      const miles = parseFloat(r);
      if (!miles || isNaN(miles) || miles <= 0) return;
      radiusCircles.current.push(new window.google.maps.Circle({
        map: mapInst.current, center: pos, radius: miles * MILES_TO_METERS,
        strokeColor: '#3B82F6', strokeOpacity: 0.75, strokeWeight: 2,
        fillColor: '#3B82F6', fillOpacity: 0.04,
      }));
    });
  }, [selectedCustomer, radii, mapLoaded]);

  // ── Geocode ────────────────────────────
  const geocode = address =>
    new Promise((resolve, reject) => {
      new window.google.maps.Geocoder().geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const l = results[0].geometry.location;
          resolve({ lat: l.lat(), lng: l.lng() });
        } else reject(new Error(status));
      });
    });

  // ── CRUD: Caregiver ────────────────────
  const handleAddCg = async form => {
    setLoading('간병인 주소 검색 중...');
    try {
      const coords = await geocode(form.address);
      setCaregivers(p => [...p, { ...form, id: uid(), ...coords }].sort((a, b) => a.name.localeCompare(b.name)));
      setCgModal({ open: false, mode: 'add', data: DEFAULT_CG });
    } catch { alert('주소를 찾을 수 없습니다.'); }
    setLoading('');
  };

  const handleEditCg = async form => {
    setLoading('간병인 주소 검색 중...');
    try {
      const coords = await geocode(form.address);
      setCaregivers(p => p.map(cg => cg.id === form.id ? { ...form, ...coords } : cg).sort((a, b) => a.name.localeCompare(b.name)));
      if (selectedCaregiver?.id === form.id) setSelectedCaregiver({ ...form, ...coords });
      setCgModal({ open: false, mode: 'add', data: DEFAULT_CG });
    } catch { alert('주소를 찾을 수 없습니다.'); }
    setLoading('');
  };

  const handleDeleteCg = () => {
    if (!selectedCgIds.length) return alert('삭제할 간병인을 먼저 선택해주세요.');
    if (!confirm(`선택한 간병인 ${selectedCgIds.length}명을 삭제하시겠습니까?`)) return;
    setCaregivers(p => p.filter(cg => !selectedCgIds.includes(cg.id)));
    if (selectedCgIds.includes(selectedCaregiver?.id)) setSelectedCaregiver(null);
    setSelectedCgIds([]);
  };

  // ── CRUD: Customer ─────────────────────
  const handleAddCs = async form => {
    setLoading('고객 주소 검색 중...');
    try {
      const coords = await geocode(form.address);
      setCustomers(p => [...p, { ...form, id: uid(), ...coords }]);
      setCsModal({ open: false, mode: 'add', data: DEFAULT_CS });
    } catch { alert('주소를 찾을 수 없습니다.'); }
    setLoading('');
  };

  const handleEditCs = async form => {
    setLoading('고객 주소 검색 중...');
    try {
      const coords = await geocode(form.address);
      setCustomers(p => p.map(c => c.id === form.id ? { ...form, ...coords } : c));
      if (selectedCustomer?.id === form.id) setSelectedCustomer({ ...form, ...coords });
      setCsModal({ open: false, mode: 'add', data: DEFAULT_CS });
    } catch { alert('주소를 찾을 수 없습니다.'); }
    setLoading('');
  };

  const handleDeleteCs = () => {
    if (!selectedCsIds.length) return alert('삭제할 고객을 먼저 선택해주세요.');
    if (!confirm(`선택한 고객 ${selectedCsIds.length}명을 삭제하시겠습니까?`)) return;
    if (selectedCsIds.includes(selectedCustomer?.id)) setSelectedCustomer(null);
    setCustomers(p => p.filter(c => !selectedCsIds.includes(c.id)));
    setSelectedCsIds([]);
  };

  // ── CSV upload ─────────────────────────
  const handleCSV = async (file, type) => {
    setLoading('CSV 업로드 중...');
    try {
      const text = await file.text();
      const lines = text.trim().split('\n').filter(l => l.trim());
      if (lines.length < 2) { alert('데이터가 없습니다.'); setLoading(''); return; }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s/g, ''));
      const newItems = [];

      for (let i = 1; i < lines.length; i++) {
        const vals = splitCSVLine(lines[i]);
        const row = {};
        headers.forEach((h, idx) => (row[h] = (vals[idx] || '').trim()));
        if (!row.name || !row.address) continue;
        try {
          const coords = await geocode(row.address);
          if (type === 'customer') {
            newItems.push({ id: uid(), name: row.name, address: row.address, admin: row.admin || '', birthdate: row.birthdate || row.birthday || row.dob || '', ...coords });
          } else {
            const strengths = (row.strengths || '').toUpperCase().split('').filter(s => STRENGTH_OPTIONS.includes(s));
            newItems.push({
              id: uid(), name: row.name, address: row.address,
              needsWork: (row.needswork || row.needsWork || 'N').toUpperCase(),
              strengths, memo: row.memo || '',
              cgId: row.cgid || row.cgId || '',
              birthdate: row.birthdate || row.birthday || row.dob || '',
              ...coords,
            });
          }
        } catch { console.warn('Geocoding failed:', row.address); }
      }

      if (type === 'customer') setCustomers(newItems);
      else setCaregivers(newItems.sort((a, b) => a.name.localeCompare(b.name)));

      alert(`${newItems.length}건으로 교체되었습니다.`);
    } catch { alert('CSV 처리 중 오류가 발생했습니다.'); }
    setLoading('');
  };

  // ── Admin toggle ───────────────────────
  const handleAdminToggle = () => {
    if (adminMode) { setAdminMode(false); return; }
    const pw = prompt('비밀번호를 입력해주세요:');
    if (pw === null) return;
    if (pw === ADMIN_PASSWORD) setAdminMode(true);
    else alert('비밀번호가 틀렸습니다.');
  };

  // ── Keyboard search: caregiver ──────────
  const handleCgKey = (e) => {
    if (e.key === 'Escape') { cgSearchBuf.current = ''; return; }
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    cgSearchBuf.current += e.key.toLowerCase();
    const match = caregivers.find(cg => cg.name.toLowerCase().startsWith(cgSearchBuf.current));
    if (match) {
      cgItemRefs.current[match.id]?.scrollIntoView({ block: 'nearest' });
      setSelectedCgIds([match.id]);
      setPopupPos({ x: 20, y: 20 });
      setSelectedCaregiver(match);
    }
    clearTimeout(cgSearchTimer.current);
    cgSearchTimer.current = setTimeout(() => { cgSearchBuf.current = ''; }, 1500);
  };

  // ── Keyboard search: customer ───────────
  const handleCsKey = (e) => {
    if (e.key === 'Escape') { csSearchBuf.current = ''; return; }
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    csSearchBuf.current += e.key.toLowerCase();
    const match = sortedCustomers.find(c => c.name.toLowerCase().startsWith(csSearchBuf.current));
    if (match) {
      csItemRefs.current[match.id]?.scrollIntoView({ block: 'nearest' });
      setSelectedCsIds([match.id]);
      setSelectedCustomer(match);
    }
    clearTimeout(csSearchTimer.current);
    csSearchTimer.current = setTimeout(() => { csSearchBuf.current = ''; }, 1500);
  };

  // ── Derived lists ──────────────────────
  const sortedCustomers = [...customers].sort((a, b) => {
    if (csSortOrder === 'admin') {
      const adminCmp = (a.admin || 'zzz').localeCompare(b.admin || 'zzz');
      if (adminCmp !== 0) return adminCmp;
    }
    return a.name.localeCompare(b.name);
  });

  const needsWorkCaregivers = caregivers.filter(cg => cg.needsWork === 'Y');

  // ── API key screen ─────────────────────
  if (!apiKey) {
    return (
      <>
        <Head><title>간병인 지도 서비스</title></Head>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'linear-gradient(135deg, #EDE9FE 0%, #DBEAFE 100%)' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '48px 40px', maxWidth: 460, width: '90%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🗺️</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: '#1F2937' }}>안녕하세요!</h1>
            <p style={{ color: '#6B7280', marginBottom: 32, lineHeight: 1.7, fontSize: 15 }}>
              간병인 지도 서비스에 오신 것을 환영합니다.<br />시작하려면 Google Maps API 키를 입력해주세요.
            </p>
            <form onSubmit={e => { e.preventDefault(); if (!apiKeyInput.trim()) return; localStorage.setItem('cgmap_apikey', apiKeyInput.trim()); setApiKey(apiKeyInput.trim()); }}>
              <input style={{ ...S.input, padding: '13px 16px', fontSize: 14, marginBottom: 14, border: '1.5px solid #D1D5DB', borderRadius: 10 }} type="text" placeholder="Google Maps API Key" value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} autoFocus required />
              <button type="submit" style={{ width: '100%', padding: 14, background: '#7C3AED', color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>시작하기</button>
            </form>
            {mapError && <p style={{ marginTop: 16, color: '#DC2626', fontSize: 13 }}>{mapError}</p>}
          </div>
        </div>
      </>
    );
  }

  // ── Popup position ──────────────────────
  const mapAreaW = mapRef.current?.offsetWidth ?? 800;
  const mapAreaH = mapRef.current?.offsetHeight ?? 600;
  const showLeft = popupPos.x + POPUP_W + 20 > mapAreaW;
  const popupLeft = showLeft ? popupPos.x - POPUP_W - 12 : popupPos.x + 12;
  const popupTop = Math.min(Math.max(8, popupPos.y - 20), mapAreaH - 180);

  // ── Main layout ────────────────────────
  return (
    <>
      <Head><title>간병인 지도 서비스</title></Head>

      {loading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: 'white', padding: '24px 36px', borderRadius: 14, fontSize: 15, fontWeight: 600, color: '#374151', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>⏳ {loading}</div>
        </div>
      )}

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* ── Sidebar ──────────────────────── */}
        <div style={{ width: 300, height: '100vh', display: 'flex', flexDirection: 'column', borderRight: '1px solid #E5E7EB', background: '#F9FAFB', flexShrink: 0 }}>

          {/* Header */}
          <div style={{ padding: '16px 16px 10px', flexShrink: 0, borderBottom: '1px solid #E5E7EB', background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#1F2937' }}>🗺️ 간병인 지도</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  onClick={() => {
                    if (!selectedCaregiver || !selectedCustomer) return;
                    const origin = encodeURIComponent(selectedCaregiver.address);
                    const dest = encodeURIComponent(selectedCustomer.address);
                    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`, '_blank');
                  }}
                  title={selectedCaregiver && selectedCustomer ? `${selectedCaregiver.name} → ${selectedCustomer.name}` : '간병인과 고객을 각각 한 명씩 선택하세요'}
                  style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: `1px solid ${selectedCaregiver && selectedCustomer ? '#6EE7B7' : '#E5E7EB'}`, background: selectedCaregiver && selectedCustomer ? '#ECFDF5' : '#F9FAFB', color: selectedCaregiver && selectedCustomer ? '#059669' : '#D1D5DB', cursor: selectedCaregiver && selectedCustomer ? 'pointer' : 'default', fontWeight: 600 }}
                >
                  지도
                </button>
                <button onClick={handleAdminToggle} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: `1px solid ${adminMode ? '#F59E0B' : '#D1D5DB'}`, background: adminMode ? '#FEF3C7' : 'white', color: adminMode ? '#B45309' : '#6B7280', cursor: 'pointer', fontWeight: 600 }}>
                  {adminMode ? '관리 중 ✕' : '관리'}
                </button>
                <button onClick={() => { if (confirm('API 키를 초기화하시겠습니까?')) { localStorage.removeItem('cgmap_apikey'); setApiKey(''); setApiKeyInput(''); setMapLoaded(false); mapInst.current = null; } }} style={{ fontSize: 11, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}>키 변경</button>
              </div>
            </div>
          </div>

          {/* ── Scrollable content ──────────── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 16px' }}>

            {/* 1. 업무 필요 간병인 */}
            <div style={S.sectionBox}>
              <div style={S.sectionTitle}>업무 필요 간병인 ({needsWorkCaregivers.length})</div>
              {needsWorkCaregivers.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: 12 }}>없음</p>
              ) : (
                <div style={{ maxHeight: 130, overflowY: 'auto' }}>
                  {needsWorkCaregivers.map(cg => {
                    const age = calcAge(cg.birthdate);
                    return (
                      <div key={cg.id} style={{ padding: '4px 8px', borderRadius: 6, cursor: 'pointer', marginBottom: 3, background: selectedCgIds.includes(cg.id) ? '#F3E8FF' : '#FDF4FF', border: `1px solid ${selectedCgIds.includes(cg.id) ? '#C4B5FD' : '#E9D5FF'}`, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={e => {
                          if (e.ctrlKey || e.metaKey) { setSelectedCgIds(p => p.includes(cg.id) ? p.filter(id => id !== cg.id) : [...p, cg.id]); }
                          else { setSelectedCgIds([cg.id]); setPopupPos({ x: 20, y: 20 }); setSelectedCaregiver(cg); }
                        }}
                      >
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cg.name}</span>
                        {age !== null && <span style={{ fontSize: 10, color: '#6B7280', flexShrink: 0 }}>{age}</span>}
                        {cg.cgId && (
                          <a href={`https://2320.axiscare.com/?calendar.php&id=${cg.cgId}&type=2`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#9CA3AF', display: 'flex', alignItems: 'center', flexShrink: 0 }}><LinkIcon /></a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. 간병인 전체 — keyboard search enabled */}
            <div style={S.sectionBox}>
              <div style={S.sectionTitle}>간병인 전체 ({caregivers.length})</div>

              {adminMode && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <button style={S.btnAdd} onClick={() => setCgModal({ open: true, mode: 'add', data: DEFAULT_CG })}>추가</button>
                  <button style={S.btnEdit} onClick={() => { const cg = caregivers.find(c => c.id === selectedCgIds[0]); if (!cg) return alert('수정할 간병인을 먼저 선택해주세요.'); setCgModal({ open: true, mode: 'edit', data: { ...cg, strengths: [...(cg.strengths || [])] } }); }}>수정</button>
                  <button style={S.btnDel} onClick={handleDeleteCg}>삭제</button>
                </div>
              )}

              <div
                style={{ maxHeight: 200, overflowY: 'auto', marginBottom: adminMode ? 8 : 0, outline: 'none' }}
                tabIndex={0}
                onKeyDown={handleCgKey}
                title="클릭 후 알파벳 입력으로 검색"
              >
                {caregivers.length === 0 ? (
                  <p style={{ color: '#9CA3AF', fontSize: 12 }}>간병인이 없습니다</p>
                ) : (
                  caregivers.map(cg => {
                    const age = calcAge(cg.birthdate);
                    return (
                      <div
                        key={cg.id}
                        ref={el => { if (el) cgItemRefs.current[cg.id] = el; else delete cgItemRefs.current[cg.id]; }}
                        style={{ padding: '5px 9px', borderRadius: 6, cursor: 'pointer', marginBottom: 3, background: selectedCgIds.includes(cg.id) ? '#F3E8FF' : 'white', border: `1px solid ${selectedCgIds.includes(cg.id) ? '#C4B5FD' : '#E5E7EB'}`, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={e => {
                          if (e.ctrlKey || e.metaKey) { setSelectedCgIds(p => p.includes(cg.id) ? p.filter(id => id !== cg.id) : [...p, cg.id]); }
                          else { setSelectedCgIds([cg.id]); setPopupPos({ x: 20, y: 20 }); setSelectedCaregiver(cg); }
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: cg.needsWork === 'Y' ? '#EF4444' : '#FBBF24' }} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cg.name}</span>
                        {age !== null && <span style={{ fontSize: 10, color: '#6B7280', flexShrink: 0 }}>{age}</span>}
                        {cg.cgId && (
                          <a href={`https://2320.axiscare.com/?calendar.php&id=${cg.cgId}&type=2`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#9CA3AF', display: 'flex', alignItems: 'center', flexShrink: 0 }}><LinkIcon /></a>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {adminMode && (
                <label style={{ display: 'block', padding: '7px 12px', background: '#F3F4F6', border: '1px dashed #D1D5DB', borderRadius: 7, cursor: 'pointer', textAlign: 'center', fontSize: 12, color: '#6B7280' }}>
                  📁 CSV 업로드 (간병인)
                  <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) handleCSV(e.target.files[0], 'caregiver'); e.target.value = ''; }} />
                </label>
              )}
            </div>

            {/* 3. 간병인 필터 */}
            <div style={S.sectionBox}>
              <div style={S.sectionTitle}>간병인 필터</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
                {FILTER_OPTIONS.map(f => (
                  <button key={f.key} onClick={() => setActiveFilter(p => p === f.key ? null : f.key)}
                    style={{ flex: 1, padding: '5px 2px', borderRadius: 5, border: `1.5px solid ${activeFilter === f.key ? '#7C3AED' : '#D1D5DB'}`, cursor: 'pointer', fontSize: 11, fontWeight: 700, background: activeFilter === f.key ? '#7C3AED' : 'white', color: activeFilter === f.key ? 'white' : '#4B5563', whiteSpace: 'nowrap' }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. 고객 리스트 — keyboard search enabled */}
            <div style={{ ...S.sectionBox, marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={S.sectionTitle}>고객 리스트 ({customers.length})</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['abc', 'Admin'].map(key => (
                    <button key={key} onClick={() => setCsSortOrder(key === 'abc' ? 'alpha' : 'admin')}
                      style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, border: '1px solid', borderColor: (key === 'abc' ? csSortOrder === 'alpha' : csSortOrder === 'admin') ? '#7C3AED' : '#D1D5DB', background: (key === 'abc' ? csSortOrder === 'alpha' : csSortOrder === 'admin') ? '#7C3AED' : 'white', color: (key === 'abc' ? csSortOrder === 'alpha' : csSortOrder === 'admin') ? 'white' : '#6B7280', cursor: 'pointer', fontWeight: 600 }}
                    >{key}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>반경(mi)</span>
                {radii.map((r, i) => (
                  <input key={i} type="number" min="0" step="0.5" placeholder={i === 0 ? '5' : i === 1 ? '10' : '—'} value={r}
                    onChange={e => setRadii(p => { const n = [...p]; n[i] = e.target.value; return n; })}
                    style={{ width: 48, padding: '5px 4px', border: '1px solid #D1D5DB', borderRadius: 7, fontSize: 12, textAlign: 'center' }}
                  />
                ))}
              </div>

              <div
                style={{ maxHeight: 160, overflowY: 'auto', outline: 'none' }}
                tabIndex={0}
                onKeyDown={handleCsKey}
                title="클릭 후 알파벳 입력으로 검색"
              >
                {sortedCustomers.length === 0 ? (
                  <p style={{ color: '#9CA3AF', fontSize: 12 }}>고객이 없습니다</p>
                ) : (
                  sortedCustomers.map(c => {
                    const age = calcAge(c.birthdate);
                    return (
                      <div
                        key={c.id}
                        ref={el => { if (el) csItemRefs.current[c.id] = el; else delete csItemRefs.current[c.id]; }}
                        style={{ padding: '6px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 3, background: selectedCsIds.includes(c.id) ? '#DBEAFE' : 'white', border: `1px solid ${selectedCsIds.includes(c.id) ? '#93C5FD' : '#E5E7EB'}`, fontWeight: selectedCustomer?.id === c.id ? 700 : 400, color: '#1F2937', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={e => {
                          if (e.ctrlKey || e.metaKey) { setSelectedCsIds(p => p.includes(c.id) ? p.filter(id => id !== c.id) : [...p, c.id]); }
                          else { setSelectedCustomer(c); setSelectedCsIds([c.id]); }
                        }}
                      >
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {c.name}</span>
                        {age !== null && <span style={{ fontSize: 10, color: '#6B7280', flexShrink: 0 }}>{age}</span>}
                        {c.admin && <span style={{ fontSize: 10, color: '#7C3AED', background: '#F3E8FF', padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>{c.admin}</span>}
                      </div>
                    );
                  })
                )}
              </div>

              {adminMode && (
                <div style={{ marginTop: 10, borderTop: '1px solid #F3F4F6', paddingTop: 10 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <button style={S.btnAdd} onClick={() => setCsModal({ open: true, mode: 'add', data: DEFAULT_CS })}>추가</button>
                    <button style={S.btnEdit} onClick={() => { const c = customers.find(c => c.id === selectedCsIds[0]); if (!c) return alert('수정할 고객을 먼저 선택해주세요.'); setCsModal({ open: true, mode: 'edit', data: { ...c } }); }}>수정</button>
                    <button style={S.btnDel} onClick={handleDeleteCs}>삭제</button>
                  </div>
                  <label style={{ display: 'block', padding: '7px 12px', background: '#F3F4F6', border: '1px dashed #D1D5DB', borderRadius: 7, cursor: 'pointer', textAlign: 'center', fontSize: 12, color: '#6B7280' }}>
                    📁 CSV 업로드 (고객)
                    <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) handleCSV(e.target.files[0], 'customer'); e.target.value = ''; }} />
                  </label>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Map area ──────────────────────── */}
        <div style={{ flex: 1, position: 'relative' }}>
          {!mapLoaded && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6', zIndex: 1 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
              <p style={{ color: '#6B7280', fontSize: 15 }}>지도를 불러오는 중...</p>
            </div>
          )}
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

          {selectedCaregiver && (
            <div ref={popupRef}
              style={{ position: 'absolute', left: popupLeft, top: popupTop, zIndex: 20, background: 'white', borderRadius: 14, padding: '18px 20px', width: POPUP_W, boxShadow: '0 6px 28px rgba(0,0,0,0.18)', border: '1px solid #E5E7EB' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                  <strong
                    style={{ fontSize: 16, color: '#7C3AED', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    title="클릭하여 수정"
                    onClick={() => { const cg = selectedCaregiver; setSelectedCaregiver(null); setCgModal({ open: true, mode: 'edit', data: { ...cg, strengths: [...(cg.strengths || [])] } }); }}
                  >
                    {selectedCaregiver.name}
                  </strong>
                  {selectedCaregiver.cgId && (
                    <a href={`https://2320.axiscare.com/?calendar.php&id=${selectedCaregiver.cgId}&type=2`} target="_blank" rel="noopener noreferrer" title="AxisCare에서 보기" style={{ color: '#6B7280', display: 'flex', alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  )}
                </div>
                <button onClick={() => setSelectedCaregiver(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18, lineHeight: 1, marginLeft: 8, flexShrink: 0 }}>✕</button>
              </div>
              <InfoRow label="업무 필요" value={selectedCaregiver.needsWork} highlight={selectedCaregiver.needsWork === 'Y'} />
              <InfoRow label="강점" value={selectedCaregiver.strengths?.length ? selectedCaregiver.strengths.map(s => STRENGTH_LABELS[s] || s).join(', ') : '없음'} />
              {calcAge(selectedCaregiver.birthdate) !== null && (
                <InfoRow label="나이" value={`${calcAge(selectedCaregiver.birthdate)}세`} />
              )}
              {selectedCaregiver.memo && <InfoRow label="메모" value={selectedCaregiver.memo} />}
            </div>
          )}
        </div>
      </div>

      {cgModal.open && (
        <Modal title={cgModal.mode === 'add' ? '간병인 추가' : '간병인 수정'} onClose={() => setCgModal({ open: false, mode: 'add', data: DEFAULT_CG })}>
          <CaregiverForm data={cgModal.data} onSave={cgModal.mode === 'add' ? handleAddCg : handleEditCg} onCancel={() => setCgModal({ open: false, mode: 'add', data: DEFAULT_CG })} />
        </Modal>
      )}
      {csModal.open && (
        <Modal title={csModal.mode === 'add' ? '고객 추가' : '고객 수정'} onClose={() => setCsModal({ open: false, mode: 'add', data: DEFAULT_CS })}>
          <CustomerForm data={csModal.data} onSave={csModal.mode === 'add' ? handleAddCs : handleEditCs} onCancel={() => setCsModal({ open: false, mode: 'add', data: DEFAULT_CS })} />
        </Modal>
      )}
    </>
  );
}

// ──────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────
function calcAge(birthdate) {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}
