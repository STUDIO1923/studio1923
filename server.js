// server.js

// 1. Import Dependencies
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path'); // Add path module

// 2. Setup Server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow connections from any origin
    methods: ["GET", "POST"]
  }
});

// --- NEW: Serve static frontend files ---
// This tells Express to serve the built React app from the 'dist' folder
app.use(express.static(path.join(__dirname, 'dist')));


// 3. In-Memory "Database"
let users = {}; // Store online user data { socketId: { petData } }
let messages = [
    { id: 1, sender: { name: 'ระบบ', emoji: '🤖' }, text: 'ยินดีต้อนรับสู่ EmojiMon World!' },
];

// 4. Handle Real-time Connections
io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);

  // Event: When a new player joins the world
  socket.on('join', (petData) => {
    // Avoid duplicate users if they reconnect quickly
    const existingUser = Object.values(users).find(u => u.name === petData.name);
    if(existingUser) {
        console.log(`${petData.name} reconnected.`);
    } else {
        console.log(`${petData.name} (${petData.emoji}) has joined.`);
    }
    
    users[socket.id] = petData;

    // Send essential data to the new player
    socket.emit('init_data', {
      messages: messages,
      onlineUsers: Object.values(users)
    });

    // Announce the new player to everyone else
    socket.broadcast.emit('user_joined', petData);
  });

  // Event: When a new message is sent
  socket.on('sendMessage', (messageData) => {
    const newMessage = {
        id: Date.now(),
        sender: messageData.sender,
        text: messageData.text
    };
    messages.push(newMessage);
    
    // Broadcast the new message to all connected clients
    io.emit('newMessage', newMessage);
  });


  // Event: When a player disconnects
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const disconnectedUser = users[socket.id];
    if (disconnectedUser) {
        // Announce that the player has left
        io.emit('user_left', disconnectedUser);
        delete users[socket.id];
    }
  });
});

// --- NEW: Catch-all route ---
// This makes sure that if a user refreshes on a page like /game,
// the server sends them the main index.html file to let React handle routing.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


// 5. Start Listening
const PORT = process.env.PORT || 3001;
// THE FIX: Listen on '0.0.0.0' to accept connections from outside the container.
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});