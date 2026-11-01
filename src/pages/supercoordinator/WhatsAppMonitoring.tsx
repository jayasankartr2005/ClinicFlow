// ==============================================================================
// ClinicFlow — Supercoordinator: Meta WhatsApp Cloud API Telemetry & Simulator
// Real-Time Webhook Monitoring, Session State Inspector & Interactive Testing
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Hospital, WhatsAppSession, WhatsAppMessage } from '@/types';
import { Button } from '@/components/common/Button';
import { DataTable, Column } from '@/components/common/DataTable';
import { useToast } from '@/contexts/ToastContext';
import { formatDate, formatDateTime } from '@/lib/dateUtils';
import { 
  MessageSquare, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  Smartphone, 
  Clock, 
  Activity, 
  Bot, 
  User, 
  ShieldCheck,
  CheckCheck,
  Building2,
  Phone
} from 'lucide-react';

export const WhatsAppMonitoring: React.FC = () => {
  const { success, error } = useToast();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulator State
  const [simPhone, setSimPhone] = useState('+919811100001');
  const [inputText, setInputText] = useState('Hi');
  const [chatLog, setChatLog] = useState<Array<{ sender: 'user' | 'bot'; text: string; buttons?: any[]; time: string }>>([
    { sender: 'user', text: 'Hi', time: 'Just now' },
    { 
      sender: 'bot', 
      text: 'Welcome to Apollo Health Center.\n\nHow can we help you today?', 
      buttons: [
        { id: 'btn_book', title: 'Book Appointment' },
        { id: 'btn_my_appts', title: 'My Appointments' },
        { id: 'btn_records', title: 'Prescriptions & Reports' },
      ],
      time: 'Just now'
    }
  ]);
  const [isSimulating, setIsSimulating] = useState(false);

  const loadData = async (hId?: string) => {
    try {
      setIsLoading(true);
      const [hList, sList, mList] = await Promise.all([
        api.hospitals.getAll(),
        api.whatsapp.getSessions(hId),
        api.whatsapp.getMessages(hId),
      ]);

      setHospitals(hList);
      if (!selectedHospitalId && hList.length > 0) {
        setSelectedHospitalId(hList[0].id);
      }
      setSessions(sList);
      setMessages(mList);
    } catch (err: any) {
      error(err.message || 'Failed to load WhatsApp telemetry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedHospitalId || undefined);
  }, [selectedHospitalId]);

  const handleSendMessage = async (textToSend: string, actionId?: string) => {
    if (!textToSend.trim() && !actionId) return;

    const userMessageText = textToSend || actionId || '';
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatLog(prev => [...prev, { sender: 'user', text: userMessageText, time: nowStr }]);
    setInputText('');
    setIsSimulating(true);

    try {
      const activeHospId = selectedHospitalId || hospitals[0]?.id;
      const res = await api.whatsapp.simulateMessage(activeHospId, simPhone, userMessageText, actionId);

      setChatLog(prev => [
        ...prev,
        {
          sender: 'bot',
          text: res.replyText,
          buttons: res.buttons,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);

      // Refresh telemetry
      loadData(selectedHospitalId);
    } catch (err: any) {
      error(err.message || 'Simulation dispatch failed');
    } finally {
      setIsSimulating(false);
    }
  };

  const messageColumns: Column<WhatsAppMessage>[] = [
    {
      key: 'direction',
      header: 'Direction',
      render: (m) => (
        <span
          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
            m.direction === 'INBOUND'
              ? 'bg-sky-100 text-sky-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {m.direction}
        </span>
      ),
    },
    {
      key: 'whatsapp_message_id',
      header: 'Message ID (Idempotency Key)',
      render: (m) => (
        <span className="font-mono text-[11px] text-slate-600 truncate max-w-[180px] block" title={m.whatsapp_message_id}>
          {m.whatsapp_message_id}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Format',
      render: (m) => (
        <span className="text-xs font-semibold text-slate-700 uppercase">
          {m.message_type}
        </span>
      ),
    },
    {
      key: 'content',
      header: 'Payload Summary',
      render: (m) => (
        <p className="text-xs text-slate-800 max-w-sm truncate">
          {m.metadata?.body || m.metadata?.text || 'Interactive Event'}
        </p>
      ),
    },
    {
      key: 'time',
      header: 'Timestamp',
      render: (m) => (
        <span className="text-xs text-slate-500">{formatDateTime(m.created_at)}</span>
      ),
    },
  ];

  const sessionColumns: Column<WhatsAppSession>[] = [
    {
      key: 'number',
      header: 'WhatsApp Number',
      render: (s) => (
        <div className="flex items-center gap-2">
          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-mono text-xs font-bold text-slate-900">{s.whatsapp_number}</span>
        </div>
      ),
    },
    {
      key: 'patient',
      header: 'Identified Patient',
      render: (s) => (
        <span className="text-xs font-semibold text-slate-800">
          {s.patient?.full_name || 'Unregistered / Onboarding'}
        </span>
      ),
    },
    {
      key: 'state',
      header: 'State Machine State',
      render: (s) => (
        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono text-[11px] font-bold border border-indigo-200">
          {s.state}
        </span>
      ),
    },
    {
      key: 'last_msg',
      header: 'Last Interaction',
      render: (s) => (
        <span className="text-xs text-slate-500">{formatDateTime(s.last_message_at)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Meta WhatsApp Cloud Telemetry & Simulator</h1>
          <p className="text-xs text-slate-500">
            Monitor incoming webhooks, inspect conversation state machines, and test end-to-end appointment scheduling
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedHospitalId}
            onChange={(e) => setSelectedHospitalId(e.target.value)}
            className="text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => loadData(selectedHospitalId)}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Webhook Configuration Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Webhook Verification</span>
          </div>
          <p className="text-sm font-bold text-slate-900">GET Verification Ready</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Token: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">clinicflow_verify_token_2026</code>
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-sky-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Atomic Booking Concurrency</span>
          </div>
          <p className="text-sm font-bold text-slate-900">PostgreSQL RPC Guard Active</p>
          <p className="text-[11px] text-slate-500 mt-1">Zero-race condition slot exclusion checks</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Idempotency Protection</span>
          </div>
          <p className="text-sm font-bold text-slate-900">Enforced by Unique Key</p>
          <p className="text-[11px] text-slate-500 mt-1">Duplicate webhooks automatically discarded</p>
        </div>
      </div>

      {/* Main Grid: Live Simulator + Telemetry Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Phone Simulator (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col h-[640px]">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">WhatsApp Patient Simulator</h3>
                <p className="text-[10px] text-slate-500">Test multi-tenant flows directly in browser</p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              LIVE
            </span>
          </div>

          {/* Sender Phone Selector */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-3 flex items-center gap-2 text-xs">
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-600">Simulate Number:</span>
            <input
              type="text"
              value={simPhone}
              onChange={(e) => setSimPhone(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 font-mono text-xs focus:outline-none"
              placeholder="+919811100001"
            />
          </div>

          {/* Chat Transcript Area */}
          <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-900 rounded-xl text-white font-sans text-xs">
            <div className="text-center text-[10px] text-slate-400 my-1">
              🔒 End-to-end encrypted medical consultation stream
            </div>

            {chatLog.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                  {/* Interactive Buttons */}
                  {msg.buttons && msg.buttons.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700 flex flex-col gap-1.5">
                      {msg.buttons.map(btn => (
                        <button
                          key={btn.id}
                          onClick={() => handleSendMessage(btn.title, btn.id)}
                          className="w-full text-center py-1.5 px-3 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 rounded-lg font-semibold text-xs border border-emerald-500/40 transition-colors"
                        >
                          {btn.title}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="text-[9px] text-slate-400 text-right mt-1 flex items-center justify-end gap-1">
                    <span>{msg.time}</span>
                    {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-emerald-300" />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input Strip */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="mt-3 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type 'Hi', 'Book', or doctor name..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={isSimulating}
            />
            <Button type="submit" size="sm" disabled={isSimulating || !inputText.trim()} className="bg-emerald-600 hover:bg-emerald-500">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>

        {/* Right Column: Sessions & Messages Log Tables (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Conversation Sessions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Active WhatsApp Sessions</h3>
                <p className="text-xs text-slate-500">Current state machine status per patient</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {sessions.length} sessions
              </span>
            </div>

            <DataTable
              columns={sessionColumns}
              data={sessions}
              keyExtractor={(s) => s.id}
            />
          </div>

          {/* Processed Messages Log */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live Inbound & Outbound Telemetry</h3>
                <p className="text-xs text-slate-500">Immutable log with unique idempotency identifiers</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {messages.length} events
              </span>
            </div>

            <DataTable
              columns={messageColumns}
              data={messages.slice(0, 8)}
              keyExtractor={(m) => m.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
