import { useState, useEffect, useRef } from 'react';
import webSocketService from '../services/WebSocketService';
import api from '../services/api';
import './ChatUI.css';

const ChatUI = () => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    
    // Extracted directly and securely from our Login payload
    const currentUser = JSON.parse(localStorage.getItem('user') || "{}");
    const currentUserId = currentUser.id || null;
    const isStudent = currentUser.role === "STUDENT";
    const isExpert = currentUser.role === "EXPERT";

    const messagesEndRef = useRef(null);

    // Lifecycle State
    const [doubtId, setDoubtId] = useState(null);
    const [status, setStatus] = useState("NOT_CREATED");
    const [question, setQuestion] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    // Typing State
    const [typingUsers, setTypingUsers] = useState({});
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        // We only connect the WebSocket once the Doubt is actually created/picked up!
        if (status !== "NOT_CREATED" && doubtId) {
            webSocketService.connect(
                (newMessage) => {
                    setMessages((prev) => [...prev, newMessage]);
                },
                (typingEvent) => {
                    // Ignore our own typing events
                    if (typingEvent.senderId !== currentUserId) {
                        setTypingUsers(prev => {
                            const newMap = { ...prev };
                            if (typingEvent.isTyping) {
                                newMap[typingEvent.senderId] = typingEvent.senderUsername || 'Someone';
                            } else {
                                delete newMap[typingEvent.senderId];
                            }
                            return newMap;
                        });
                    }
                }
            );
            return () => webSocketService.disconnect();
        }
    }, [status, doubtId]);

    // Auto-scroll inside chat
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleCreateDoubt = async () => {
        if (question.trim() === '') return;
        setIsLoading(true);
        try {
            const res = await api.post('/doubts', { 
                question: question, 
                studentId: currentUserId 
            });
            setDoubtId(res.data.id);
            setStatus("OPEN");
             // Let's manually push the question into the message array so it looks like a chat message
            setMessages([{ 
                senderId: currentUserId, 
                content: "QUESTION: " + question, 
                timestamp: new Date().toISOString() 
            }]);
        } catch (err) {
            console.error("Failed to create doubt", err);
            alert("Failed to create doubt. " + (err.response?.data?.message || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    // For Testing Purposes: since H2 wipes, an expert needs to quickly "Find" Doubt #1 to pick it up
    const handleFindOpenDoubt = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/doubts');
            if (res.data && res.data.length > 0) {
                // Just grab the newest open doubt for this testing scenario
                const latestDoubt = res.data[0];
                setDoubtId(latestDoubt.id);
                setStatus("OPEN");
                setMessages([{ 
                    senderId: latestDoubt.studentId, 
                    content: "QUESTION: " + latestDoubt.question, 
                    timestamp: latestDoubt.createdAt || new Date().toISOString() 
                }]);
            } else {
                alert("No OPEN doubts exist currently. A student needs to create one first!");
            }
        } catch (err) {
            console.error("Failed to fetch doubts", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePickDoubt = async () => {
        if (!doubtId) return;
        setIsLoading(true);
        try {
            await api.put(`/doubts/${doubtId}/pickup/${currentUserId}`);
            setStatus("IN_PROGRESS");
        } catch (err) {
            console.error("Failed to pick doubt", err);
            alert("Failed to pick doubt. It might have been claimed already!");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResolveDoubt = async () => {
        if (!doubtId) return;
        setIsLoading(true);
        try {
            await api.put(`/doubts/${doubtId}/resolve`);
            setStatus("RESOLVED");
        } catch (err) {
            console.error("Failed to resolve doubt", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = () => {
        if (inputText.trim() === '' || status === 'RESOLVED') return;
        webSocketService.sendMessage(doubtId, currentUserId, inputText);
        // Force the typing indicator to stop instantly upon send
        webSocketService.sendTypingIndicator(doubtId, currentUserId, currentUser.username, false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setInputText("");
    };

    const handleInputChange = (e) => {
        setInputText(e.target.value);
        if (status === 'IN_PROGRESS') {
            // Instantly send typing=true flag to server
            webSocketService.sendTypingIndicator(doubtId, currentUserId, currentUser.username, true);
            
            // Clear any existing countdown
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            
            // Set 1.5s countdown to turn off typing flag
            typingTimeoutRef.current = setTimeout(() => {
                webSocketService.sendTypingIndicator(doubtId, currentUserId, currentUser.username, false);
            }, 1500);
        }
    };

    const getStatusColor = () => {
        if (status === 'OPEN') return '#eab308'; // Yellow
        if (status === 'IN_PROGRESS') return '#3b82f6'; // Blue
        if (status === 'RESOLVED') return '#10b981'; // Green
        return '#94a3b8'; // Gray
    };

    return (
        <div className="chat-container">
            <header className="chat-header">
                <div>
                    <h2>Real-Time Doubt Thread</h2>
                    {status !== "NOT_CREATED" && (
                        <div style={{marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <span style={{
                                backgroundColor: getStatusColor(),
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}>
                                {status.replace('_', ' ')}
                            </span>
                            <span style={{color: '#cbd5e1', fontSize: '0.8rem'}}>Doubt ID: #{doubtId}</span>
                        </div>
                    )}
                </div>
                
                <div className="chat-identity">
                    <span style={{color:'#cbd5e1', fontSize: '0.9rem'}}>
                        Logged in as: <strong style={{color:'white'}}>{currentUser.username || 'Unknown'} (Role: {currentUser.role})</strong>
                    </span>
                </div>
            </header>

            {/* ACTION BAR */}
            <div className="chat-actions" style={{padding: '12px 20px', backgroundColor: '#e2e8f0', borderBottom: '1px solid #cbd5e1', display: 'flex', gap: '10px', alignItems: 'center'}}>
                {status === "NOT_CREATED" && isStudent && (
                    <div style={{display:'flex', width:'100%', gap:'10px'}}>
                        <input 
                            type="text" 
                            style={{flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}} 
                            placeholder="What is your doubt?" 
                            value={question} 
                            onChange={e => setQuestion(e.target.value)}
                        />
                        <button onClick={handleCreateDoubt} disabled={isLoading} style={{padding: '8px 16px', background: '#3b82f6', color:'white', border:'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>
                            {isLoading ? "Creating..." : "Ask Question"}
                        </button>
                    </div>
                )}

                {status === "NOT_CREATED" && isExpert && (
                    <div style={{display:'flex', width:'100%', justifyContent:'center'}}>
                        <button onClick={handleFindOpenDoubt} disabled={isLoading} style={{padding: '8px 16px', background: '#10b981', color:'white', border:'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>
                             {isLoading ? "Scanning..." : "Scan for OPEN Doubts"}
                        </button>
                    </div>
                )}

                {status === "OPEN" && isExpert && (
                     <button onClick={handlePickDoubt} disabled={isLoading} style={{padding: '8px 16px', background: '#3b82f6', color:'white', border:'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%'}}>
                         {isLoading ? "Picking..." : "Pick Doubt"}
                     </button>
                )}

                {status === "IN_PROGRESS" && (
                    <button onClick={handleResolveDoubt} disabled={isLoading} style={{padding: '8px 16px', background: '#10b981', color:'white', border:'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%'}}>
                         {isLoading ? "Resolving..." : "Mark as Resolved"}
                    </button>
                )}
                
                {status === "RESOLVED" && (
                     <span style={{color: '#64748b', fontStyle: 'italic', margin: '0 auto'}}>This doubt has been fully resolved.</span>
                )}
            </div>
            
            <div className="chat-messages">
                {messages.length === 0 && <div className="empty-state">No messages yet.</div>}
                {messages.map((msg, index) => {
                    const isSentByMe = (msg.senderId === currentUserId);
                    return (
                        <div key={index} className={`msg-wrapper ${isSentByMe ? 'sent-wrapper' : 'received-wrapper'}`}>
                            <div className={`msg-bubble ${isSentByMe ? 'sent-msg' : 'received-msg'}`}>
                                <div className="msg-info">
                                    <span className="msg-sender">{isSentByMe ? 'You' : (msg.senderUsername || `User ${msg.senderId}`)}</span>
                                    <span className="msg-time">{new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <div className="msg-text">
                                    {msg.content.startsWith("QUESTION: ") ? <strong>{msg.content}</strong> : msg.content}
                                </div>
                            </div>
                        </div>
                    );
                })}
                
                {Object.keys(typingUsers).length > 0 && (
                    <div className="typing-indicator-wrapper">
                        <span className="typing-text">
                            {Object.values(typingUsers).join(', ')} {Object.values(typingUsers).length > 1 ? 'are' : 'is'} typing...
                        </span>
                        <div className="typing-dots">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className={`chat-input-area ${status !== 'IN_PROGRESS' ? 'disabled-area' : ''}`}>
                <input 
                    type="text" 
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={status === 'IN_PROGRESS' ? 'Type your message...' : 'Chat is not active...'}
                    disabled={status !== 'IN_PROGRESS'}
                />
                <button onClick={handleSend} className="send-btn" disabled={status !== 'IN_PROGRESS' || inputText.trim() === ''}>Send</button>
            </div>
        </div>
    );
};

export default ChatUI;
