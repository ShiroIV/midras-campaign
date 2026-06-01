import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const MONTH_NAMES = [
  'Premier-Mois', 'Deuxième-Mois', 'Troisième-Mois', 'Quatrième-Mois',
  'Cinquième-Mois', 'Sixième-Mois', 'Septième-Mois', 'Huitième-Mois',
  'Neuvième-Mois', 'Dixième-Mois',
];
const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche', 'Octidi', 'Nonidi', 'Décadi'];

export default function CalendarPage() {
  const { campaignId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [viewMonth, setViewMonth] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', month: 1, day: 1, year: null, type: 'normal', repeat: 'none' });
  const [seasonForm, setSeasonForm] = useState({ name: '', start_month: 1, start_day: 1, weather_table: '{}', stat_modifiers: '{}' });
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    api.calendar.get(campaignId).then(d => {
      setData(d);
      if (!viewMonth) setViewMonth(d.state.month);
    });
  }, [campaignId, refresh, viewMonth]);

  if (!data) return <div>Chargement...</div>;

  const { state, calendar, events = [], seasons = [], currentSeason } = data;
  const isMj = user.role === 'mj';

  const advance = async (unit, amount) => {
    await api.calendar.advance(campaignId, unit, amount);
    setRefresh(r => r + 1);
  };

  const setDate = async () => {
    const m = parseInt(prompt('Mois (1-10):', state.month));
    const w = parseInt(prompt('Semaine (1-4):', state.week));
    const d = parseInt(prompt('Jour (1-10):', state.day));
    if (m && w && d) {
      await api.calendar.setState(campaignId, { month: m, week: w, day: d });
      setRefresh(r => r + 1);
    }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    await api.calendar.events.create(campaignId, eventForm);
    setShowEventForm(false);
    setEventForm({ title: '', description: '', month: 1, day: 1, year: null, type: 'normal', repeat: 'none' });
    setRefresh(r => r + 1);
  };

  const deleteEvent = async (eventId) => {
    if (!confirm('Supprimer cet événement ?')) return;
    await api.calendar.events.delete(campaignId, eventId);
    setRefresh(r => r + 1);
  };

  const createSeason = async (e) => {
    e.preventDefault();
    await api.calendar.seasons.create(campaignId, seasonForm);
    setShowSeasonForm(false);
    setSeasonForm({ name: '', start_month: 1, start_day: 1, weather_table: '{}', stat_modifiers: '{}' });
    setRefresh(r => r + 1);
  };

  const deleteSeason = async (seasonId) => {
    if (!confirm('Supprimer cette saison ?')) return;
    await api.calendar.seasons.delete(campaignId, seasonId);
    setRefresh(r => r + 1);
  };

  const monthEvents = events.filter(e => {
    const eMonth = e.month;
    const eYear = e.year || 1;
    if (e.repeat === 'yearly') return eMonth === viewMonth;
    return eMonth === viewMonth && eYear === state.year;
  });

  const daysInMonth = calendar.daysPerMonth;
  const todayAbs = (state.month - 1) * calendar.daysPerMonth + (state.week - 1) * calendar.daysPerWeek + state.day;

  const prevMonth = () => setViewMonth(viewMonth > 1 ? viewMonth - 1 : calendar.monthsPerYear);
  const nextMonth = () => setViewMonth(viewMonth < calendar.monthsPerYear ? viewMonth + 1 : 1);

  return (
    <div>
      <button onClick={() => navigate(`/campaigns/${campaignId}`)} style={{ marginBottom: 12 }}>&larr; Retour</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Calendrier de Midras</h2>
      </div>

      <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, marginBottom: 16, background: '#f9f9f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Date actuelle :</strong> {DAY_NAMES[state.day - 1]} — {MONTH_NAMES[state.month - 1]} — Semaine {state.week} — Jour {state.day}
            <span style={{ marginLeft: 12 }}>Année {state.year}</span>
            {currentSeason && <span style={{ marginLeft: 12, fontStyle: 'italic' }}>Saison : {currentSeason.name}</span>}
          </div>
          {isMj && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => advance('day', 1)} title="Jour suivant">Jour +1</button>
              <button onClick={() => advance('week', 1)} title="Semaine suivante">Semaine +1</button>
              <button onClick={() => advance('month', 1)} title="Mois suivant">Mois +1</button>
              <button onClick={setDate}>Définir</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button onClick={prevMonth}>&larr; {MONTH_NAMES[(viewMonth - 2 + calendar.monthsPerYear) % calendar.monthsPerYear]}</button>
        <h3 style={{ margin: 0 }}>{MONTH_NAMES[viewMonth - 1]} {state.year}</h3>
        <button onClick={nextMonth}>{MONTH_NAMES[viewMonth % calendar.monthsPerYear]} &rarr;</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${calendar.daysPerWeek}, 1fr)`, gap: 1, background: '#ddd', border: '1px solid #ddd' }}>
        {DAY_NAMES.map(d => (
          <div key={d} style={{ padding: 6, background: '#eee', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8em' }}>{d}</div>
        ))}
        {Array.from({ length: calendar.daysPerMonth }, (_, i) => {
          const dayNum = i + 1;
          const weekNum = Math.floor(i / calendar.daysPerWeek) + 1;
          const isToday = viewMonth === state.month && weekNum === state.week && dayNum === state.day;
          const dayEvents = monthEvents.filter(e => e.day === dayNum);
          return (
            <div
              key={i}
              style={{
                padding: 6, minHeight: 60, background: isToday ? '#e3f2fd' : '#fff',
                border: isToday ? '2px solid #1976d2' : 'none', position: 'relative',
              }}
            >
              <div style={{ fontSize: '0.8em', fontWeight: 'bold', marginBottom: 2 }}>{dayNum}</div>
              {dayEvents.map(e => (
                <div key={e.id} style={{ fontSize: '0.7em', padding: '1px 3px', background: '#e8f5e9', borderRadius: 3, marginBottom: 1, cursor: 'pointer' }}
                  title={e.description || e.title}
                >
                  {e.title}
                  {isMj && <span onClick={() => deleteEvent(e.id)} style={{ marginLeft: 4, color: 'red', cursor: 'pointer' }}>✕</span>}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {isMj && (
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button onClick={() => { setShowEventForm(!showEventForm); setShowSeasonForm(false); }}>
            {showEventForm ? 'Fermer' : 'Nouvel événement'}
          </button>
          <button onClick={() => { setShowSeasonForm(!showSeasonForm); setShowEventForm(false); }}>
            {showSeasonForm ? 'Fermer' : 'Nouvelle saison'}
          </button>
        </div>
      )}

      {showEventForm && (
        <form onSubmit={createEvent} style={{ margin: '12px 0', padding: 16, border: '1px solid #ccc', borderRadius: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div><label>Titre</label><input value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} required style={{ width: '100%', padding: 6 }} /></div>
          <div><label>Description</label><input value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} style={{ width: '100%', padding: 6 }} /></div>
          <div><label>Mois</label><input type="number" min="1" max="10" value={eventForm.month} onChange={e => setEventForm({...eventForm, month: +e.target.value})} style={{ width: '100%', padding: 6 }} /></div>
          <div><label>Jour</label><input type="number" min="1" max="40" value={eventForm.day} onChange={e => setEventForm({...eventForm, day: +e.target.value})} style={{ width: '100%', padding: 6 }} /></div>
          <div><label>Année (vide = chaque année)</label><input type="number" value={eventForm.year || ''} onChange={e => setEventForm({...eventForm, year: e.target.value ? +e.target.value : null})} style={{ width: '100%', padding: 6 }} /></div>
          <div><label>Répétition</label><select value={eventForm.repeat} onChange={e => setEventForm({...eventForm, repeat: e.target.value})} style={{ width: '100%', padding: 6 }}>
            <option value="none">Aucune</option>
            <option value="yearly">Annuelle</option>
            <option value="monthly">Mensuelle</option>
          </select></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <button type="submit">Créer</button>
            <button type="button" onClick={() => setShowEventForm(false)}>Annuler</button>
          </div>
        </form>
      )}

      {showSeasonForm && (
        <form onSubmit={createSeason} style={{ margin: '12px 0', padding: 16, border: '1px solid #ccc', borderRadius: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div><label>Nom</label><input value={seasonForm.name} onChange={e => setSeasonForm({...seasonForm, name: e.target.value})} required style={{ width: '100%', padding: 6 }} /></div>
          <div><label>Mois de début</label><input type="number" min="1" max="10" value={seasonForm.start_month} onChange={e => setSeasonForm({...seasonForm, start_month: +e.target.value})} style={{ width: '100%', padding: 6 }} /></div>
          <div><label>Jour de début</label><input type="number" min="1" max="40" value={seasonForm.start_day} onChange={e => setSeasonForm({...seasonForm, start_day: +e.target.value})} style={{ width: '100%', padding: 6 }} /></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <button type="submit">Créer</button>
            <button type="button" onClick={() => setShowSeasonForm(false)}>Annuler</button>
          </div>
        </form>
      )}

      {seasons.length > 0 && (
        <div style={{ marginTop: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
          <h3>Saisons</h3>
          {seasons.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
              <span><strong>{s.name}</strong> — Mois {s.start_month}, Jour {s.start_day}</span>
              {isMj && <button onClick={() => deleteSeason(s.id)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}>Supprimer</button>}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#f9f9f9' }}>
        <h3>Tous les événements</h3>
        {events.length === 0 ? <p>Aucun événement</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: 8 }}>Date</th>
                <th style={{ padding: 8 }}>Titre</th>
                <th style={{ padding: 8 }}>Répétition</th>
              </tr>
            </thead>
            <tbody>
              {events.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{MONTH_NAMES[e.month - 1]} {e.day}{e.year ? `, an ${e.year}` : ''}</td>
                  <td style={{ padding: 8 }}>{e.title}</td>
                  <td style={{ padding: 8 }}>{e.repeat === 'none' ? '-' : e.repeat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
