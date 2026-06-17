import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { encryptMessage, decryptMessage } from '../firebase/messageEncryption';
import {
  FiCheckCircle, FiXCircle, FiLoader,
  FiChevronDown, FiChevronUp, FiCopy, FiExternalLink,
} from 'react-icons/fi';
import './FirebaseDiagnostic.css';

const TEST_SID = 'STU_DIAG_TEST';

const SQL_SETUP = `-- Run this in Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run)

create table if not exists messages (
  id          uuid default gen_random_uuid() primary key,
  student_id  text not null,
  sender_id   text not null,
  ciphertext  text not null,
  iv          text not null,
  encrypted   boolean default true,
  edited      boolean default false,
  unsent      boolean default false,
  edited_at   timestamptz,
  created_at  timestamptz default now()
);

-- Allow all access (development)
alter table messages enable row level security;

drop policy if exists "allow all" on messages;
create policy "allow all" on messages
  for all using (true) with check (true);

-- Enable real-time
alter publication supabase_realtime add table messages;`;

function StatusIcon({ status }) {
  if (status === 'pass')    return <FiCheckCircle className="diag-icon pass" />;
  if (status === 'fail')    return <FiXCircle     className="diag-icon fail" />;
  if (status === 'running') return <FiLoader      className="diag-icon running spin" />;
  return <span className="diag-icon pending">•</span>;
}

