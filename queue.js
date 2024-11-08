const amqp = require('amqplib');
const mongoose = require('mongoose');
const Task = require('./models/task');

const RABBITMQ_URL = 'amqp://localhost';
const QUEUE_NAME = 'task_queue';
const MONGO_URI = 'mongodb+srv://darpan:darpan@cluster0.1ymnr.mongodb.net/app?retryWrites=true&w=majority';

function fakeApiCall(ms) {
    return new Promise(resolve => setTimeout(resolve, ms + 5000));
}

async function connectToMongoDB() {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1); 
    }
}

async function processTask(taskData, io) {
    await fakeApiCall(2000);
    const { taskId, keywords, url } = JSON.parse(taskData);

    try {
        console.log(`Task processing started for ID: ${taskId}`);

        const updatedTask = await Task.updateOne(
            { taskId: taskId },
            { $set: { status: 'in-progress' } }
        );

        if (updatedTask.nModified > 0) {
            console.log(`Task with ID ${taskId} updated to 'in-progress'`);
        } else {
            console.log(`No changes made to task with ID ${taskId}`);
        }

        const trendingTopics = await getTrendingTopics(keywords);
        const { content, images } = await generateContent(keywords, url);

        const updatedTask1 = await Task.updateOne(
            { taskId: taskId },
            { $set: { status: 'completed', content, trendingTopics, images } }
        );

        console.log(`Task with ID ${taskId} updated to 'completed'`);
        io.emit('task_completed', { taskId, trendingTopics, content, images });

        console.log(`Task ${taskId} completed successfully.`);
    } catch (error) {
        console.error(`Error processing task ${taskId}:`, error);

        await Task.updateOne(
            { taskId: taskId },
            { $set: { status: 'failed' } }
        );

        io.emit('task_failed', { taskId });
    }
}

async function getTrendingTopics(keywords) {
    await fakeApiCall(2000);
    console.log(`Fetching trending topics for: ${keywords}`);

    const trendingTopics = [
        "Top 5 Travel Destinations in 2024",
        "How AI is Transforming Healthcare",
        "The Rise of Remote Work in 2024",
        "Top 10 Social Media Trends You Can't Miss",
        "Sustainable Fashion Trends for 2024"
    ];

    return trendingTopics.join('\n');  
}

async function generateContent(keywords, url) {
    await fakeApiCall(2000);
    console.log(`Generating content for: ${keywords} from URL: ${url}`);

    const images = generateDummyImages();

    const content = `
        **Blog Post Title:** The Ultimate Guide to Sustainable Fashion in 2024
        **Description:** Explore the latest trends in sustainable fashion, from eco-friendly materials to fashion brands leading the change. Learn how you can make a difference in the world of fashion while looking stylish!
        
        **Instagram Post Caption:**
        🌱🌍 Sustainable Fashion is the way forward! Check out the top trends in eco-friendly fashion for 2024. #SustainableFashion #EcoFriendly #2024Trends

        **Facebook Post Caption:**
        🌍 Discover the top trends in sustainable fashion for 2024. Join the movement towards a greener, more eco-conscious world. #Sustainability #FashionTrends #2024Fashion

        **Hashtags:** #SustainableFashion #EcoFriendly #FashionTrends #2024

        **Images:**
        - ![Image 1](https://example.com/dummy-image-1.jpg)
        - ![Image 2](https://example.com/dummy-image-2.jpg)
        - ![Image 3](https://example.com/dummy-image-3.jpg)
    `;
    
    return { content, images };  
}

function generateDummyImages() {
    const dummyImages = [
        'https://via.placeholder.com/600x400?text=Dummy+Image+1',
        'https://via.placeholder.com/600x400?text=Dummy+Image+2',
        'https://via.placeholder.com/600x400?text=Dummy+Image+3',
    ];

    return dummyImages;
}

async function listenForTasks(io) {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertQueue(QUEUE_NAME, { durable: true });
        console.log('Waiting for tasks in the queue...');

        channel.consume(QUEUE_NAME, (msg) => {
            if (msg !== null) {
                console.log('Received a task:', msg.content.toString());
                processTask(msg.content.toString(), io)  
                    .then(() => {
                        channel.ack(msg); 
                    })
                    .catch((err) => {
                        console.error('Error processing task:', err);
                        channel.nack(msg);
                    });
            }
        });
    } catch (error) {
        console.error('Error setting up RabbitMQ listener:', error);
    }
}

async function startApp(io) {
    await connectToMongoDB();
    listenForTasks(io);
}

module.exports = (io) => {
    startApp(io);
    processTask;
};
