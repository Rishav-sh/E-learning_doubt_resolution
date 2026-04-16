import { useState } from 'react';
import api from '../services/api';
import './LoginUI.css';

const LoginUI = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    // Toggle between Login and Registration
    const [isRegistering, setIsRegistering] = useState(false);
    const [registerRole, setRegisterRole] = useState("STUDENT");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        setIsLoading(true);

        try {
            if (isRegistering) {
                // Register the user beautifully
                await api.post('/auth/signup', {
                    username,
                    password,
                    role: registerRole // Dynamically assigned via UI
                });
                
                setSuccessMsg("Account successfully created! Please drop down and Sign In.");
                setIsRegistering(false); // Switch back to login beautifully
            } else {
                // Standard Login Procedure
                const response = await api.post('/auth/signin', { username, password });
                const data = response.data;
                
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify({
                    id: data.id,
                    username: data.username,
                    role: data.role
                }));

                onLoginSuccess();
            }
        } catch (err) {
            console.error(err);
            if (isRegistering) {
                setError(err.response?.data?.message || "Failed to register. Username might exist.");
            } else {
                setError("Invalid credentials. Have you created this account yet?");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>{isRegistering ? "Create an Account" : "Welcome Back"}</h2>
                <p>{isRegistering ? "Sign up to ask your doubts." : "Sign in to resolve doubts instantly."}</p>
                
                {error && <div className="error-banner">{error}</div>}
                {successMsg && <div className="success-banner" style={{background: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.9rem'}}>{successMsg}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Username</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                            placeholder="e.g. alice"
                        />
                    </div>
                    
                    <div className="input-group">
                        <label>Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>

                    {isRegistering && (
                        <div className="input-group">
                            <label>Select your Role</label>
                            <select 
                                value={registerRole} 
                                onChange={(e) => setRegisterRole(e.target.value)}
                                style={{width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1'}}
                            >
                                <option value="STUDENT">I am a Student</option>
                                <option value="EXPERT">I am an Expert</option>
                            </select>
                        </div>
                    )}

                    <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? "Processing..." : (isRegistering ? "Register Account" : "Sign In securely")}
                    </button>
                    
                    <div style={{marginTop: '1rem', fontSize: '0.9rem', color: '#64748b'}}>
                        {isRegistering ? "Already have an account? " : "Don't have an account? "}
                        <button 
                            type="button" 
                            onClick={() => { setIsRegistering(!isRegistering); setError(""); setSuccessMsg(""); }} 
                            style={{background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', padding: 0}}
                        >
                            {isRegistering ? "Sign In" : "Register here"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginUI;
