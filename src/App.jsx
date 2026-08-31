import React, { useState } from 'react';
import { Music, Users, Calendar, BarChart3 } from 'lucide-react';

export default function PBCStatsApp() {
  const [activeTab, setActiveTab] = useState('insights');
  const [viewingPerson, setViewingPerson] = useState(null);

  const topSongs = [
    { title: 'Espírito Santo', plays: 24, lastPlayed: '22 ago' },
    { title: 'Graça Infinita', plays: 21, lastPlayed: '15 ago' },
    { title: 'Comunhão Viva', plays: 19, lastPlayed: '8 ago' },
    { title: 'Redenção', plays: 17, lastPlayed: '29 jul' },
    { title: 'Esperança', plays: 15, lastPlayed: '24 ago' },
  ];

  const ministers = [
    { id: 1, name: 'Ana Rossi', role: 'Vocal Principal', services: 18, lastServed: '22 ago', frequency: 69 },
    { id: 2, name: 'Jean Carlos', role: 'Violão', services: 16, lastServed: '15 ago', frequency: 62 },
    { id: 3, name: 'Nicholas', role: 'Teclado', services: 14, lastServed: '8 ago', frequency: 54 },
    { id: 4, name: 'Ramos', role: 'Vocal/Baixo', services: 11, lastServed: '29 jul', frequency: 42 },
    { id: 5, name: 'Angelo', role: 'Percussão', services: 9, lastServed: '22 jul', frequency: 35 },
  ];

  const personDetails = {
    'Ana Rossi': {
      role: 'Vocal Principal',
      services: 18,
      frequency: 69,
      favoriteSong: 'Espírito Santo',
      preferredService: 'Culto Matinal',
      servedDays: [
        { date: '22 ago (Dom)', type: 'Culto Matinal', songs: 'Espírito Santo, Graça Infinita', role: 'Vocal' },
        { date: '15 ago (Dom)', type: 'Culto Matinal', songs: 'Comunhão Viva, Redenção', role: 'Vocal' },
        { date: '8 ago (Dom)', type: 'Culto Matinal', songs: 'Espírito Santo, Paz do Senhor', role: 'Vocal' },
        { date: '1 ago (Dom)', type: 'Culto Comunhão', songs: 'Comunhão Viva, Redenção, Esperança', role: 'Vocal' },
      ],
      unavailable: [
        { date: '29 set (Dom)', reason: 'Trabalho', duration: 'O dia todo' },
        { date: '5 out (Dom)', reason: 'Aniversário em outro estado', duration: 'O dia todo' },
      ],
    },
  };

  const renderTabs = () => (
    <div className="flex gap-4 mb-6" style={{ borderBottom: '2px solid #e8e6e1' }}>
      {[
        { id: 'insights', label: '📊 Insights' },
        { id: 'scheduling', label: '👥 Escalar Pessoas' },
        { id: 'people', label: '👤 Ministros' },
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => { setActiveTab(tab.id); setViewingPerson(null); }}
          className="px-4 py-3 text-sm font-medium transition"
          style={{
            color: activeTab === tab.id ? '#2c5aa0' : '#888',
            borderBottom: activeTab === tab.id ? '3px solid #2c5aa0' : 'none',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f7f5' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: '#e8e6e1', backgroundColor: '#ffffff' }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2c5aa0' }}>
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>Insights Musicais</h1>
              <p className="text-sm" style={{ color: '#888' }}>Peoples Baptist Church</p>
            </div>
          </div>
          {renderTabs()}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* ===== TAB: INSIGHTS ===== */}
        {activeTab === 'insights' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total de Músicas', value: '89', color: '#2c5aa0' },
                { label: 'Serviços', value: '26', color: '#5a8a2c' },
                { label: 'Ministros Escalados', value: '12', color: '#a05a2c' },
                { label: 'Taxa de Repetição', value: '34%', color: '#8a2c5a' },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-lg" style={{ backgroundColor: '#ffffff', borderLeft: `4px solid ${item.color}` }}>
                  <p className="text-xs font-medium" style={{ color: '#888' }}>{item.label}</p>
                  <p className="text-2xl font-bold mt-2" style={{ color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="p-6 rounded-lg" style={{ backgroundColor: '#ffffff' }}>
                <h2 className="text-lg font-bold mb-6" style={{ color: '#1a1a1a' }}>🎵 Top 5 Músicas</h2>
                <div className="space-y-3">
                  {topSongs.map((song, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f0ede8' }}>
                        <span className="text-sm font-bold" style={{ color: '#2c5aa0' }}>{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: '#1a1a1a' }}>{song.title}</p>
                        <p className="text-xs" style={{ color: '#888' }}>Última vez: {song.lastPlayed}</p>
                      </div>
                      <span className="text-sm font-medium" style={{ color: '#2c5aa0' }}>{song.plays}x</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-lg" style={{ backgroundColor: '#ffffff' }}>
                <h2 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>📅 Padrão de Comunhão</h2>
                <p className="text-xs font-medium mb-4" style={{ color: '#888' }}>Músicas em Domingos de Comunhão (1ª semana)</p>
                <div className="space-y-4">
                  {[
                    { title: 'Comunhão Viva', percentage: 95 },
                    { title: 'Redenção', percentage: 85 },
                    { title: 'Paz do Senhor', percentage: 73 },
                  ].map((song, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between mb-2">
                        <p className="text-sm font-medium" style={{ color: '#1a1a1a' }}>{song.title}</p>
                        <span className="text-sm font-bold" style={{ color: '#5a8a2c' }}>{song.percentage}%</span>
                      </div>
                      <div className="w-full h-3 rounded-full" style={{ backgroundColor: '#f0ede8' }}>
                        <div className="h-full rounded-full" style={{ backgroundColor: '#5a8a2c', width: `${song.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== TAB: ESCALAÇÃO ===== */}
        {activeTab === 'scheduling' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 p-6 rounded-lg" style={{ backgroundColor: '#ffffff' }}>
              <h2 className="text-xl font-bold mb-6" style={{ color: '#1a1a1a' }}>Escalar Pessoa para Serviço</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>Qual culto?</label>
                  <select className="w-full px-4 py-3 rounded-lg border" style={{ borderColor: '#e8e6e1' }}>
                    <option>Selecione um culto...</option>
                    <option>Dom 1º set - Culto Matinal (Comunhão)</option>
                    <option>Dom 8 set - Culto Matinal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>Quem vai ministrar?</label>
                  <select className="w-full px-4 py-3 rounded-lg border" style={{ borderColor: '#e8e6e1' }}>
                    <option>Selecione uma pessoa...</option>
                    <option>Ana Rossi</option>
                    <option>Jean Carlos</option>
                    <option>Nicholas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>Qual função?</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['🎤 Vocal', '🎸 Violão', '⌨️ Teclado'].map(role => (
                      <button key={role} className="px-4 py-3 rounded-lg font-medium transition" style={{ backgroundColor: '#f0ede8', color: '#666' }}>
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="w-full py-3 rounded-lg font-medium text-white transition" style={{ backgroundColor: '#2c5aa0' }}>
                  ✓ Confirmar Escalação
                </button>
              </div>
            </div>
            <div className="p-6 rounded-lg" style={{ backgroundColor: '#ffffff' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>Escalações Recentes</h3>
              <div className="space-y-4">
                {[
                  { date: '22 ago', person: 'Ana Rossi', role: 'Vocal' },
                  { date: '15 ago', person: 'Jean Carlos', role: 'Violão' },
                  { date: '8 ago', person: 'Nicholas', role: 'Teclado' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg" style={{ backgroundColor: '#f8f7f5' }}>
                    <p className="text-xs font-medium" style={{ color: '#888' }}>{item.date}</p>
                    <p className="text-sm font-medium mt-1" style={{ color: '#1a1a1a' }}>{item.person}</p>
                    <span className="text-xs px-2 py-1 rounded mt-2 inline-block" style={{ backgroundColor: '#e8f0ff', color: '#2c5aa0' }}>
                      {item.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB: MINISTROS ===== */}
        {activeTab === 'people' && !viewingPerson && (
          <>
            <h2 className="text-xl font-bold mb-6" style={{ color: '#1a1a1a' }}>Ministros da Congregação</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ministers.map(person => (
                <button
                  key={person.id}
                  onClick={() => setViewingPerson(person.name)}
                  className="p-6 rounded-lg text-left transition hover:shadow-md"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e8e6e1', cursor: 'pointer' }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: '#1a1a1a' }}>{person.name}</h3>
                      <p className="text-sm" style={{ color: '#888' }}>{person.role}</p>
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
                      <span className="text-sm" style={{ color: '#666' }}>{person.lastServed}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ===== PERFIL DETALHADO DE MINISTRO ===== */}
        {activeTab === 'people' && viewingPerson && personDetails[viewingPerson] && (
          <>
            <button
              onClick={() => setViewingPerson(null)}
              className="mb-6 px-4 py-2 text-sm font-medium rounded-lg transition"
              style={{ backgroundColor: '#f0ede8', color: '#2c5aa0', cursor: 'pointer' }}
            >
              ← Voltar para Ministros
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Header */}
                <div className="p-6 rounded-lg" style={{ backgroundColor: '#ffffff' }}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-3xl font-bold" style={{ color: '#1a1a1a' }}>{viewingPerson}</h1>
                      <p className="text-lg mt-2" style={{ color: '#888' }}>{personDetails[viewingPerson].role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold" style={{ color: '#2c5aa0' }}>{personDetails[viewingPerson].services}</p>
                      <p className="text-sm" style={{ color: '#888' }}>serviços</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#f8f7f5' }}>
                      <p className="text-xs" style={{ color: '#888' }}>Frequência</p>
                      <p className="text-lg font-bold mt-1" style={{ color: '#2c5aa0' }}>{personDetails[viewingPerson].frequency}%</p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#f8f7f5' }}>
                      <p className="text-xs" style={{ color: '#888' }}>Bloqueia</p>
                      <p className="text-lg font-bold mt-1" style={{ color: '#a05a2c' }}>{personDetails[viewingPerson].unavailable.length}</p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#f8f7f5' }}>
                      <p className="text-xs" style={{ color: '#888' }}>Função</p>
                      <p className="text-lg font-bold mt-1" style={{ color: '#5a8a2c' }}>🎤</p>
                    </div>
                  </div>
                </div>

                {/* Histórico de Serviços */}
                <div className="p-6 rounded-lg" style={{ backgroundColor: '#ffffff' }}>
                  <h2 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>📅 Dias que Serviu</h2>
                  <div className="space-y-3">
                    {personDetails[viewingPerson].servedDays.map((service, idx) => (
                      <div key={idx} className="p-4 rounded-lg" style={{ backgroundColor: '#f8f7f5', borderLeft: '3px solid #2c5aa0' }}>
                        <div className="flex justify-between mb-2">
                          <p className="font-medium" style={{ color: '#1a1a1a' }}>{service.date}</p>
                          <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: '#e8f0ff', color: '#2c5aa0' }}>
                            {service.role}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: '#666' }}>{service.type}</p>
                        <p className="text-sm mt-2" style={{ color: '#666' }}>🎵 {service.songs}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Indisponibilidades */}
                <div className="p-6 rounded-lg" style={{ backgroundColor: '#ffffff' }}>
                  <h2 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>🚫 Dias Bloqueados</h2>
                  <div className="space-y-3">
                    {personDetails[viewingPerson].unavailable.map((block, idx) => (
                      <div key={idx} className="p-4 rounded-lg" style={{ backgroundColor: '#fff5f5', borderLeft: '3px solid #e74c3c' }}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium" style={{ color: '#1a1a1a' }}>{block.date}</p>
                            <p className="text-sm mt-1" style={{ color: '#666' }}>📌 {block.reason}</p>
                            <p className="text-xs mt-2" style={{ color: '#888' }}>{block.duration}</p>
                          </div>
                          <button className="text-xs px-3 py-1 rounded transition" style={{ backgroundColor: '#f0ede8', color: '#a05a2c', cursor: 'pointer' }}>
                            ✏️ Editar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 py-2 rounded-lg font-medium text-sm transition" style={{ backgroundColor: '#f0ede8', color: '#2c5aa0', cursor: 'pointer' }}>
                    + Adicionar Indisponibilidade
                  </button>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="p-6 rounded-lg" style={{ backgroundColor: '#ffffff' }}>
                  <h3 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>💡 Insights Pessoais</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium" style={{ color: '#888' }}>Música Favorita</p>
                      <p className="text-sm font-bold mt-2" style={{ color: '#2c5aa0' }}>{personDetails[viewingPerson].favoriteSong}</p>
                      <p className="text-xs mt-1" style={{ color: '#666' }}>Escalada 5 vezes</p>
                    </div>
                    <div style={{ height: '1px', backgroundColor: '#e8e6e1' }} />
                    <div>
                      <p className="text-xs font-medium" style={{ color: '#888' }}>Culto Preferido</p>
                      <p className="text-sm font-bold mt-2" style={{ color: '#5a8a2c' }}>{personDetails[viewingPerson].preferredService}</p>
                      <p className="text-xs mt-1" style={{ color: '#666' }}>67% das aparições</p>
                    </div>
                    <div style={{ height: '1px', backgroundColor: '#e8e6e1' }} />
                    <div>
                      <p className="text-xs font-medium" style={{ color: '#888' }}>Padrão</p>
                      <p className="text-sm font-bold mt-2" style={{ color: '#a05a2c' }}>Sempre Comunhão</p>
                      <p className="text-xs mt-1" style={{ color: '#666' }}>100% em Domingos de Comunhão</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-lg" style={{ backgroundColor: '#ffffff' }}>
                  <h3 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>⚡ Ações Rápidas</h3>
                  <div className="space-y-3">
                    <button className="w-full py-2 text-sm font-medium rounded-lg transition" style={{ backgroundColor: '#f0ede8', color: '#2c5aa0', cursor: 'pointer' }}>
                      📱 Enviar Mensagem
                    </button>
                    <button className="w-full py-2 text-sm font-medium rounded-lg transition" style={{ backgroundColor: '#f0ede8', color: '#2c5aa0', cursor: 'pointer' }}>
                      📅 Escalar Próximo Culto
                    </button>
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
