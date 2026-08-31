import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Music, Loader, RefreshCw } from 'lucide-react';

// ---------- Helpers ----------

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) +
    ' (' + d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '') + ')';
}

function fmtTime(date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function isCommunionSunday(iso) {
  const d = new Date(iso);
  return d.getDay() === 0 && d.getDate() <= 7;
}

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos
const STALE_AFTER = 2 * 60 * 1000; // considera "velho" após 2 min fora da aba

// ---------- Componente principal ----------

export default function PBCStatsApp() {
  const [token, setToken] = useState(() => localStorage.getItem('pc_token'));
  const [activeTab, setActiveTab] = useState('insights');
  const [viewingPerson, setViewingPerson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [blockouts, setBlockouts] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const loadingRef = useRef(false);

  const logout = useCallback(() => {
    localStorage.removeItem('pc_token');
    setToken(null);
    setStats(null);
    setLastUpdated(null);
  }, []);

  const api = useCallback(async (path) => {
    const r = await fetch('/api/pc?path=' + encodeURIComponent(path), {
      headers: { Authorization: 'Bearer ' + token },
    });
    if (r.status === 401) {
      logout();
      throw new Error('Sessão expirada. Entre novamente.');
    }
    if (!r.ok) throw new Error('Erro na API (' + r.status + ')');
    return r.json();
  }, [token, logout]);

  // ---- Carregamento dos dados (usado no início e nos refreshes) ----
  const loadData = useCallback(async (silent = false) => {
    if (loadingRef.current || !token) return;
    loadingRef.current = true;

    try {
      if (silent) setRefreshing(true);
      else {
        setLoading(true);
        setError(null);
      }

      // 1. Tipos de culto
      if (!silent) setProgress('Buscando tipos de culto...');
      const st = await api('/services/v2/service_types');
      const serviceTypes = st.data || [];

      // 2. Planos (cultos) passados
      if (!silent) setProgress('Buscando cultos recentes...');
      let plans = [];
      for (const type of serviceTypes) {
        const p = await api(
          `/services/v2/service_types/${type.id}/plans?filter=past&order=-sort_date&per_page=30`
        );
        for (const plan of p.data || []) {
          plans.push({
            id: plan.id,
            serviceTypeId: type.id,
            serviceTypeName: type.attributes.name,
            date: plan.attributes.sort_date,
            title: plan.attributes.title,
          });
        }
      }
      plans.sort((a, b) => new Date(b.date) - new Date(a.date));
      plans = plans.slice(0, 40); // últimos ~40 cultos

      // 3. Músicas e escalações de cada culto (em lotes de 4)
      const records = [];
      for (let i = 0; i < plans.length; i += 4) {
        const batch = plans.slice(i, i + 4);
        if (!silent) setProgress(`Analisando cultos... ${Math.min(i + 4, plans.length)}/${plans.length}`);
        const results = await Promise.all(
          batch.map(async (plan) => {
            const [items, team] = await Promise.all([
              api(`/services/v2/service_types/${plan.serviceTypeId}/plans/${plan.id}/items?per_page=100`),
              api(`/services/v2/service_types/${plan.serviceTypeId}/plans/${plan.id}/team_members?per_page=100`),
            ]);
            return {
              ...plan,
              isCommunion: isCommunionSunday(plan.date),
              songs: (items.data || [])
                .filter((it) => it.attributes.item_type === 'song')
                .map((it) => it.attributes.title),
              team: (team.data || [])
                .filter((tm) => tm.attributes.status !== 'D')
                .map((tm) => ({
                  personId: tm.relationships?.person?.data?.id,
                  name: tm.attributes.name,
                  position: tm.attributes.team_position_name || 'Equipe',
                })),
            };
          })
        );
        records.push(...results);
      }

      // 4. Calcular estatísticas
      if (!silent) setProgress('Calculando estatísticas...');

      const songMap = {};
      const communionPlans = records.filter((r) => r.isCommunion);
      for (const rec of records) {
        for (const song of rec.songs) {
          if (!songMap[song]) songMap[song] = { title: song, plays: 0, communionPlays: 0, lastPlayed: rec.date };
          songMap[song].plays += 1;
          if (rec.isCommunion) songMap[song].communionPlays += 1;
          if (new Date(rec.date) > new Date(songMap[song].lastPlayed)) songMap[song].lastPlayed = rec.date;
        }
      }
      const songs = Object.values(songMap).sort((a, b) => b.plays - a.plays);
      const communionSongs = Object.values(songMap)
        .filter((s) => s.communionPlays > 0)
        .map((s) => ({
          ...s,
          percentage: communionPlans.length
            ? Math.round((s.communionPlays / communionPlans.length) * 100)
            : 0,
        }))
        .sort((a, b) => b.communionPlays - a.communionPlays);

      const peopleMap = {};
      for (const rec of records) {
        for (const member of rec.team) {
          const key = member.personId || member.name;
          if (!peopleMap[key]) {
            peopleMap[key] = {
              id: member.personId,
              name: member.name,
              positions: {},
              services: 0,
              lastServed: rec.date,
              history: [],
            };
          }
          const p = peopleMap[key];
          p.services += 1;
          p.positions[member.position] = (p.positions[member.position] || 0) + 1;
          if (new Date(rec.date) > new Date(p.lastServed)) p.lastServed = rec.date;
          p.history.push({
            date: rec.date,
            type: rec.isCommunion ? rec.serviceTypeName + ' (Comunhão)' : rec.serviceTypeName,
            songs: rec.songs.join(', '),
            role: member.position,
            isCommunion: rec.isCommunion,
          });
        }
      }
      const people = Object.values(peopleMap)
        .map((p) => ({
          ...p,
          mainPosition: Object.entries(p.positions).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Equipe',
          frequency: Math.round((p.services / Math.max(records.length, 1)) * 100),
          communionRate: Math.round(
            (p.history.filter((h) => h.isCommunion).length / Math.max(communionPlans.length, 1)) * 100
          ),
          history: p.history.sort((a, b) => new Date(b.date) - new Date(a.date)),
        }))
        .sort((a, b) => b.services - a.services);

      setStats({
        totalPlans: records.length,
        totalSongs: songs.length,
        totalPeople: people.length,
        communionCount: communionPlans.length,
        repeatRate: songs.length
          ? Math.round((songs.filter((s) => s.plays > 1).length / songs.length) * 100)
          : 0,
        songs,
        communionSongs,
        people,
      });
      setBlockouts({}); // limpa cache pra recarregar bloqueios atualizados
      setLastUpdated(new Date());
    } catch (e) {
      if (!silent) setError(String(e.message || e));
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, api]);

  // ---- Troca o código OAuth pelo token (quando volta do Planning Center) ----
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && !token) {
      setLoading(true);
      setProgress('Conectando com Planning Center...');
      fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.access_token) {
            localStorage.setItem('pc_token', data.access_token);
            setToken(data.access_token);
          } else {
            setError('Não foi possível conectar: ' + JSON.stringify(data));
          }
          window.history.replaceState({}, '', '/');
          setLoading(false);
        })
        .catch((e) => {
          setError(String(e));
          setLoading(false);
        });
    }
  }, []);

  // ---- Primeira carga quando tem token ----
  useEffect(() => {
    if (token && !stats) loadData(false);
  }, [token, stats, loadData]);

  // ---- TEMPO REAL: auto-refresh a cada 5 min + quando volta pra aba ----
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      loadData(true); // refresh silencioso (sem piscar a tela)
    }, REFRESH_INTERVAL);

    const onVisible = () => {
      if (
        document.visibilityState === 'visible' &&
        lastUpdated &&
        Date.now() - lastUpdated.getTime() > STALE_AFTER
      ) {
        loadData(true);
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [token, loadData, lastUpdated]);

  // ---- Buscar bloqueios quando abre perfil ----
  useEffect(() => {
    if (!viewingPerson || !viewingPerson.id || blockouts[viewingPerson.id]) return;
    api(`/services/v2/people/${viewingPerson.id}/blockouts?per_page=50`)
      .then((r) => {
        setBlockouts((prev) => ({
          ...prev,
          [viewingPerson.id]: (r.data || []).map((b) => ({
            starts: b.attributes.starts_at,
            ends: b.attributes.ends_at,
            reason: b.attributes.reason || 'Sem motivo informado',
          })),
        }));
      })
      .catch(() => {
        setBlockouts((prev) => ({ ...prev, [viewingPerson.id]: [] }));
      });
  }, [viewingPerson, api, blockouts]);

  const connect = async () => {
    setError(null);
    const r = await fetch('/api/auth-url');
    const data = await r.json();
    if (data.url) window.location.href = data.url;
    else setError('Configuração incompleta no Vercel (PC_CLIENT_ID).');
  };

  // ---------- TELA DE LOGIN ----------
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8f7f5' }}>
        <div className="p-10 rounded-xl text-center max-w-md" style={{ backgroundColor: '#ffffff', border: '1px solid #e8e6e1' }}>
          <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#2c5aa0' }}>
            <Music className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Insights Musicais</h1>
          <p className="text-sm mb-8" style={{ color: '#888' }}>Peoples Baptist Church</p>
          <button
            onClick={connect}
            className="w-full py-3 rounded-lg font-medium text-white transition"
            style={{ backgroundColor: '#2c5aa0', cursor: 'pointer' }}
          >
            Conectar com Planning Center
          </button>
          {error && (
            <p className="text-xs mt-4 p-3 rounded" style={{ color: '#c0392b', backgroundColor: '#fff5f5' }}>{error}</p>
          )}
          {loading && (
            <p className="text-sm mt-4" style={{ color: '#888' }}>{progress}</p>
          )}
        </div>
      </div>
    );
  }

  // ---------- TELA DE CARREGAMENTO (primeira carga) ----------
  if (loading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8f7f5' }}>
        <div className="text-center">
          <Loader className="w-10 h-10 mx-auto mb-4 animate-spin" style={{ color: '#2c5aa0' }} />
          <p className="text-sm font-medium" style={{ color: '#1a1a1a' }}>{progress || 'Carregando...'}</p>
          {error && (
            <div className="mt-6 max-w-md">
              <p className="text-xs p-3 rounded" style={{ color: '#c0392b', backgroundColor: '#fff5f5' }}>{error}</p>
              <button onClick={logout} className="mt-4 px-4 py-2 text-sm rounded-lg" style={{ backgroundColor: '#f0ede8', color: '#2c5aa0', cursor: 'pointer' }}>
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- APP PRINCIPAL ----------
  const personBlockouts = viewingPerson?.id ? blockouts[viewingPerson.id] : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f7f5' }}>
      <header className="border-b" style={{ borderColor: '#e8e6e1', backgroundColor: '#ffffff' }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2c5aa0' }}>
                <Music className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>Insights Musicais</h1>
                <p className="text-sm" style={{ color: '#888' }}>Peoples Baptist Church · últimos {stats.totalPlans} cultos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition"
                style={{ backgroundColor: '#f0ede8', color: '#2c5aa0', cursor: refreshing ? 'wait' : 'pointer' }}
                title="Atualizar agora"
              >
                <RefreshCw className={'w-3.5 h-3.5' + (refreshing ? ' animate-spin' : '')} />
                {refreshing ? 'Atualizando...' : 'Atualizar'}
              </button>
              <button onClick={logout} className="px-3 py-2 text-xs rounded-lg" style={{ backgroundColor: '#f0ede8', color: '#888', cursor: 'pointer' }}>
                Sair
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between" style={{ borderBottom: '2px solid #e8e6e1' }}>
            <div className="flex gap-4">
              {[
                { id: 'insights', label: '📊 Insights' },
                { id: 'people', label: '👤 Ministros' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setViewingPerson(null); }}
                  className="px-4 py-3 text-sm font-medium transition"
                  style={{
                    color: activeTab === tab.id ? '#2c5aa0' : '#888',
                    borderBottom: activeTab === tab.id ? '3px solid #2c5aa0' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {lastUpdated && (
              <p className="text-xs pb-2" style={{ color: '#aaa' }}>
                ⟳ Atualização automática · última: {fmtTime(lastUpdated)}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* ===== INSIGHTS ===== */}
        {activeTab === 'insights' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Músicas Diferentes', value: stats.totalSongs, color: '#2c5aa0' },
                { label: 'Cultos Analisados', value: stats.totalPlans, color: '#5a8a2c' },
                { label: 'Ministros Escalados', value: stats.totalPeople, color: '#a05a2c' },
                { label: 'Taxa de Repetição', value: stats.repeatRate + '%', color: '#8a2c5a' },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-lg" style={{ backgroundColor: '#ffffff', borderLeft: `4px solid ${item.color}` }}>
                  <p className="text-xs font-medium" style={{ color: '#888' }}>{item.label}</p>
                  <p className="text-2xl font-bold mt-2" style={{ color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="p-6 rounded-lg" style={{ backgroundColor: '#ffffff' }}>
                <h2 className="text-lg font-bold mb-6" style={{ color: '#1a1a1a' }}>🎵 Músicas Mais Tocadas</h2>
                <div className="space-y-3">
                  {stats.songs.slice(0, 10).map((song, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f0ede8' }}>
                        <span className="text-sm font-bold" style={{ color: '#2c5aa0' }}>{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#1a1a1a' }}>{song.title}</p>
                        <p className="text-xs" style={{ color: '#888' }}>Última vez: {fmtDate(song.lastPlayed)}</p>
                      </div>
                      <span className="text-sm font-medium flex-shrink-0" style={{ color: '#2c5aa0' }}>{song.plays}x</span>
                    </div>
                  ))}
                  {stats.songs.length === 0 && (
                    <p className="text-sm" style={{ color: '#888' }}>Nenhuma música encontrada nos cultos analisados.</p>
                  )}
                </div>
              </div>

              <div className="p-6 rounded-lg" style={{ backgroundColor: '#ffffff' }}>
                <h2 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>📅 Padrão de Comunhão</h2>
                <p className="text-xs font-medium mb-4" style={{ color: '#888' }}>
                  Músicas nos Domingos de Comunhão (1º domingo do mês) — {stats.communionCount} cultos identificados
                </p>
                <div className="space-y-4">
                  {stats.communionSongs.slice(0, 8).map((song, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between mb-2">
                        <p className="text-sm font-medium truncate mr-2" style={{ color: '#1a1a1a' }}>{song.title}</p>
                        <span className="text-sm font-bold flex-shrink-0" style={{ color: '#5a8a2c' }}>{song.communionPlays}x ({song.percentage}%)</span>
                      </div>
                      <div className="w-full h-3 rounded-full" style={{ backgroundColor: '#f0ede8' }}>
                        <div className="h-full rounded-full" style={{ backgroundColor: '#5a8a2c', width: `${Math.min(song.percentage, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                  {stats.communionSongs.length === 0 && (
                    <p className="text-sm" style={{ color: '#888' }}>Nenhum Domingo de Comunhão identificado ainda.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== MINISTROS (LISTA) ===== */}
        {activeTab === 'people' && !viewingPerson && (
          <>
            <h2 className="text-xl font-bold mb-6" style={{ color: '#1a1a1a' }}>Ministros ({stats.people.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.people.map((person, idx) => (
                <button
                  key={idx}
                  onClick={() => setViewingPerson(person)}
                  className="p-6 rounded-lg text-left transition hover:shadow-md"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e8e6e1', cursor: 'pointer' }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: '#1a1a1a' }}>{person.name}</h3>
                      <p className="text-sm" style={{ color: '#888' }}>{person.mainPosition}</p>
                    </div>
                    <span style={{ color: '#2c5aa0', fontSize: '20px' }}>→</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: '#888' }}>Serviços</span>
                      <span className="text-sm font-bold" style={{ color: '#2c5aa0' }}>{person.services}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: '#888' }}>Última vez</span>
                      <span className="text-sm" style={{ color: '#666' }}>{fmtDate(person.lastServed)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ===== PERFIL DO MINISTRO ===== */}
        {activeTab === 'people' && viewingPerson && (
          <>
            <button
              onClick={() => setViewingPerson(null)}
              className="mb-6 px-4 py-2 text-sm font-medium rounded-lg"
              style={{ backgroundColor: '#f0ede8', color: '#2c5aa0', cursor: 'pointer' }}
            >
              ← Voltar para Ministros
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="p-6 rounded-lg" style={{ backgroundColor: '#ffffff' }}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-3xl font-bold" style={{ color: '#1a1a1a' }}>{viewingPerson.name}</h1>
                      <p className="text-lg mt-2" style={{ color: '#888' }}>{viewingPerson.mainPosition}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold" style={{ color: '#2c5aa0' }}>{viewingPerson.services}</p>
                      <p className="text-sm" style={{ color: '#888' }}>serviços</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#f8f7f5' }}>
                      <p className="text-xs" style={{ color: '#888' }}>Frequência</p>
                      <p className="text-lg font-bold mt-1" style={{ color: '#2c5aa0' }}>{viewingPerson.frequency}%</p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#f8f7f5' }}>
                      <p className="text-xs" style={{ color: '#888' }}>Em Comunhão</p>
                      <p className="text-lg font-bold mt-1" style={{ color: '#5a8a2c' }}>{viewingPerson.communionRate}%</p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#f8f7f5' }}>
                      <p className="text-xs" style={{ color: '#888' }}>Bloqueios</p>
                      <p className="text-lg font-bold mt-1" style={{ color: '#a05a2c' }}>
                        {personBlockouts ? personBlockouts.length : '...'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-lg" style={{ backgroundColor: '#ffffff' }}>
                  <h2 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>📅 Dias que Serviu</h2>
                  <div className="space-y-3">
                    {viewingPerson.history.map((service, idx) => (
                      <div key={idx} className="p-4 rounded-lg" style={{ backgroundColor: '#f8f7f5', borderLeft: '3px solid #2c5aa0' }}>
                        <div className="flex justify-between mb-2">
                          <p className="font-medium" style={{ color: '#1a1a1a' }}>{fmtDate(service.date)}</p>
                          <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: '#e8f0ff', color: '#2c5aa0' }}>
                            {service.role}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: '#666' }}>{service.type}</p>
                        {service.songs && (
                          <p className="text-sm mt-2" style={{ color: '#666' }}>🎵 {service.songs}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-lg" style={{ backgroundColor: '#ffffff' }}>
                  <h2 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>🚫 Dias Bloqueados</h2>
                  {!personBlockouts && (
                    <p className="text-sm" style={{ color: '#888' }}>Carregando bloqueios...</p>
                  )}
                  {personBlockouts && personBlockouts.length === 0 && (
                    <p className="text-sm" style={{ color: '#888' }}>Nenhum bloqueio registrado. 🎉</p>
                  )}
                  <div className="space-y-3">
                    {(personBlockouts || []).map((block, idx) => (
                      <div key={idx} className="p-4 rounded-lg" style={{ backgroundColor: '#fff5f5', borderLeft: '3px solid #e74c3c' }}>
                        <p className="font-medium" style={{ color: '#1a1a1a' }}>
                          {fmtDate(block.starts)} → {fmtDate(block.ends)}
                        </p>
                        <p className="text-sm mt-1" style={{ color: '#666' }}>📌 {block.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-lg" style={{ backgroundColor: '#ffffff' }}>
                  <h3 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>💡 Insights Pessoais</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium" style={{ color: '#888' }}>Funções que já fez</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(viewingPerson.positions).map(([pos, count], idx) => (
                          <span key={idx} className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: '#f0ede8', color: '#a05a2c' }}>
                            {pos} ({count}x)
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ height: '1px', backgroundColor: '#e8e6e1' }} />
                    <div>
                      <p className="text-xs font-medium" style={{ color: '#888' }}>Participação em Comunhão</p>
                      <p className="text-sm font-bold mt-2" style={{ color: '#5a8a2c' }}>
                        {viewingPerson.communionRate}% dos Domingos de Comunhão
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
