CREATE TABLE User (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50)
);

CREATE TABLE Deck (
    deck_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(user_id)
);

CREATE TABLE Tag (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(50) NOT NULL
);

CREATE TABLE DeckTag (
    deck_id INT,
    tag_id INT,
    PRIMARY KEY (deck_id, tag_id),
    FOREIGN KEY (deck_id) REFERENCES Deck(deck_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES Tag(tag_id) ON DELETE CASCADE
);

CREATE TABLE Flashcard (
    card_id INT AUTO_INCREMENT PRIMARY KEY,
    deck_id INT NOT NULL,
    front_text TEXT NOT NULL,
    back_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deck_id) REFERENCES Deck(deck_id) ON DELETE CASCADE
);

CREATE TABLE Review (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    card_id INT NOT NULL,
    user_id INT NOT NULL,
    review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    performance_rating INT,
    next_review_date DATETIME,
    FOREIGN KEY (card_id) REFERENCES Flashcard(card_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);

CREATE TABLE Collaboration (
    collab_id INT AUTO_INCREMENT PRIMARY KEY,
    deck_id INT NOT NULL,
    user_id INT NOT NULL,
    role VARCHAR(50),
    FOREIGN KEY (deck_id) REFERENCES Deck(deck_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);

CREATE TABLE Quiz (
    quiz_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    create_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(user_id)
);

CREATE TABLE QuizAttempt (
    attempt_id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    user_id INT NOT NULL,
    score DECIMAL(5,2),
    attempt_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    time_taken INT,
    FOREIGN KEY (quiz_id) REFERENCES Quiz(quiz_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);

CREATE TABLE Analytics (
    analytics_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    accuracy_rate DECIMAL(5,2),
    streak_count INT,
    last_active DATETIME,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);
