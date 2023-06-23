const express = require('express');
const chats = require('./data/data')
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware')
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require("./routes/messageRoutes")
const blogRoutes = require("./routes/blogRoutes");


const app = express();
dotenv.config();
connectDB();

app.use(express.json());


app.get('/', function (req, res) {
    res.send("hello world");
});
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/blogs", blogRoutes)


app.use(notFound);
app.use(errorHandler);


const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, console.log(`server running on port ${PORT}`));

const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
        origin: "http://localhost:3000",
    }
});

io.on("connection", (socket) => {
    console.log('connected to socket.io');

    socket.on('setup', (userData) => {
        socket.join(userData._id);
        console.log(userData._id)
        socket.emit('connected');
    });

    socket.on('join chat', (room) => {
        socket.join(room);
        console.log("user joined room: " + room);
    });

    socket.on('typing', (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

    

    socket.on('new message', (newMessageRecieved) => {
        var chat = newMessageRecieved.chat;

        if (!chat.users) return console.log('chat.users not defined');

        chat.users.forEach(user => {
            if (user._id == newMessageRecieved.sender._id) return;

            socket.in(user._id).emit('message recieved', newMessageRecieved);
        })
    })
});