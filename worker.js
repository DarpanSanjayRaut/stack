const amqp = require('amqplib');
const { processTask } = require('./queue');

const RABBITMQ_URL = 'amqp://localhost';
const QUEUE_NAME = 'task_queue';

async function listenForTasks() {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log('Waiting for tasks in the queue...');

    channel.consume(QUEUE_NAME, (msg) => {
        if (msg !== null) {
            console.log('Received a task:', msg.content.toString());
            processTask(msg.content.toString())
                .then(() => {
                    channel.ack(msg);
                })
                .catch((err) => {
                    console.error('Error processing task:', err);
                    channel.nack(msg);
                });
        }
    });
}

listenForTasks();
