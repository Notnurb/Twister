// Handle tweet post functionality
document.getElementById('tweetButton').addEventListener('click', function() {
  let tweetText = document.getElementById('tweetText').value;

  if (tweetText.trim() !== "") {
    let tweetDiv = document.createElement('div');
    tweetDiv.classList.add('tweet');

    let tweetContent = document.createElement('p');
    tweetContent.textContent = tweetText;

    let tweetFooter = document.createElement('div');
    tweetFooter.classList.add('tweet-footer');

    let likeButton = document.createElement('button');
    likeButton.classList.add('like-btn');
    likeButton.textContent = 'Like';
    likeButton.addEventListener('click', function() {
      likeButton.classList.toggle('liked');
      likeButton.textContent = likeButton.classList.contains('liked') ? 'Liked' : 'Like';
    });

    let commentButton = document.createElement('button');
    commentButton.classList.add('comment-btn');
    commentButton.textContent = 'Comment';
    commentButton.addEventListener('click', function() {
      let comment = prompt("Write your comment:");
      if (comment) {
        alert("Comment posted: " + comment);
      }
    });

    let replyButton = document.createElement('button');
    replyButton.classList.add('reply-btn');
    replyButton.textContent = 'Reply';
    replyButton.addEventListener('click', function() {
      let reply = prompt("Write your reply:");
      if (reply) {
        alert("Reply posted: " + reply);
      }
    });

    tweetFooter.appendChild(likeButton);
    tweetFooter.appendChild(commentButton);
    tweetFooter.appendChild(replyButton);

    tweetDiv.appendChild(tweetContent);
    tweetDiv.appendChild(tweetFooter);

    // Add the tweet to the feed
    document.getElementById('feed').prepend(tweetDiv);

    // Clear the tweet box after posting
    document.getElementById('tweetText').value = '';
  }
});

// Settings Modal logic
document.getElementById('settingsButton').addEventListener('click', function() {
  document.getElementById('settingsModal').style.display = 'flex';
});

// Close the settings modal
document.getElementById('closeSettings').addEventListener('click', function() {
  document.getElementById('settingsModal').style.display = 'none';
});

// Save settings logic
document.getElementById('saveSettings').addEventListener('click', function() {
  let newUsername = document.getElementById('newUsername').value;
  let newPfp = document.getElementById('newPfp').files[0];

  if (newUsername) {
    document.getElementById('username').textContent = newUsername;
  }

  if (newPfp) {
    let reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('profilePic').src = e.target.result;
    };
    reader.readAsDataURL(newPfp);
  }

  document.getElementById('settingsModal').style.display = 'none';
});

