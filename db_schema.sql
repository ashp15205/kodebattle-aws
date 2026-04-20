-- CREATE YOUR DB FIRST
CREATE DATABASE IF NOT EXISTS kodebattle;
USE kodebattle;

CREATE TABLE users (
  id         VARCHAR(36)  PRIMARY KEY,
  username   VARCHAR(50)  UNIQUE NOT NULL,
  email      VARCHAR(100) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  points     INT DEFAULT 0,
  wins       INT DEFAULT 0,
  losses     INT DEFAULT 0,
  matches    INT DEFAULT 0,
  rank       VARCHAR(20) DEFAULT 'Bronze',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quiz_questions (
  id         VARCHAR(36) PRIMARY KEY,
  topic      VARCHAR(100),
  difficulty VARCHAR(20),
  question   TEXT NOT NULL,
  options    JSON NOT NULL,
  answer     INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE matches (
  id           VARCHAR(36) PRIMARY KEY,
  player1_id   VARCHAR(36),
  player2_id   VARCHAR(36),
  winner_id    VARCHAR(36),
  p1_score     INT DEFAULT 0,
  p2_score     INT DEFAULT 0,
  topic        VARCHAR(100),
  status       ENUM('waiting','active','finished') DEFAULT 'waiting',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Random Quiz Questions
INSERT INTO quiz_questions (id, topic, difficulty, question, options, answer) VALUES 
(UUID(), 'Arrays', 'Easy', 'What is the time complexity of accessing an element in an array by index?', '["O(n)", "O(1)", "O(log n)", "O(n^2)"]', 1),
(UUID(), 'Arrays', 'Easy', 'Which operation in an array is O(n) in the worst case?', '["Access by index", "Update by index", "Search by value", "Get length"]', 2),
(UUID(), 'Linked Lists', 'Easy', 'What is the head of a linked list?', '["The last node", "The middle node", "The first node", "A null pointer"]', 2),
(UUID(), 'Linked Lists', 'Medium', 'What is the time complexity of inserting at the beginning of a singly linked list?', '["O(n)", "O(log n)", "O(1)", "O(n^2)"]', 2),
(UUID(), 'Stacks', 'Easy', 'Which principle does a stack follow?', '["FIFO", "LIFO", "Random", "Sorted"]', 1),
(UUID(), 'Stacks', 'Medium', 'Valid parentheses checking uses which data structure?', '["Queue", "Heap", "Stack", "Graph"]', 2),
(UUID(), 'Queues', 'Easy', 'Which principle does a queue follow?', '["LIFO", "FIFO", "Random", "Priority"]', 1),
(UUID(), 'Binary Search', 'Medium', 'Binary search requires the array to be:', '["Unsorted", "Sorted", "Filled with integers", "Non-empty"]', 1),
(UUID(), 'Binary Search', 'Medium', 'What is the time complexity of binary search?', '["O(n)", "O(1)", "O(log n)", "O(n log n)"]', 2),
(UUID(), 'Trees', 'Medium', 'In a Binary Search Tree (BST), where are smaller values stored?', '["Right subtree", "Left subtree", "Root", "Random"]', 1),
(UUID(), 'Trees', 'Hard', 'What traversal visits: Left -> Root -> Right?', '["Pre-order", "Post-order", "Level-order", "In-order"]', 3),
(UUID(), 'Graphs', 'Medium', 'BFS uses which data structure?', '["Stack", "Heap", "Queue", "Array"]', 2),
(UUID(), 'Graphs', 'Hard', 'DFS uses which data structure internally?', '["Queue", "Stack", "Linked List", "Tree"]', 1),
(UUID(), 'Sorting', 'Easy', 'What is the best-case time complexity of bubble sort?', '["O(n^2)", "O(n log n)", "O(n)", "O(1)"]', 2),
(UUID(), 'Sorting', 'Medium', 'Which sorting algorithm uses divide and conquer?', '["Bubble Sort", "Insertion Sort", "Selection Sort", "Merge Sort"]', 3),
(UUID(), 'Hashing', 'Easy', 'What is the average time complexity of HashMap lookup?', '["O(n)", "O(log n)", "O(1)", "O(n^2)"]', 2),
(UUID(), 'Dynamic Programming', 'Hard', 'What does memoization store?', '["Unsolved problems", "Previously computed results", "Random values", "Stack frames"]', 1),
(UUID(), 'Dynamic Programming', 'Hard', 'Which problem is not solved by dynamic programming?', '["Fibonacci", "Knapsack", "Quick Sort", "Longest Common Subsequence"]', 2),
(UUID(), 'Recursion', 'Medium', 'Every recursive function must have a:', '["Loop", "Return type", "Base case", "Global variable"]', 2),
(UUID(), 'Complexity', 'Easy', 'O(1) means:', '["Linear time", "Constant time", "Logarithmic time", "Quadratic time"]', 1);
