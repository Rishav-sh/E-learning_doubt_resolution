import { Client } from '@stomp/stompjs';

class WebSocketService {
    constructor() {
        this.client = null;
    }

    connect(onMessageReceived, onTypingReceived) {
        // Grab token securely from localStorage
        const token = localStorage.getItem('token');

        // Using pure native WebSockets avoids Vite 'global is not defined' crashes from SockJS
        this.client = new Client({
            brokerURL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/websocket',
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            reconnectDelay: 5000,
            onConnect: () => {
                console.log("React securely connected to Spring Boot WebSocket");
                // Subscribe exactly to our topic
                this.client.subscribe('/topic/messages', message => {
                    const parsedMessage = JSON.parse(message.body);
                    onMessageReceived(parsedMessage);
                });
                
                // Subscribe to Typing Indicator topic
                if (onTypingReceived) {
                    this.client.subscribe('/topic/typing', message => {
                        onTypingReceived(JSON.parse(message.body));
                    });
                }
            },
            onStompError: (frame) => {
                console.error("Broker reported error: " + frame.headers['message']);
                console.error("Additional details: " + frame.body);
            }
        });

        this.client.activate();
    }

    sendMessage(doubtId, senderId, content) {
        if (this.client && this.client.connected) {
            const payload = {
                doubtId: doubtId,
                senderId: senderId,
                content: content
            };
            this.client.publish({
                destination: '/app/chat',
                body: JSON.stringify(payload)
            });
        } else {
            console.error("STOMP Client not connected or undefined");
        }
    }

    sendTypingIndicator(doubtId, senderId, senderUsername, isTyping) {
        if (this.client && this.client.connected) {
            this.client.publish({
                destination: '/app/typing',
                body: JSON.stringify({ doubtId, senderId, senderUsername, isTyping })
            });
        }
    }

    disconnect() {
        if (this.client !== null) {
            this.client.deactivate();
        }
        console.log("Disconnected from WebSockets");
    }
}

// We export a single instance so the connection is shared
const instance = new WebSocketService();
export default instance;
