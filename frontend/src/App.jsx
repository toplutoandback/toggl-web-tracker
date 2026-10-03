import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://toggl-web-backend-se54.onrender.com';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [entries, setEntries] = useState([]);
  const [apiToken, setApiToken] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [description, setDescription] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [analysis, setAnalysis] = useState({projects: [], users: []});

  useEffect(() => {
    if (token) {
      fetchEntries();
      fetchAnalysis();
    }
  }, [token]);

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsed(Date.now() - timerStart);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerStart]);

  const login = async () => {
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      const res = await axios.post(`${API_URL}/token`, formData);
      localStorage.setItem('token', res.data.access_token);
      setToken(res.data.access_token);
    } catch (e) {
      alert('Login failed');
    }
  };

  const fetchEntries = async () => {
    const res = await axios.get(`${API_URL}/time_entries`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setEntries(res.data);
  };

  const fetchAnalysis = async () => {
    const [projRes, userRes] = await Promise.all([
      axios.get(`${API_URL}/analysis/projects`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_URL}/analysis/users`, { headers: { Authorization: `Bearer ${token}` } })
    ]);
    setAnalysis({ projects: projRes.data, users: userRes.data });
  };

  const importToggl = async () => {
    await axios.post(`${API_URL}/import/toggl?api_token=${apiToken}&workspace_id=${workspaceId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchEntries();
    fetchAnalysis();
  };

  const startTimer = () => {
    setIsTimerRunning(true);
    setTimerStart(Date.now());
  };

  const stopTimer = async () => {
    const duration = Math.floor((Date.now() - timerStart) / 1000);
    await axios.post(`${API_URL}/time_entries`, {
      description: description || 'Timer entry',
      start_time: new Date(timerStart).toISOString(),
      duration_seconds: duration,
      billable: false
    }, { headers: { Authorization: `Bearer ${token}` } });
    
    setIsTimerRunning(false);
    setElapsed(0);
    setTimerStart(null);
    fetchEntries();
  };

  const formatTime = (ms) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${h}:${(m % 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`;
  };

  if (!token) {
    return (
      <div style={{padding: '50px', maxWidth: '400px', margin: 'auto'}}>
        <h1>Toggl Web Tracker</h1>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%', padding:'10px', margin:'10px 0'}} />
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%', padding:'10px', margin:'10px 0'}} />
        <button onClick={login} style={{width:'100%', padding:'10px', background:'#007bff', color:'white', border:'none'}}>Login</button>
        <p style={{marginTop:'20px', fontSize:'12px'}}>Default: admin@local / admin123</p>
      </div>
    );
  }

  return (
    <div style={{padding: '20px', fontFamily: 'Arial'}}>
      <h1>Toggl Web Tracker</h1>
      
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
        <div>
          <h2>Timer</h2>
          <input placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} style={{width:'100%', padding:'8px', marginBottom:'10px'}} />
          <div style={{fontSize:'48px', fontFamily:'monospace', margin:'20px 0'}}>{formatTime(elapsed)}</div>
          {!isTimerRunning ? 
            <button onClick={startTimer} style={{padding:'10px 20px', background:'green', color:'white', border:'none'}}>Start</button> :
            <button onClick={stopTimer} style={{padding:'10px 20px', background:'red', color:'white', border:'none'}}>Stop</button>
          }
        </div>

        <div>
          <h2>Import from Toggl</h2>
          <input placeholder="Toggl API Token" value={apiToken} onChange={e=>setApiToken(e.target.value)} style={{width:'100%', padding:'8px', marginBottom:'10px'}} />
          <input placeholder="Workspace ID" value={workspaceId} onChange={e=>setWorkspaceId(e.target.value)} style={{width:'100%', padding:'8px', marginBottom:'10px'}} />
          <button onClick={importToggl} style={{padding:'10px 20px'}}>Import Data</button>
        </div>
      </div>

      <h2>Time Entries</h2>
      <table border="1" cellPadding="5" style={{width:'100%', borderCollapse:'collapse'}}>
        <thead><tr><th>ID</th><th>Description</th><th>Duration</th></tr></thead>
        <tbody>
          {entries.map(e => (
            <tr key={e.id}>
              <td>{e.id}</td>
              <td>{e.description}</td>
              <td>{Math.floor(e.duration_seconds/60)} min</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Project Performance</h2>
      <table border="1" cellPadding="5" style={{width:'100%', borderCollapse:'collapse'}}>
        <thead><tr><th>Project</th><th>Hours</th></tr></thead>
        <tbody>
          {analysis.projects.map((p,i) => (
            <tr key={i}><td>{p.project}</td><td>{p.hours}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
