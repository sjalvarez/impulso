'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { JCE_PARTIES, type JCEParty, type PartyId } from '@/lib/jce-parties';

export type { JCEParty, PartyId };
export { JCE_PARTIES };

const PARTIDOS = JCE_PARTIES.filter((p) => p.type === 'partido');
const MOVIMIENTOS = JCE_PARTIES.filter((p) => p.type === 'movimiento');

function PartyLogo({ id, abbr, size }: { id: string; abbr: string; size: number }) {
  const [err, setErr] = useState(false);
  if (err) return <div style={{ width: size, height: size, background: '#F6F6F4', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#2B2F36', flexShrink: 0 }}>{abbr.slice(0, 3)}</div>;
  return <Image src={`/images/party_logos/${id}.png`} alt={abbr} width={size} height={size} style={{ objectFit: 'contain', flexShrink: 0 }} onError={() => setErr(true)} />;
}

interface Props {
  value: PartyId | '';
  onChange: (id: PartyId | '') => void;
}

export default function PartySelector({ value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedParty = value ? JCE_PARTIES.find((p) => p.id === value) : null;
  const filtered = query.trim() ? JCE_PARTIES.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.abbr.toLowerCase().includes(query.toLowerCase())) : JCE_PARTIES;
  const filteredPartidos = filtered.filter((p) => p.type === 'partido');
  const filteredMovimientos = filtered.filter((p) => p.type === 'movimiento');
  const flatFiltered = [...filteredPartidos, ...filteredMovimientos];

  const select = useCallback((id: PartyId) => { onChange(id); setQuery(''); setOpen(false); setFocusedIndex(-1); }, [onChange]);
  const clear = useCallback(() => { onChange(''); setQuery(''); setFocusedIndex(-1); inputRef.current?.focus(); }, [onChange]);

  useEffect(() => {
    function handleClick(e: MouseEvent) { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const item = listRef.current.querySelectorAll('[data-option]')[focusedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { setOpen(true); return; }
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex((i) => Math.min(i + 1, flatFiltered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && focusedIndex >= 0) { e.preventDefault(); select(flatFiltered[focusedIndex].id); }
    else if (e.key === 'Escape') setOpen(false);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #E8E8E5', borderRadius: '6px', padding: '0 10px', height: '40px', background: 'white', cursor: 'text' }} onClick={() => { setOpen(true); inputRef.current?.focus(); }}>
        {selectedParty && !query && <PartyLogo id={selectedParty.id} abbr={selectedParty.abbr} size={20} />}
        <input ref={inputRef} value={selectedParty && !query ? selectedParty.name : query} onChange={(e) => { setQuery(e.target.value); setOpen(true); setFocusedIndex(-1); }} onFocus={() => setOpen(true)} onKeyDown={handleKeyDown} placeholder="Search party or movement…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', color: '#2B2F36', background: 'transparent', fontFamily: 'inherit' }} />
        {selectedParty && <button type="button" onClick={(e) => { e.stopPropagation(); clear(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#767676', fontSize: '16px', lineHeight: 1, padding: '0 2px' }}>×</button>}
      </div>
      {open && (
        <div ref={listRef} style={{ position: 'absolute', top: '44px', left: 0, right: 0, zIndex: 50, background: 'white', border: '1px solid #E8E8E5', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', maxHeight: '240px', overflowY: 'auto' }}>
          {filteredPartidos.length > 0 && <><div style={sectionHeaderStyle}>Partidos</div>{filteredPartidos.map((p) => { const idx = flatFiltered.indexOf(p); return <OptionRow key={p.id} party={p} focused={idx === focusedIndex} onSelect={() => select(p.id)} onHover={() => setFocusedIndex(idx)} />; })}</>}
          {filteredMovimientos.length > 0 && <><div style={sectionHeaderStyle}>Movimientos</div>{filteredMovimientos.map((p) => { const idx = flatFiltered.indexOf(p); return <OptionRow key={p.id} party={p} focused={idx === focusedIndex} onSelect={() => select(p.id)} onHover={() => setFocusedIndex(idx)} />; })}</>}
          {filteredPartidos.length === 0 && filteredMovimientos.length === 0 && <div style={{ padding: '16px 12px', fontSize: '13px', color: '#767676', textAlign: 'center' }}>No results</div>}
        </div>
      )}
      <p style={{ fontSize: '10px', color: '#767676', marginTop: '4px', marginBottom: 0 }}>Source: JCE Dirección de Partidos Políticos</p>
    </div>
  );
}

function OptionRow({ party, focused, onSelect, onHover }: { party: JCEParty; focused: boolean; onSelect: () => void; onHover: () => void }) {
  return (
    <div data-option onMouseDown={onSelect} onMouseEnter={onHover} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', cursor: 'pointer', background: focused ? '#F6F6F4' : 'white' }}>
      <PartyLogo id={party.id} abbr={party.abbr} size={24} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#2B2F36' }}>{party.name}</span>
        <span style={{ fontSize: '9px', color: '#767676', textTransform: 'capitalize' }}>{party.type}</span>
      </div>
    </div>
  );
}

const sectionHeaderStyle: React.CSSProperties = { fontSize: '10px', textTransform: 'uppercase', color: '#767676', letterSpacing: '0.08em', padding: '6px 12px', background: '#F6F6F4', fontWeight: 600 };

export { PARTIDOS, MOVIMIENTOS };
