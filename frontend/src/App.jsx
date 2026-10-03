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
  const [project, setProject] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [analysis, setAnalysis] = useState({projects: [], users: []});
  const [activeTab, setActiveTab] = useState('timer');

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
      project: project || null,
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
    return `${h.toString().padStart(2,'0')}:${(m % 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`;
  };

  if (!token) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          width: '360px'
        }}>
          <h1 style={{textAlign: 'center', marginBottom: '30px', color: '#333'}}>Toggl Web Tracker</h1>
          <input 
            placeholder="Email" 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
            style={{
              width:'100%', 
              padding:'12px', 
              margin:'10px 0',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px'
            }} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            style={{
              width:'100%', 
              padding:'12px', 
              margin:'10px 0',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px'
            }} 
          />
          <button 
            onClick={login} 
            style={{
              width:'100%', 
              padding:'12px', 
              background:'#667eea', 
              color:'white', 
              border:'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              marginTop: '10px',
              cursor: 'pointer'
            }}
          >
            Login
          </button>
          <p style={{marginTop:'20px', fontSize:'12px', textAlign: 'center', color: '#666'}}>Default: admin@local / admin123</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{display: 'flex', minHeight: '100vh', background: '#f5f7fa', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}}>
      <div style={{
        width: '240px',
        background: '#1e293b',
        color: 'white',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{padding: '0 20px', marginBottom: '30px'}}>
          <h2 style={{margin: 0, fontSize: '20px', fontWeight: 'bold'}}>Toggl Tracker</h2>
        </div>
        <nav style={{flex: 1}}>
          {[
            {id: 'timer', label: 'Timer', icon: '⏱️'},
            {id: 'reports', label: 'Reports', icon: '📊'},
            {id: 'entries', label: 'Time Entries', icon: '📝'},
            {id: 'import', label: 'Import', icon: '⬇️'}
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: activeTab === item.id ? '#334155' : 'transparent',
                color: 'white',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{padding: '20px', borderTop: '1px solid #334155'}}>
          <button 
            onClick={() => {localStorage.removeItem('token'); setToken('')}}
            style={{
              width: '100%',
              padding: '10px',
              background: 'transparent',
              color: '#94a3b8',
              border: '1px solid #334155',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{flex: 1, padding: '30px'}}>
        {activeTab === 'timer' && (
          <div>
            <h1 style={{margin: '0 0 30px 0', color: '#1e293b', fontSize: '28px'}}>Timer</h1>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              marginBottom: '30px'
            }}>
              <div style={{display: 'flex', gap: '20px', alignItems: 'flex-end', marginBottom: '20px'}}>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#475569'}}>Description</label>
                  <input 
                    placeholder="What are you working on?" 
                    value={description} 
                    onChange={e=>setDescription(e.target.value)} 
                    style={{
                      width:'100%', 
                      padding:'12px', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }} 
                  />
                </div>
                <div style={{width: '200px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#475569'}}>Project</label>
                  <select 
                    value={project} 
                    onChange={e=>setProject(e.target.value)}
                    style={{
                      width:'100%', 
                      padding:'12px', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'white'
                    }}
                  >
                    <option value="">No project</option>
                    <option value="Development">Development</option>
                    <option value="Design">Design</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Research">Research</option>
                  </select>
                </div>
              </div>
              <div style={{textAlign: 'center', margin: '40px 0'}}>
                <div style={{
                  fontSize: '72px',
                  fontFamily: 'monospace',
                  fontWeight: '300',
                  color: '#1e293b',
                  letterSpacing: '2px'
                }}>
                  {formatTime(elapsed)}
                </div>
                <div style={{marginTop: '30px'}}>
                  {!isTimerRunning ? 
                    <button 
                      onClick={startTimer} 
                      style={{
                        padding:'16px 48px', 
                        background:'#10b981', 
                        color:'white', 
                        border:'none',
                        borderRadius: '8px',
                        fontSize: '18px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                      }}
                    >
                      ▶ Start Timer
                    </button> :
                    <button 
                      onClick={stopTimer} 
                      style={{
                        padding:'16px 48px', 
                        background:'#ef4444', 
                        color:'white', 
                        border:'none',
                        borderRadius: '8px',
                        fontSize: '18px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
                      }}
                    >
                      ■ Stop Timer
                    </button>
                  }
                </div>
              </div>
            </div>
            <h2 style={{color: '#1e293b', fontSize: '20px', marginBottom: '15px'}}>Recent Time Entries</h2>
            <div style={{background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}}>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background: '#f8fafc', borderBottom: '1px solid #e2e8f0'}}>
                    <th style={{padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b'}}>DESCRIPTION</th>
                    <th style={{padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b'}}>PROJECT</th>
                    <th style={{padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b'}}>DURATION</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.slice(0, 5).map(e => (
                    <tr key={e.id} style={{borderBottom: '1px solid #f1f5f9'}}>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: '#1e293b'}}>{e.description}</td>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: '#64748b'}}>{e.project || '-'}</td>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: '#64748b'}}>{Math.floor(e.duration_seconds/60)} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'reports' && (
          <div>
            <h1 style={{margin: '0 0 30px 0', color: '#1e293b', fontSize: '28px'}}>Reports</h1>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px'}}>
              <div style={{background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}}>
                <h3 style={{margin: '0 0 20px 0', color: '#1e293b', fontSize: '16px'}}>Project Hours</h3>
                {analysis.projects.map((p, i) => (
                  <div key={i} style={{marginBottom: '12px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                      <span style={{fontSize: '14px', color: '#475569'}}>{p.project}</span>
                      <span style={{fontSize: '14px', fontWeight: '600', color: '#1e293b'}}>{p.hours}h</span>
                    </div>
                    <div style={{height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden'}}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, p.hours * 10)}%`,
                        background: 'linear-gradient(90deg, #667eea, #764ba2)'
                      }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}}>
                <h3 style={{margin: '0 0 20px 0', color: '#1e293b', fontSize: '16px'}}>User Activity</h3>
                {analysis.users.map((u, i) => (
                  <div key={i} style={{display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9'}}>
                    <span style={{fontSize: '14px', color: '#475569'}}>{u.user}</span>
                    <span style={{fontSize: '14px', fontWeight: '600', color: '#1e293b'}}>{u.hours}h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'entries' && (
          <div>
            <h1 style={{margin: '0 0 30px 0', color: '#1e293b', fontSize: '28px'}}>Time Entries</h1>
            <div style={{background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}}>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background: '#f8fafc', borderBottom: '1px solid #e2e8f0'}}>
                    <th style={{padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b'}}>ID</th>
                    <th style={{padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b'}}>DESCRIPTION</th>
                    <th style={{padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b'}}>PROJECT</th>
                    <th style={{padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b'}}>DURATION</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e.id} style={{borderBottom: '1px solid #f1f5f9'}}>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: '#64748b'}}>{e.id}</td>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: '#1e293b'}}>{e.description}</td>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: '#64748b'}}>{e.project || '-'}</td>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: '#64748b'}}>{Math.floor(e.duration_seconds/60)} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'import' && (
          <div>
            <h1 style={{margin: '0 0 30px 0', color: '#1e293b', fontSize: '28px'}}>Import from Toggl</h1>
            <div style={{background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}}>
              <div style={{marginBottom: '20px'}}>
                <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#475569'}}>Toggl API Token</label>
                <input 
                  placeholder="Enter your Toggl API token" 
                  value={apiToken} 
                  onChange={e=>setApiToken(e.target.value)} 
                  style={{
                    width:'100%', 
                    padding:'12px', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }} 
                />
              </div>
              <div style={{marginBottom: '20px'}}>
                <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#475569'}}>Workspace ID</label>
                <input 
                  placeholder="Enter workspace ID" 
                  value={workspaceId} 
                  onChange={e=>setWorkspaceId(e.target.value)} 
                  style={{
                    width:'100%', 
                    padding:'12px', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }} 
                />
              </div>
              <button 
                onClick={importToggl} 
                style={{
                  padding:'12px 24px', 
                  background:'#667eea', 
                  color:'white', 
                  border:'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Import Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
