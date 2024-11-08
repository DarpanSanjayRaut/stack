const express = require('express');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const Task = require('./models/task');
const amqp = require('amqplib');
const RABBITMQ_URL = 'amqp://localhost';
const QUEUE_NAME = 'task_queue';
const app = express();
const server = http.createServer(app);
const io = socketIo(server);  // Initialize socket.io

// Set up middleware
app.use(express.json());
app.use(express.static('public'));

const MONGO_URI = 'mongodb+srv://darpan:darpan@cluster0.1ymnr.mongodb.net/app?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log('MongoDB connection error:', err));

    // RabbitMQ Task Producer (enqueue task)
async function enqueueTask(taskId, keywords, url) {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    // Declare the queue if it doesn't already exist
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    // Prepare the task data and send it to the queue
    const taskData = JSON.stringify({ taskId, keywords, url });
    channel.sendToQueue(QUEUE_NAME, Buffer.from(taskData), { persistent: true });

    console.log(`Task with ID: ${taskId} sent to queue.`);

    // Close the channel and connection after a short delay
    setTimeout(() => {
        channel.close();
        connection.close();
    }, 500);
}


app.post('/api/task', async (req, res) => {
    const { keywords, url, datetime } = req.body;
    const userId = req.body.userId || uuidv4();

    if (!keywords || !url || !datetime) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const taskId = new mongoose.Types.ObjectId();
    const taskPayload = { userId, keywords, url, datetime, status: 'pending', taskId };

    const task = new Task(taskPayload);
    await task.save();

    res.json({ message: 'Task received and is being processed.', taskId });

    // Enqueue the task and emit an event
    enqueueTask(taskId, keywords, url);

    // Emit task received event to frontend via socket
    io.emit('task_received', { message: 'Your task is being processed.' });
});





// Start the server and pass io to queue.js
server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
    require('./queue')(io);  // Initialize queue with io
});
