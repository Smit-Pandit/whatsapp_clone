const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    roomId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    text: { type: String, required: true },
    status: { type: String, default: 'sent' }, 
    replyTo: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Message', 
        default: null 
    },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);