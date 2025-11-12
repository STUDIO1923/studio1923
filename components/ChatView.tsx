import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import * as chatService from '../services/chatService';

interface ChatViewProps {
    nickname: string;
}

const channel = new BroadcastChannel('chat_channel');

const ChatView: React.FC<ChatViewProps> = ({ nickname }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const loadMessages = async () => {
            try {
                const initialMessages = await chatService.getMessages();
                setMessages(initialMessages);
            } catch (error) {
                console.error("Failed to load chat messages:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadMessages();

        const handleNewMessage = (event: MessageEvent) => {
            const receivedMessage: ChatMessage = event.data;
            setMessages(prev => [...prev, receivedMessage]);
        };

        channel.addEventListener('message', handleNewMessage);

        return () => {
            channel.removeEventListener('message', handleNewMessage);
        };
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const sentMessage = await chatService.sendMessage(nickname, newMessage.trim());
            // Update local state immediately for responsiveness
            setMessages(prev => [...prev, sentMessage]);
            // Broadcast to other tabs
            channel.postMessage(sentMessage);
            setNewMessage('');
        } catch (error) {
            console.error("Failed to send message:", error);
            // Optionally show an error to the user
        }
    };
    
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl max-w-4xl mx-auto h-[80vh] flex flex-col">
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {isLoading ? (
                    <p className="text-center text-slate-400 py-16">กำลังโหลดแชท...</p>
                ) : messages.length === 0 ? (
                    <p className="text-center text-slate-500 py-16">ยังไม่มีข้อความ เริ่มบทสนทนาได้เลย!</p>
                ) : (
                    messages.map(msg => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.nickname === nickname ? 'justify-end' : 'justify-start'}`}>
                            {msg.nickname !== nickname && <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0" title={msg.nickname}>{msg.nickname.charAt(0).toUpperCase()}</div>}
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg shadow-md ${msg.nickname === nickname ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                                {msg.nickname !== nickname && <p className="font-bold text-xs text-indigo-300 mb-1">{msg.nickname}</p>}
                                <p className="text-sm break-words">{msg.message}</p>
                                <p className={`text-xs mt-1 opacity-70 ${msg.nickname === nickname ? 'text-right' : 'text-left'}`}>{formatDate(msg.timestamp)}</p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-slate-700 bg-slate-800/60">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="พิมพ์ข้อความ..."
                        className="flex-grow bg-slate-900 border border-slate-600 rounded-full py-2 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        autoComplete="off"
                    />
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!newMessage.trim()}>
                        ส่ง
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatView;
