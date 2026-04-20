/**
 * lib/db.js
 * Assignment 3: RDS Database Layer
 *
 * In DEMO_MODE=true  → uses an in-memory JS store (no real DB needed).
 * In DEMO_MODE=false → connects to AWS RDS MySQL via mysql2/promise.
 *
 * SQL schema (run on RDS):
 * ─────────────────────────────────────────────────────────────────
 * CREATE TABLE users (
 *   id         VARCHAR(36)  PRIMARY KEY,
 *   username   VARCHAR(50)  UNIQUE NOT NULL,
 *   email      VARCHAR(100) UNIQUE NOT NULL,
 *   password   VARCHAR(255) NOT NULL,
 *   avatar_url TEXT,
 *   points     INT DEFAULT 0,
 *   wins       INT DEFAULT 0,
 *   losses     INT DEFAULT 0,
 *   matches    INT DEFAULT 0,
 *   rank       VARCHAR(20) DEFAULT 'Bronze',
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * );
 *
 * CREATE TABLE quiz_questions (
 *   id         VARCHAR(36) PRIMARY KEY,
 *   topic      VARCHAR(100),
 *   difficulty VARCHAR(20),
 *   question   TEXT NOT NULL,
 *   options    JSON NOT NULL,
 *   answer     INT NOT NULL,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * );
 *
 * CREATE TABLE matches (
 *   id           VARCHAR(36) PRIMARY KEY,
 *   player1_id   VARCHAR(36),
 *   player2_id   VARCHAR(36),
 *   winner_id    VARCHAR(36),
 *   p1_score     INT DEFAULT 0,
 *   p2_score     INT DEFAULT 0,
 *   topic        VARCHAR(100),
 *   status       ENUM('waiting','active','finished') DEFAULT 'waiting',
 *   created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * );
 *
 * CREATE TABLE leaderboard_snapshots (
 *   id         INT AUTO_INCREMENT PRIMARY KEY,
 *   user_id    VARCHAR(36),
 *   username   VARCHAR(50),
 *   points     INT,
 *   wins       INT,
 *   rank       VARCHAR(20),
 *   snapshot_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * );
 * ─────────────────────────────────────────────────────────────────
 */

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const DEMO_MODE = process.env.DEMO_MODE !== 'false';

// ─── In-Memory Store (Demo Mode) ──────────────────────────────────
let store = {
  users: [],
  questions: [],
  matches: [],
};

