# 🍷 Our Chat

> A production-grade, real-time messaging platform engineered with a luxurious **“Sensual Noir”** design language and a scalable event-driven architecture.  
> Built for ultra-responsive communication using **Socket.IO**, persistent cloud storage, and intelligent private-room routing.

---
# 🌐 Live Demo

🚀 Experience the application live here:

**🔗 [Our Chat Live](https://ourchatt.up.railway.app/)**

---




## ✨ Highlights

### ⚡ Real-Time Messaging
Experience instant, bi-directional communication powered by **Socket.IO**, enabling seamless zero-refresh conversations with minimal latency.

### 🧠 Intelligent Room Routing
Private chat rooms are generated dynamically using deterministic alphabetical sorting:

```txt
UserA_UserB
```

This guarantees:
- Consistent room generation
- Perfect user-pair isolation
- Elimination of duplicate room creation

### 🔔 Smart Presence & Notifications
Each user joins a dedicated personal socket room:

```js
socket.join(username)
```

This architecture enables:
- Real-time unread message badges
- Instant notifications
- Presence-aware updates even outside active chats

### ✍️ Typing Indicators & Read Receipts
Live interaction feedback includes:
- Real-time typing indicators
- Message read acknowledgements
- Database-synced message state updates

### ☁️ Persistent Cloud Storage
Integrated with **MongoDB Atlas** through **Mongoose** for:
- Reliable message persistence
- Historical chat retrieval
- Scalable cloud-hosted storage

### 🎨 Sensual Noir UI
A handcrafted visual identity featuring:
- Deep Charcoal backgrounds
- Rich Burgundy accents
- Elegant Soft Nude highlights

Designed to feel cinematic, intimate, and premium.

---

# 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas, Mongoose |
| **Real-Time Engine** | Socket.IO |
| **Frontend** | EJS, Vanilla JavaScript, Custom CSS |
| **Deployment** | Railway |

---

# 🧱 Architecture Overview

```txt
Client (EJS + Vanilla JS)
        │
        ▼
Socket.IO Real-Time Layer
        │
        ▼
Express.js API Server
        │
        ▼
MongoDB Atlas Database
```

---

# 🚀 Local Setup & Installation

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/Smit-Pandit/Our_Chat.git
cd Our_Chat
```

---

## 2️⃣ Install Dependencies

```bash
npm install
```

---

## 3️⃣ Configure Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000

MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/whatsapp-db?retryWrites=true&w=majority
```

---

## 4️⃣ Run the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

---

# 📡 Core Real-Time Events

| Event | Description |
|---|---|
| `joinRoom` | Connects users to a private chat room |
| `sendMessage` | Sends a real-time message |
| `receiveMessage` | Receives incoming messages instantly |
| `displayTyping` | Shows live typing activity |
| `messagesRead` | Updates read receipt status |
| `notification` | Pushes unread message alerts |

---

# 🔒 Scalability & Production Readiness

- Deterministic room generation
- Efficient socket room isolation
- Persistent cloud-hosted database
- Railway deployment support
- Modular backend architecture
- Optimized real-time event handling

---

# 🎯 Future Enhancements

- ✅ End-to-end encryption
- ✅ Online/offline presence tracking
- ✅ Voice & video calling
- ✅ Media/file sharing
- ✅ JWT authentication
- ✅ Message reactions & replies
- ✅ Progressive Web App (PWA)

---

# 📸 Project Vision

**Our Chat** isn’t just another messaging application — it’s an experiment in combining:
- luxury-inspired UI design,
- scalable real-time engineering,
- and immersive communication experiences.

Built with performance, elegance, and extensibility at its core.

---

# 🧑‍💻 Author

### Smit Pandit

Passionate about building immersive full-stack experiences with real-time systems, premium UI design, and scalable backend architecture.

---

# 📜 License

This project is licensed under the **MIT License**.
