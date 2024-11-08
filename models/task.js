const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    userId: String,
    keywords: String,
    url: String,
    datetime: Date,
    status: { type: String, default: 'pending' },
    taskId: { type: String, required: true, unique: true },
    content: String,            // Generated content (for blog, social media, etc.)
    trendingTopics: [String],   // Trending topics related to keywords
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
