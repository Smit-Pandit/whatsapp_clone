require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

const Message = require('./models/Message');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/login', async (req, res) => {
    const { username } = req.body;
    if (!username) return res.redirect('/');
    await User.updateOne({ username }, { username }, { upsert: true });
    res.redirect(`/dashboard/${username}`);
});

app.get('/dashboard/:username', async (req, res) => {
    const currentUser = req.params.username;
    const availableUsers = await User.find({ username: { $ne: currentUser } });
    
    const usersWithLastMessage = await Promise.all(availableUsers.map(async (user) => {
        const roomId = [currentUser, user.username].sort().join('_');
        const lastMessage = await Message.findOne({ roomId }).sort({ timestamp: -1 });

        // NEW: Count how many messages the OTHER person sent that you haven't read yet
        const unreadCount = await Message.countDocuments({
            roomId: roomId,
            senderId: user.username,
            status: { $ne: 'read' }
        });

        return {
            username: user.username,
            lastMessageText: lastMessage ? lastMessage.text : 'No messages yet',
            timestamp: lastMessage ? lastMessage.timestamp : null,
            senderId: lastMessage ? lastMessage.senderId : null,
            status: lastMessage ? lastMessage.status : 'sent',
            unreadCount: unreadCount // Pass this down to the EJS template
        };
    }));

    usersWithLastMessage.sort((a, b) => {
        if (!a.timestamp) return 1; 
        if (!b.timestamp) return -1;
        return b.timestamp - a.timestamp; 
    });

    res.render('dashboard', { currentUser, users: usersWithLastMessage });
});

app.get('/chat/:currentUser/:targetUser', async (req, res) => {
    const { currentUser, targetUser } = req.params;
    const roomId = [currentUser, targetUser].sort().join('_');

    let messages = await Message.find({ roomId })
        .populate('replyTo')
        .sort({ timestamp: -1 })
        .limit(50);

    messages = messages.reverse();
    res.render('chat', { currentUser, targetUser, roomId, messages });
});

// --- Socket.IO Logic ---
const userSocketMap = new Map();

io.on('connection', (socket) => {
    
    socket.on('userConnected', (username) => {
        userSocketMap.set(socket.id, username);
        
        // NEW: Have the user join a personal room named after themselves to receive dashboard alerts
        socket.join(username); 
        
        io.emit('onlineUsers', Array.from(userSocketMap.values()));
    });

    socket.on('disconnect', () => {
        const username = userSocketMap.get(socket.id);
        if (username) {
            userSocketMap.delete(socket.id);
            io.emit('onlineUsers', Array.from(userSocketMap.values()));
        }
    });

    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
    });

    socket.on('typing', (data) => {
        socket.to(data.roomId).emit('displayTyping', data);
    });

    socket.on('markRead', async (data) => {
        await Message.updateMany(
            { roomId: data.roomId, senderId: { $ne: data.reader }, status: { $ne: 'read' } },
            { status: 'read' }
        );
        io.to(data.roomId).emit('messagesRead', { reader: data.reader });
    });

    socket.on('chatMessage', async (data) => {
        try {
            const newMessage = new Message({
                roomId: data.roomId,
                senderId: data.senderId,
                text: data.text,
                replyTo: data.replyToId || null,
                status: 'sent'
            });
            await newMessage.save();

            const populatedMessage = await Message.findById(newMessage._id).populate('replyTo');
            
            // 1. Send to the active chat room so it pops up in the conversation
            io.to(data.roomId).emit('message', populatedMessage);

            // 2. NEW: Figure out who the message is FOR, and ping their personal dashboard channel
            const targetUser = data.roomId.split('_').find(u => u !== data.senderId);
            if (targetUser) {
                socket.to(targetUser).emit('dashboardNotification', populatedMessage);
            }

        } catch (error) {
            console.error('Error saving message:', error);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));