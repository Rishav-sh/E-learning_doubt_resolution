import { useState, useEffect } from 'react'
import ChatUI from './components/ChatUI'
import LoginUI from './components/LoginUI'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check securely if we are allowed in on boot
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  return (
    <div className="App">
      {!isAuthenticated ? (
        <LoginUI onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div style={{minHeight: '100vh', background: '#e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: '600px', display: 'flex', justifyContent: 'flex-end', marginBottom: '-30px', zIndex: 10, position: 'relative'}}>
             <button 
                onClick={handleLogout}
                style={{background: '#ef4444', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold'}}
             >
                Logout
             </button>
          </div>
          <ChatUI />
        </div>
      )}
    </div>
  )
}

export default App