// Seed demo questions
function seedQuestions() {
  if (store.questions.length > 0) return;
  const qs = [
    { topic: 'Arrays', difficulty: 'Easy', question: 'What is the time complexity of accessing an element in an array by index?', options: ['O(n)', 'O(1)', 'O(log n)', 'O(n²)'], answer: 1 },
    { topic: 'Arrays', difficulty: 'Easy', question: 'Which operation in an array is O(n) in the worst case?', options: ['Access by index', 'Update by index', 'Search by value', 'Get length'], answer: 2 },
    { topic: 'Linked Lists', difficulty: 'Easy', question: 'What is the head of a linked list?', options: ['The last node', 'The middle node', 'The first node', 'A null pointer'], answer: 2 },
    { topic: 'Linked Lists', difficulty: 'Medium', question: 'What is the time complexity of inserting at the beginning of a singly linked list?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], answer: 2 },
    { topic: 'Stacks', difficulty: 'Easy', question: 'Which principle does a stack follow?', options: ['FIFO', 'LIFO', 'Random', 'Sorted'], answer: 1 },
    { topic: 'Stacks', difficulty: 'Medium', question: 'Valid parentheses checking uses which data structure?', options: ['Queue', 'Heap', 'Stack', 'Graph'], answer: 2 },
    { topic: 'Queues', difficulty: 'Easy', question: 'Which principle does a queue follow?', options: ['LIFO', 'FIFO', 'Random', 'Priority'], answer: 1 },
    { topic: 'Binary Search', difficulty: 'Medium', question: 'Binary search requires the array to be:', options: ['Unsorted', 'Sorted', 'Filled with integers', 'Non-empty'], answer: 1 },
    { topic: 'Binary Search', difficulty: 'Medium', question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(1)', 'O(log n)', 'O(n log n)'], answer: 2 },
    { topic: 'Trees', difficulty: 'Medium', question: 'In a Binary Search Tree (BST), where are smaller values stored?', options: ['Right subtree', 'Left subtree', 'Root', 'Random'], answer: 1 },
    { topic: 'Trees', difficulty: 'Hard', question: 'What traversal visits: Left → Root → Right?', options: ['Pre-order', 'Post-order', 'Level-order', 'In-order'], answer: 3 },
    { topic: 'Graphs', difficulty: 'Medium', question: 'BFS uses which data structure?', options: ['Stack', 'Heap', 'Queue', 'Array'], answer: 2 },
    { topic: 'Graphs', difficulty: 'Hard', question: 'DFS uses which data structure internally?', options: ['Queue', 'Stack', 'Linked List', 'Tree'], answer: 1 },
    { topic: 'Sorting', difficulty: 'Easy', question: 'What is the best-case time complexity of bubble sort?', options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'], answer: 2 },
    { topic: 'Sorting', difficulty: 'Medium', question: 'Which sorting algorithm uses divide and conquer?', options: ['Bubble Sort', 'Insertion Sort', 'Selection Sort', 'Merge Sort'], answer: 3 },
    { topic: 'Hashing', difficulty: 'Easy', question: 'What is the average time complexity of HashMap lookup?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], answer: 2 },
    { topic: 'Dynamic Programming', difficulty: 'Hard', question: 'What does memoization store?', options: ['Unsolved problems', 'Previously computed results', 'Random values', 'Stack frames'], answer: 1 },
    { topic: 'Dynamic Programming', difficulty: 'Hard', question: 'Which problem is not solved by dynamic programming?', options: ['Fibonacci', 'Knapsack', 'Quick Sort', 'Longest Common Subsequence'], answer: 2 },
    { topic: 'Recursion', difficulty: 'Medium', question: 'Every recursive function must have a:', options: ['Loop', 'Return type', 'Base case', 'Global variable'], answer: 2 },
    { topic: 'Complexity', difficulty: 'Easy', question: 'O(1) means:', options: ['Linear time', 'Constant time', 'Logarithmic time', 'Quadratic time'], answer: 1 },
  ];
  store.questions = qs.map(q => ({ ...q, id: uuidv4() }));
}
seedQuestions();

// ─── RDS (MySQL) Connection – Real Mode ───────────────────────────
let pool = null;
async function getPool() {
  if (pool) return pool;
  const mysql = (await import('mysql2/promise')).default;
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });
  return pool;
}

// ─── DB Interface ─────────────────────────────────────────────────
export const db = {
  // ── Users ──────────────────────────────────────────────────────
  async createUser({ username, email, password }) {
    const id = uuidv4();
    const hash = await bcrypt.hash(password, 12);
    if (DEMO_MODE) {
      if (store.users.find(u => u.email === email)) throw new Error('Email already registered');
      if (store.users.find(u => u.username === username)) throw new Error('Username taken');
      const user = { id, username, email, password: hash, avatar_url: null, points: 0, wins: 0, losses: 0, matches: 0, rank: 'Bronze', created_at: new Date().toISOString() };
      store.users.push(user);
      const { password: _, ...safe } = user;
      return safe;
    }
    const conn = await getPool();
    await conn.execute(
      'INSERT INTO users (id,username,email,password) VALUES (?,?,?,?)',
      [id, username, email, hash]
    );
    return { id, username, email, points: 0, wins: 0, losses: 0, matches: 0, rank: 'Bronze' };
  },

  async findUserByEmail(email) {
    if (DEMO_MODE) return store.users.find(u => u.email === email) || null;
    const conn = await getPool();
    const [rows] = await conn.execute('SELECT * FROM users WHERE email=?', [email]);
    return rows[0] || null;
  },

  async findUserById(id) {
    if (DEMO_MODE) {
      const u = store.users.find(u => u.id === id);
      if (!u) return null;
      const { password: _, ...safe } = u;
      return safe;
    }
    const conn = await getPool();
    const [rows] = await conn.execute('SELECT id,username,email,avatar_url,points,wins,losses,matches,rank,created_at FROM users WHERE id=?', [id]);
    return rows[0] || null;
  },

  async updateUser(id, updates) {
    if (DEMO_MODE) {
      const idx = store.users.findIndex(u => u.id === id);
      if (idx === -1) throw new Error('User not found');
      store.users[idx] = { ...store.users[idx], ...updates };
      const { password: _, ...safe } = store.users[idx];
      return safe;
    }
    const conn = await getPool();
    const keys = Object.keys(updates);
    const vals = Object.values(updates);
    const set = keys.map(k => `${k}=?`).join(',');
    await conn.execute(`UPDATE users SET ${set} WHERE id=?`, [...vals, id]);
    return this.findUserById(id);
  },

  // ── Questions ──────────────────────────────────────────────────
  async getQuestions(topic, count = 10) {
    if (DEMO_MODE) {
      let qs = topic === 'Random' ? [...store.questions] : store.questions.filter(q => q.topic === topic);
      if (qs.length === 0) qs = [...store.questions];
      qs.sort(() => Math.random() - 0.5);
      return qs.slice(0, count);
    }
    const conn = await getPool();
    const q = topic === 'Random' ? 'SELECT * FROM quiz_questions ORDER BY RAND() LIMIT ?' : 'SELECT * FROM quiz_questions WHERE topic=? ORDER BY RAND() LIMIT ?';
    const params = topic === 'Random' ? [count] : [topic, count];
    const [rows] = await conn.execute(q, params);
    return rows;
  },

  // ── Matches ─────────────────────────────────────────────────────
  async createMatch({ player1_id, topic }) {
    const id = uuidv4();
    const match = { id, player1_id, player2_id: null, winner_id: null, p1_score: 0, p2_score: 0, topic, status: 'waiting', created_at: new Date().toISOString() };
    if (DEMO_MODE) { store.matches.push(match); return match; }
    const conn = await getPool();
    await conn.execute('INSERT INTO matches (id,player1_id,topic) VALUES (?,?,?)', [id, player1_id, topic]);
    return match;
  },

  async findWaitingMatch(topic) {
    if (DEMO_MODE) return store.matches.find(m => m.status === 'waiting' && m.topic === topic) || null;
    const conn = await getPool();
    const [rows] = await conn.execute('SELECT * FROM matches WHERE status="waiting" AND topic=? LIMIT 1', [topic]);
    return rows[0] || null;
  },

  async joinMatch(matchId, player2_id) {
    if (DEMO_MODE) {
      const m = store.matches.find(m => m.id === matchId);
      if (!m) throw new Error('Match not found');
      m.player2_id = player2_id;
      m.status = 'active';
      return m;
    }
    const conn = await getPool();
    await conn.execute('UPDATE matches SET player2_id=?, status="active" WHERE id=?', [player2_id, matchId]);
    return this.getMatch(matchId);
  },

  async finishMatch(matchId, winner_id, p1_score, p2_score) {
    if (DEMO_MODE) {
      const m = store.matches.find(m => m.id === matchId);
      if (!m || m.status === 'finished') return null; // Block double execution!
      m.winner_id = winner_id; m.p1_score = p1_score; m.p2_score = p2_score; m.status = 'finished';
      return m;
    }
    const conn = await getPool();
    const [result] = await conn.execute('UPDATE matches SET winner_id=?,p1_score=?,p2_score=?,status="finished" WHERE id=? AND status!="finished"', [winner_id, p1_score, p2_score, matchId]);
    if (result.affectedRows === 0) return null; // Block double execution!
    return this.getMatch(matchId);
  },

  async getMatch(id) {
    if (DEMO_MODE) return store.matches.find(m => m.id === id) || null;
    const conn = await getPool();
    const [rows] = await conn.execute('SELECT * FROM matches WHERE id=?', [id]);
    return rows[0] || null;
  },

  async updateMatchScore(matchId, isP1, score) {
    if (DEMO_MODE) {
      const m = store.matches.find(m => m.id === matchId);
      if (m) {
        if (isP1) m.p1_score = score;
        else m.p2_score = score;
      }
      return m;
    }
    const conn = await getPool();
    const col = isP1 ? 'p1_score' : 'p2_score';
    await conn.execute(`UPDATE matches SET ${col}=? WHERE id=?`, [score, matchId]);
    return this.getMatch(matchId);
  },

  // ── Leaderboard ────────────────────────────────────────────────
  async getLeaderboard(limit = 50) {
    if (DEMO_MODE) {
      return [...store.users]
        .sort((a, b) => b.points - a.points)
        .slice(0, limit)
        .map(({ password: _, ...u }) => u);
    }
    const conn = await getPool();
    const [rows] = await conn.execute(
      'SELECT id,username,avatar_url,points,wins,losses,matches,rank FROM users ORDER BY points DESC LIMIT ?',
      [limit]
    );
    return rows;
  },
};

export default db;
