const chai = require('chai');

const should = chai.should(); // eslint-disable-line no-unused-vars
const supertest = require('supertest');

const HOST = 'http://localhost:3000';
const request = supertest(HOST);
const fs = require('fs');

const io = require('socket.io-client');

const deleteFolderRecursive = (path) => {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file) => {
      const curPath = `${path}/${file}`;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
  }
};

describe('check file uploading', () => {
  const options = {
    transports: ['websocket'],
    'force new connection': true,
  };

  beforeEach((done) => {
    require('../app').server; // eslint-disable-line no-unused-expressions, global-require
    done();
  });

  after(() => {
    deleteFolderRecursive(`${__dirname}/../uploads`);
  });

  it('get init users state', (done) => {
    const client = io.connect(HOST, options);

    client.once('connect', () => {
      client.once('getLast10Rows', (users) => {
        users.should.be.empty; // eslint-disable-line no-unused-expressions

        client.disconnect();
        done();
      });

      client.emit('getLast10Rows', {});
    });
  });


  it('should upload invalid file', (done) => {
    request.post('/')
    .attach('file', `${__dirname}/../bower.json`)
    .end((err, res) => {
      res.status.should.equal(500);
      done();
    });
  });

  it('should upload valid file', (done) => {
    request.post('/')
    .attach('file', `${__dirname}/../example.csv`)
    .end((err, res) => {
      res.status.should.equal(200);
      res.body.msg.should.equal('File uploaded');
      done();
    });
  });

  it('should check db values', (done) => {
    const client = io.connect(HOST, options);

    client.once('connect', () => {
      client.once('getLast10Rows', (users) => {
        users.length.should.equal(3);
        client.disconnect();
        done();
      });
    });

    request.post('/')
    .attach('file', `${__dirname}/../example.csv`)
    .end(() => {
      client.emit('getLast10Rows', {});
    });
  });
});
