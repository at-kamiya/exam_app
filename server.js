// backend/server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path'); // ここでpathモジュールをインポート
const app = express();
const port = 3000;

// SQLiteデータベースの接続
const db = new sqlite3.Database('./exam.db');

// ミドルウェア
app.use(express.json());
// 静的ファイルの提供
app.use(express.static(path.join(__dirname, '../frontend')))


// サンプルルート
app.get('/', (req, res) => {
  res.sendFile(__dirname + '../frontend/index.html');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// データベースのテーブル作成
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT,
    options TEXT,
    answer TEXT,
    type TEXT  -- 'single' または 'multiple' を格納
  )`);
});

//API
// 試験問題の作成
app.post('/questions', (req, res) => {
  const { question, options, answer, type } = req.body;
  const stmt = db.prepare('INSERT INTO questions (question, options, answer, type) VALUES (?, ?, ?, ?)');
  stmt.run(question, JSON.stringify(options), JSON.stringify(answer), type, function(err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.status(201).send({ id: this.lastID });
  });
  stmt.finalize();
});

// 試験問題の読み取り
app.get('/questions', (req, res) => {
  db.all('SELECT * FROM questions', (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.send(rows);
  });
});

// 試験問題の更新
app.put('/questions/:id', (req, res) => {
  const { id } = req.params;
  const { question, options, answer } = req.body;
  const stmt = db.prepare('UPDATE questions SET question = ?, options = ?, answer = ? WHERE id = ?');
  stmt.run(question, JSON.stringify(options), answer, id, function(err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.send({ changes: this.changes });
  });
  stmt.finalize();
});

// 試験問題の削除
app.delete('/questions/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM questions WHERE id = ?');
  stmt.run(id, function(err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.send({ changes: this.changes });
  });
  stmt.finalize();
});


