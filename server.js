
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
//database models for mongoose
const Message = require('./models/Message');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
//middleware and view engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
//connect to MongoDB using mongoose
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
//request to / (main page) renders the index.ejs file which has the login form
app.get('/', (req, res) => {
    res.render('index');
});
// post request to /login checks if username is provided, if not it redirects back to main page. If username is provided, it updates or creates the user in the database and redirects to their dashboard.
app.post('/login', async (req, res) => {
    const { username } = req.body;
    if (!username) return res.redirect('/');
    await User.updateOne({ username }, { username }, { upsert: true });
    res.redirect(`/dashboard/${username}`);
});
// get request to get users dashboard
// This route fetches all users except the current user, then for each user it
// finds the last message exchanged with the current user and counts unread messages.
// It then renders the dashboard with this information.
app.get('/dashboard/:username', async (req, res) => {
    const currentUser = req.params.username; // requested username from the URL
    const availableUsers = await User.find({ username: { $ne: currentUser } });
    
    const usersWithLastMessage = await Promise.all(availableUsers.map(async (user) => {
        const roomId = [currentUser, user.username].sort().join('_');
        const lastMessage = await Message.findOne({ roomId }).sort({ timestamp: -1 });

        // unread message count
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
            unreadCount: unreadCount 
            //sends it to the ejs file to be rendered on the dashboard,
            //this includes the username, last message text, timestamp, senderId,
            //status and unread message count for each user.
        };
    }));

    usersWithLastMessage.sort((a, b) => {
        if (!a.timestamp) return 1; 
        if (!b.timestamp) return -1;
        return b.timestamp - a.timestamp; 
    });

    res.render('dashboard', { currentUser, users: usersWithLastMessage });
});
// this creates a dynamic route between two users for their chat room
// it displayys last 50 messages between them (50 limit cause loading becomes slower with more messages)
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

// socket.io connection handling
const userSocketMap = new Map();
/*
    When user connects we store it in a map , when he disconnects we remove from that map,
    This helps us keep track of online peoples
*/
// socket logic for connection, disconnection, joining rooms, typing indicator, marking messages as read and sending chat messages
io.on('connection', (socket) => {
    socket.on('userConnected', (username) => {
        // the rooms are created after person name so even if the person is not online
        // we can still send them message to their personal room and it will be there when they come online
        userSocketMap.set(socket.id, username);
        socket.join(username); 
        io.emit('onlineUsers', Array.from(userSocketMap.values()));
    });
    // disconnection removes the user from online map and updates the online users list for everyone else
    socket.on('disconnect', () => {
        const username = userSocketMap.get(socket.id);
        if (username) {
            userSocketMap.delete(socket.id);
            io.emit('onlineUsers', Array.from(userSocketMap.values()));
        }
    });
    // when a user joins a chat room, they emit 'joinRoom' with the roomId,
    // and the server adds their socket to that room
    // this allows them to receive messages and typing indicators for that specific chat room
    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
    });
    // typing indicator, built in event that listens for 'typing' event 
    socket.on('typing', (data) => {
        socket.to(data.roomId).emit('displayTyping', data);
    });
    // read receipt logic 
    socket.on('markRead', async (data) => {
        // it finds messages in the specified room that were sent by the other user and are 
        // not already marked as 'read', and updates their status to 'read'.
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
                replyTo: data.replyToId || null, // just in case 
                status: 'sent' 
            });
            await newMessage.save(); 

            const populatedMessage = await Message.findById(newMessage._id).populate('replyTo');
            
            // Send to the active chat room so it pops up in the conversation
            io.to(data.roomId).emit('message', populatedMessage);

            // Figure out who the message is FOR, and ping their personal dashboard channel
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
