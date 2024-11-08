const socket = io();

function formatPostContent(content, platform) {
    const characterLimits = {
        facebook: 250,
        instagram: 2200,
    };

    const limit = characterLimits[platform.toLowerCase()];
    if (content.length > limit) {
        return content.slice(0, limit) + "...";
    }
    return content;
}

function displayPostPreview(trendingTopics, content) {
    const postPreviewDiv = document.getElementById("postPreview");
    const instagramContent = formatPostContent(content.split("**Instagram Post Caption:**")[1].split("**Facebook")[0].trim(), 'instagram');
    const facebookContent = formatPostContent(content.split("**Facebook Post Caption:**")[1].trim(), 'facebook');

    const postContentHtml = `
        <div class="post instagram-post">
            <h4>Instagram Post:</h4>
            <p>${instagramContent}</p>
            <p class="hashtags">#SustainableFashion #EcoFriendly #2024Trends</p>
        </div>
        <div class="post facebook-post">
            <h4>Facebook Post:</h4>
            <p>${facebookContent}</p>
            <p class="hashtags">#Sustainability #FashionTrends #2024Fashion</p>
        </div>
    `;

    postPreviewDiv.innerHTML = postContentHtml;

    document.getElementById("generateMoreBtn").style.display = "block";

    document.getElementById("taskForm").style.display = "none";
}

document.getElementById("taskForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const keywords = document.getElementById("keywords").value;
    const url = document.getElementById("url").value;
    const datetime = document.getElementById("datetime").value;

    if (!keywords || !datetime) {
        document.getElementById("statusMessage").innerText = "Please provide all required fields.";
        return;
    }

    document.getElementById("statusMessage").innerText = "Task is being processed...";

    fetch('/api/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, url, datetime })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error('Error submitting task:', error);
        document.getElementById("statusMessage").innerText = "An error occurred. Please try again.";
    });

    document.getElementById("taskForm").reset();
});

socket.on('task_received', (data) => {
    document.getElementById("statusMessage").innerText = data.message;
});

socket.on('task_completed', (data) => {
    const { trendingTopics, content } = data;
    displayPostPreview(trendingTopics, content);
    document.getElementById("statusMessage").innerText = "Task completed successfully!";
});

socket.on('task_failed', (data) => {
    document.getElementById("statusMessage").innerText = "Task failed. Please try again.";
});

document.getElementById("generateMoreBtn").addEventListener("click", function() {
    location.reload(); 
});
