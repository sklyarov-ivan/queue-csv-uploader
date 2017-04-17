const express = require('express');
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');
const kue = require('kue');
const parse = require('csv-parse');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = exports.server = require('http').createServer(app, { log: true });

const io = require('socket.io')(server);

const db = new sqlite3.Database(':memory:');

db.run(`CREATE TABLE IF NOT EXISTS users (
  FirstName varchar(50),
  Surname  varchar(50),
  Email varchar(50),
  created_at DATETIME)`);

const jobs = kue.createQueue();
const Job = kue.Job;
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const filetypes = 'text/csv';
    const filetypeRegexp = new RegExp(filetypes);
    const mimetype = filetypeRegexp.test(file.mimetype);

    if (mimetype) {
      return cb(null, true);
    }
    return cb(`Error: File upload only supports the following filetypes - ${filetypes}`);
  },
});

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(kue.app);

io.on('connection', (socket) => {
  console.log('connect');

  const getLast10Rows = () => {
    db.all('SELECT * FROM users ORDER BY created_at DESC LIMIT 10 OFFSET 0', (err, rows) => {
      socket.emit('getLast10Rows', rows);
    });
  };
  socket.on('getLast10Rows', getLast10Rows);

  socket.on('disconnect', () => {
    console.log('disconnect');
  });
});

jobs.process('csvFile', (job, done) => {
  let counter = 0;
  const parser = parse({ delimiter: ',' });

  const stream = fs.createReadStream(job.data.path).pipe(parser);
  stream.on('finish', () => {
    io.emit('fileParseComplete');
    done();
  });
  parser.on('readable', () => {
    const data = parser.read();
    if (counter && data) {
      db.run('INSERT INTO users VALUES (?, ?, ?, datetime("now"))', data);
    }
    counter += 1;
  });
});

jobs.on('job complete', (id) => {
  Job.get(id, (err, job) => {
    if (err) return;
    job.remove((errRemove) => {
      if (errRemove) throw errRemove;
      fs.unlink(job.data.path);
    });
  });
});

app.get('/', (req, res) => res.render('index'));

app.post('/', upload.single('file'), (req, res) => {
  if (req.file.mimetype !== 'text/csv') {
    return res.status(400).json({
      error: 'incorrect file format',
    });
  }

  return jobs.create('csvFile', req.file).save((err) => {
    if (err) {
      return res.status(400).json({
        error: err,
      });
    }
    return res.json({
      msg: 'File uploaded',
    });
  });
});

server.listen(3000, () => {
  console.log('CSV Uploader app listening on port 3000!');
});
