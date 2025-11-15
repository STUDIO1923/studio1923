import React, { createContext, useState, ReactNode, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { EmojiMon, Message, AppState, AppContextType, InitData } from '../types';

// --- PRODUCTION-READY SETUP ---
// An empty string tells Socket.IO to connect to the same host that served the page.
// This works for both localhost and your live Render URL automatically!
const SERVER_URL = ''; 

const INITIAL_STATE: AppState = {
  isConnected: false,
  currentUser: null,
  onlineUsers: [],
  messages: [],
};

export const AppContext = createContext<AppContextType>({
    ...INITIAL_STATE,
    joinWorld: () => console.warn('joinWorld function not ready'),
    sendMessage: () => console.warn('sendMessage function not ready'),
});

interface AppProviderProps {
    children: ReactNode;
    petToJoin: EmojiMon | null;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, petToJoin }) => {
    const [state, setState] = useState<AppState>(INITIAL_STATE);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!petToJoin) return; // Only connect when a pet is ready

        // Connect to the server
        const socket = io(SERVER_URL);
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to server!');
            setState(prevState => ({ ...prevState, isConnected: true }));
            // A pet is ready, let's join the world
            joinWorld(petToJoin);
        });
        
        // Listener for initial data when joining
        socket.on('init_data', (data: InitData) => {
             setState(prevState => ({
                ...prevState,
                messages: data.messages,
                onlineUsers: data.onlineUsers
             }));
        });

        // Listener for new messages from anyone
        socket.on('newMessage', (newMessage: Message) => {
            setState(prevState => ({
                ...prevState,
                messages: [...prevState.messages, newMessage]
            }));
        });
        
        // Listener for when a new user joins
        socket.on('user_joined', (newUser: EmojiMon) => {
            // Prevent adding duplicates if user already in list
            setState(prevState => ({
                ...prevState,
                onlineUsers: prevState.onlineUsers.some(u => u.name === newUser.name) 
                    ? prevState.onlineUsers 
                    : [...prevState.onlineUsers, newUser]
            }));
        });
        
        // Listener for when a user leaves
        socket.on('user_left', (leftUser: EmojiMon) => {
            setState(prevState => ({
                ...prevState,
                onlineUsers: prevState.onlineUsers.filter(user => user.name !== leftUser.name)
            }));
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from server.');
            setState(prevState => ({ ...prevState, isConnected: false }));
        });

        // Cleanup on component unmount
        return () => {
            socket.disconnect();
        };

    }, [petToJoin]); // Rerun effect if the pet changes

    const joinWorld = (pet: EmojiMon) => {
        socketRef.current?.emit('join', pet);
        setState(prevState => ({ ...prevState, currentUser: pet }));
    };

    const sendMessage = (text: string) => {
        if (state.currentUser) {
            const messageData = {
                sender: {
                    name: state.currentUser.name,
                    emoji: state.currentUser.emoji,
                },
                text: text,
            };
            socketRef.current?.emit('sendMessage', messageData);
        }
    };
    
    return (
        <AppContext.Provider value={{ ...state, joinWorld, sendMessage }}>
            {children}
        </AppContext.Provider>
    );
};