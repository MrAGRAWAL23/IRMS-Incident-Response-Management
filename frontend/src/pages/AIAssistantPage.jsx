import { useState, useEffect } from 'react';
import { BrainCircuit, Send, ChevronDown } from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { severityBadge, statusBadge, formatDateTime, apiError } from '../utils/helpers.js';
import toast from 'react-hot-toast';

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInc, setLoadingInc] = useState(false);
  const [aiMode, setAiMode] = useState(null);

  useEffect(() => {
    api.get('/incidents', { params: { limit: 100, sort: 'updated_at', order: 'DESC' } })
      .then(r => setIncidents(r.data.incidents || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) { setSelectedIncident(null); setMessages([]); return; }
    setLoadingInc(true);
    api.get(`/incidents/${selectedId}`)
      .then(r => {
        setSelectedIncident(r.data);
        setMessages([{
          role: 'ai',
          text: `I'm ready to help with incident **${r.data.incident_code}** — "${r.data.title}". You can ask me about probable causes, investigation steps, containment measures, or recommended actions. What would you like to know?`,
        }]);
      })
      .catch(err => toast.error(apiError(err)))
      .finally(() => setLoadingInc(false));
  }, [selectedId]);

  const sendMessage = async () => {
    const q = input.trim();
    if (!q || !selectedId) return;
    const userMsg = { role: 'user', text: q };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post(`/incidents/${selectedId}/ai-chat`, { question: q });
      setAiMode(res.data.mode);
      setMessages(m => [...m, { role: 'ai', text: res.data.answer }]);
    } catch (err) {
      toast.error(apiError(err));
      setMessages(m => [...m, { role: 'ai', text: 'Sorry, I could not process that request. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const SUGGESTED = [
    'What are the possible causes of this incident?',
    'What containment steps should be taken immediately?',
    'What evidence should be collected for this incident?',
    'How should this type of attack be investigated?',
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, height: 'calc(100vh - 120px)', minHeight: 500 }}>
      {/* Left panel — incident selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header"><span className="card-title">Select Incident</span></div>
          <div style={{ padding: '8px 0', overflowY: 'auto', flex: 1 }}>
            {incidents.length === 0 ? (
              <div className="empty-state" style={{ padding: 20 }}>
                <p className="empty-state-desc">No incidents found.</p>
              </div>
            ) : incidents.map(inc => (
              <div
                key={inc.id}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  background: String(inc.id) === selectedId ? '#EFF6FF' : 'transparent',
                  borderLeft: String(inc.id) === selectedId ? '3px solid var(--action-primary)' : '3px solid transparent',
                  transition: 'background 0.1s',
                }}
                onClick={() => setSelectedId(String(inc.id))}
              >
                <div style={{ fontSize: 11, color: 'var(--action-primary)', fontWeight: 600, fontFamily: 'monospace' }}>{inc.incident_code}</div>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.title}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <span className={`badge ${severityBadge(inc.severity)}`} style={{ fontSize: 10 }}>{inc.severity}</span>
                  <span className={`badge ${statusBadge(inc.status)}`} style={{ fontSize: 10 }}>{inc.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — chat */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Chat header */}
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BrainCircuit size={18} color="var(--action-primary)" />
            <div>
              <div className="card-title">IRMS AI Assistant</div>
              {selectedIncident && (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{selectedIncident.incident_code} — {selectedIncident.title}</div>
              )}
            </div>
          </div>
          {aiMode && (
            <span className={`ai-mode-badge ${aiMode === 'demo' ? 'ai-mode-demo' : 'ai-mode-live'}`}>
              {aiMode === 'demo' ? '⚙ Demo AI Mode — rule-based recommendations' : `⚡ ${aiMode}`}
            </span>
          )}
        </div>

        {/* Messages area */}
        <div className="chat-container" style={{ flex: 1, padding: '16px', overflowY: 'auto', maxHeight: 'none' }}>
          {!selectedId ? (
            <div className="empty-state" style={{ height: '100%', justifyContent: 'center' }}>
              <div className="empty-state-icon"><BrainCircuit size={36} /></div>
              <p className="empty-state-title">Select an incident</p>
              <p className="empty-state-desc">Choose an incident from the left panel to start a conversation with the AI assistant about that incident.</p>
            </div>
          ) : loadingInc ? (
            <div className="loading-center"><span className="spinner" /> Loading incident context…</div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`chat-msg ${msg.role === 'user' ? 'user' : ''}`}>
                  {msg.role === 'ai' && (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--action-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <BrainCircuit size={14} color="white" />
                    </div>
                  )}
                  <div className={`chat-bubble ${msg.role === 'ai' ? 'ai' : 'user'}`} style={{ whiteSpace: 'pre-wrap' }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="chat-msg">
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--action-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BrainCircuit size={14} color="white" />
                  </div>
                  <div className="chat-bubble ai">
                    <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Thinking…
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Suggested questions */}
        {selectedId && messages.length <= 1 && !loading && (
          <div style={{ padding: '0 16px 10px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SUGGESTED.map(q => (
              <button key={q} className="btn btn-secondary btn-sm" style={{ fontSize: 11 }} onClick={() => { setInput(q); }}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div className="chat-input-row">
            <textarea
              className="chat-input"
              style={{ height: 'auto', minHeight: 36, resize: 'none', paddingTop: 8, paddingBottom: 8, lineHeight: 1.4 }}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedId ? 'Ask a question about this incident… (Enter to send)' : 'Select an incident first'}
              disabled={!selectedId || loading}
            />
            <button className="btn btn-primary" onClick={sendMessage} disabled={!input.trim() || !selectedId || loading} style={{ flexShrink: 0 }}>
              <Send size={14} />
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            AI recommendations are for analysis only and do not execute any real security actions.
          </div>
        </div>
      </div>
    </div>
  );
}