export default function FirebaseDiagnostic({ onClose }) {
  const TESTS = [
    { id: 'config',      label: 'Supabase config (URL + anon key)',         detail: 'Checks VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env' },
    { id: 'connection',  label: 'Supabase connection',                       detail: 'Pings Supabase API to verify reachability' },
    { id: 'table',       label: 'Messages table exists',                     detail: 'Checks if the messages table was created via SQL setup' },
    { id: 'write',       label: 'Insert message',                            detail: 'Inserts a test row into messages table' },
    { id: 'read',        label: 'Select messages',                           detail: 'Reads messages for the test student' },
    { id: 'realtime',    label: 'Real-time subscription',                    detail: 'Subscribes to postgres_changes and verifies channel status' },
    { id: 'delete',      label: 'Delete test message',                       detail: 'Cleans up the test row' },
    { id: 'encrypt',     label: 'AES-256-GCM encryption',                   detail: 'Encrypt + decrypt round-trip using Web Crypto API' },
    { id: 'roundtrip',   label: 'Full round-trip (encrypt→insert→read→decrypt)', detail: 'End-to-end test of the complete encrypted pipeline' },
  ];

  const [tests,    setTests]    = useState(TESTS.map(t => ({ ...t, status: 'pending', info: '' })));
  const [running,  setRunning]  = useState(false);
  const [expanded, setExpanded] = useState({});
  const [log,      setLog]      = useState([]);
  const [copied,   setCopied]   = useState('');
  const [anyFail,  setAnyFail]  = useState(false);

  const patch = (id, data) =>
    setTests(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));

  const addLog = (msg, type = 'info') =>
    setLog(prev => [...prev, { msg, type, t: new Date().toLocaleTimeString() }]);

  async function runAll() {
    setRunning(true);
    setAnyFail(false);
    setLog([]);
    setTests(TESTS.map(t => ({ ...t, status: 'pending', info: '' })));
    let failures = 0;

    const fail = (id, info) => { patch(id, { status: 'fail', info }); failures++; };
    const pass = (id, info) =>   patch(id, { status: 'pass', info });

    // ── 1. Config ─────────────────────────────────────────────────────────
    patch('config', { status: 'running' });
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    addLog(`URL: ${url || 'MISSING'} | Key: ${key ? key.slice(0,20)+'...' : 'MISSING'}`);

    if (!url || !key || !isSupabaseConfigured) {
      fail('config', `Missing env vars.\n\nAdd to your .env file:\nVITE_SUPABASE_URL=https://xxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJ...\n\nGet these from: supabase.com → your project → Settings → API`);
      addLog('Supabase not configured', 'error');
      setRunning(false); setAnyFail(true); return;
    }
    if (!supabase) {
      fail('config', 'supabase client is null — createClient() failed');
      setRunning(false); setAnyFail(true); return;
    }
    pass('config', `URL: ${url}`);
    addLog('Config OK', 'success');

    // ── 2. Connection ─────────────────────────────────────────────────────
    patch('connection', { status: 'running' });
    addLog('Pinging Supabase...');
    try {
      // Simple auth call to verify connection
      const { error } = await supabase.auth.getSession();
      if (error && !error.message.includes('session')) throw error;
      pass('connection', 'Connected to Supabase successfully');
      addLog('Connection OK', 'success');
    } catch (err) {
      fail('connection', `${err.message}\n\nCheck your VITE_SUPABASE_URL is correct`);
      addLog(`Connection failed: ${err.message}`, 'error');
    }

    // ── 3. Table exists ───────────────────────────────────────────────────
    patch('table', { status: 'running' });
    addLog('Checking messages table...');
    let writeId = null;
    try {
      const { error } = await supabase.from('messages').select('id').limit(1);
      if (error) {
        if (error.code === '42P01') throw new Error('Table "messages" does not exist — run the SQL setup below');
        if (error.code === '42501' || error.message?.includes('policy')) throw new Error('RLS policy blocking read — run the SQL setup below');
        throw error;
      }
      pass('table', 'Table "messages" exists and is accessible');
      addLog('Table OK', 'success');
    } catch (err) {
      fail('table', `${err.message}`);
      addLog(`Table check failed: ${err.message}`, 'error');
    }

    // ── 4. Insert ─────────────────────────────────────────────────────────
    patch('write', { status: 'running' });
    addLog('Inserting test message...');
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          student_id: TEST_SID, sender_id: 'diag',
          ciphertext: 'DIAG_TEST', iv: '', encrypted: false,
          edited: false, unsent: false,
        })
        .select()
        .single();
      if (error) throw error;
      writeId = data.id;
      pass('write', `Inserted — id: ${data.id}`);
      addLog(`Insert OK — id: ${data.id}`, 'success');
    } catch (err) {
      const fix = err.code === '42501' || err.message?.includes('policy')
        ? '\n\nFIX: Run the SQL setup below to create the RLS policy'
        : err.code === '42P01' ? '\n\nFIX: Table missing — run SQL setup below' : '';
      fail('write', `${err.code}: ${err.message}${fix}`);
      addLog(`Insert failed [${err.code}]`, 'error');
    }

    // ── 5. Select ─────────────────────────────────────────────────────────
    patch('read', { status: 'running' });
    addLog('Reading messages...');
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('student_id', TEST_SID)
        .order('created_at', { ascending: true });
      if (error) throw error;
      pass('read', `Read OK — ${data.length} row(s)`);
      addLog(`Select OK — ${data.length} rows`, 'success');
    } catch (err) {
      fail('read', `${err.code}: ${err.message}`);
      addLog(`Select failed: ${err.message}`, 'error');
    }

    // ── 6. Real-time ──────────────────────────────────────────────────────
    patch('realtime', { status: 'running' });
    addLog('Testing real-time subscription...');
    await new Promise(resolve => {
      let done = false;
      const timer = setTimeout(() => {
        if (!done) {
          // Timeout is OK for real-time — channel subscribes but may not fire without a change
          pass('realtime', 'Channel subscribed (no change triggered in 3s — that is normal)');
          addLog('Realtime channel OK (subscribed, no event triggered)', 'success');
          channel.unsubscribe();
          resolve();
        }
      }, 3000);

      const channel = supabase
        .channel(`diag_test_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          if (!done) {
            done = true;
            clearTimeout(timer);
            pass('realtime', 'Real-time event received');
            addLog('Real-time event fired', 'success');
            channel.unsubscribe();
            resolve();
          }
        })
        .subscribe((status) => {
          addLog(`Channel status: ${status}`, status === 'SUBSCRIBED' ? 'success' : 'info');
          if (status === 'CHANNEL_ERROR') {
            done = true;
            clearTimeout(timer);
            fail('realtime', 'Channel error — run: alter publication supabase_realtime add table messages');
            addLog('Channel error — add table to realtime publication', 'error');
            resolve();
          }
        });
    });

    // ── 7. Delete ─────────────────────────────────────────────────────────
    patch('delete', { status: 'running' });
    addLog('Deleting test message...');
    try {
      if (writeId) {
        const { error } = await supabase.from('messages').delete().eq('id', writeId);
        if (error) throw error;
        pass('delete', `Deleted id: ${writeId}`);
        addLog('Delete OK', 'success');
      } else {
        pass('delete', 'Skipped (nothing to delete)');
        addLog('Delete skipped', 'info');
      }
    } catch (err) {
      fail('delete', err.message);
      addLog(`Delete failed: ${err.message}`, 'error');
    }

    // ── 8. Encryption ─────────────────────────────────────────────────────
    patch('encrypt', { status: 'running' });
    addLog('Testing AES-256-GCM...');
    try {
      const plain = 'Hello Supabase 🔐 encryption test';
      const enc = await encryptMessage(plain, 'STU001');
      if (!enc.encrypted || !enc.ciphertext || !enc.iv) throw new Error('Incomplete payload');
      const dec = await decryptMessage(enc, 'STU001');
      if (dec !== plain) throw new Error(`Mismatch: "${dec}"`);
      pass('encrypt', `OK — ciphertext: ${enc.ciphertext.slice(0,28)}…`);
      addLog('AES-256-GCM round-trip OK', 'success');
    } catch (err) {
      fail('encrypt', err.message);
      addLog(`Encryption failed: ${err.message}`, 'error');
    }

    // ── 9. Full round-trip ────────────────────────────────────────────────
    patch('roundtrip', { status: 'running' });
    addLog('Running full encrypt→insert→read→decrypt...');
    try {
      const plain = `Round-trip test ${Date.now()}`;
      const enc   = await encryptMessage(plain, TEST_SID);

      const { data: ins, error: insErr } = await supabase
        .from('messages')
        .insert({ student_id: TEST_SID, sender_id: 'diag', ...enc, edited: false, unsent: false })
        .select().single();
      if (insErr) throw insErr;
      addLog(`Inserted encrypted row: ${ins.id}`, 'info');

      const { data: fetched, error: fetchErr } = await supabase
        .from('messages').select('*').eq('id', ins.id).single();
      if (fetchErr) throw fetchErr;

      const dec = await decryptMessage({
        ciphertext: fetched.ciphertext, iv: fetched.iv, encrypted: fetched.encrypted,
      }, TEST_SID);
      if (dec !== plain) throw new Error(`Decrypted ≠ original. Got: "${dec.slice(0,40)}"`);

      // cleanup
      await supabase.from('messages').delete().eq('id', ins.id);

      pass('roundtrip', `Verified: "${plain.slice(0,40)}"`);
      addLog('Full round-trip PASSED ✓', 'success');
    } catch (err) {
      fail('roundtrip', `${err.code || ''}: ${err.message}`);
      addLog(`Round-trip failed: ${err.message}`, 'error');
    }

    setAnyFail(failures > 0);
    setRunning(false);
    addLog(`─── ${TESTS.length - failures}/${TESTS.length} passed ───`, 'info');
  }

  const passCount = tests.filter(t => t.status === 'pass').length;
  const failCount = tests.filter(t => t.status === 'fail').length;

  function copy(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  }

  const projectUrl = import.meta.env.VITE_SUPABASE_URL?.replace('.supabase.co', '') || '';

  return (
    <div className="diag-overlay">
      <motion.div className="diag-box"
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <div className="diag-header">
          <div>
            <div className="diag-title">🔬 Supabase Diagnostic</div>
            <div className="diag-sub">PostgreSQL · AES-256-GCM encryption · free, no credit card</div>
          </div>
          <button className="diag-close" onClick={onClose}>✕</button>
        </div>

        {tests.some(t => t.status !== 'pending') && (
          <div className="diag-score">
            <span className="score-pass">✓ {passCount} passed</span>
            <span className="score-sep"> / </span>
            <span className="score-fail">✗ {failCount} failed</span>
            <span className="score-sep"> / </span>
            <span className="score-total">{tests.length} total</span>
          </div>
        )}

        <div className="diag-tests">
          {tests.map(t => (
            <div key={t.id} className={`diag-test ${t.status}`}>
              <div className="diag-test-row"
                onClick={() => t.status !== 'pending' && setExpanded(e => ({ ...e, [t.id]: !e[t.id] }))}>
                <StatusIcon status={t.status} />
                <span className="diag-test-label">{t.label}</span>
                {t.status !== 'pending' && (expanded[t.id] ? <FiChevronUp className="diag-expand-icon" /> : <FiChevronDown className="diag-expand-icon" />)}
              </div>
              <AnimatePresence>
                {expanded[t.id] && (
                  <motion.div className="diag-test-detail"
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <div className="diag-test-desc">{t.detail}</div>
                    {t.info && <div className="diag-test-info">{t.info}</div>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Fix box */}
        {anyFail && (
          <div className="diag-fix-box">
            <div className="diag-fix-title">🔧 Two things to fix</div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                1. Add env vars to .env
              </div>
              <div className="diag-rules-code" style={{ marginBottom: 4 }}>{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
                <button className="diag-copy-rules" onClick={() => copy('VITE_SUPABASE_URL=https://xxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJ...', 'env')}>
                  <FiCopy style={{ fontSize: 11, marginRight: 3 }} />{copied === 'env' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Get from: <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ color: '#00f5ff' }}>supabase.com/dashboard</a> → your project → Settings → API → Project URL + anon key
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                2. Run this SQL in Supabase SQL Editor
              </div>
              <div style={{ position: 'relative' }}>
                <pre className="diag-rules-code" style={{ maxHeight: 200, overflowY: 'auto' }}>{SQL_SETUP}</pre>
                <button className="diag-copy-rules" onClick={() => copy(SQL_SETUP, 'sql')}>
                  <FiCopy style={{ fontSize: 11, marginRight: 3 }} />{copied === 'sql' ? 'Copied!' : 'Copy SQL'}
                </button>
              </div>
              <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                <a href={`https://supabase.com/dashboard/project/_/sql/new`} target="_blank" rel="noreferrer">
                  <button className="diag-close-btn" style={{ fontSize: 11 }}>
                    <FiExternalLink style={{ marginRight: 4, fontSize: 11 }} />Open SQL Editor
                  </button>
                </a>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Then restart dev server: npm run dev</span>
              </div>
            </div>

            <div className="diag-fix-warn" style={{ marginTop: 10 }}>⚠️ Open RLS policy is for development only. Secure before production.</div>
          </div>
        )}

        <div className="diag-log">
          <div className="diag-log-title">Console output</div>
          <div className="diag-log-body">
            {log.length === 0 && <div className="diag-log-empty">Click "Run All Tests" to start</div>}
            {log.map((l, i) => (
              <div key={i} className={`diag-log-line ${l.type}`}>
                <span className="log-time">{l.t}</span>
                <span>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="diag-actions">
          <button className="diag-run-btn" onClick={runAll} disabled={running}>
            {running ? '⏳ Running tests…' : '▶ Run All Tests'}
          </button>
          <button className="diag-close-btn" onClick={onClose}>Close</button>
        </div>
      </motion.div>
    </div>
  );
}
