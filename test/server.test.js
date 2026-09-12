const test = require('node:test');
const assert = require('assert');
const request = require('supertest');
const {app} = require('../server.js');

test('testing the json syntax catcher', async() => {
    const res = await request(app)
    .post('/api/register')
    .set('Content-Type', 'application/json')
    .send('{ this is not valid json');
    //checks if the error handler is sending "Invalid JSON body"
    assert.strictEqual(res.body.error, "Invalid JSON body");
});

test('testing a known id is returning 200', async() => {
    const res = await request(app).get('/api/events/1');
    // check the GET and expecting a valid return
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.id, 1);
});

test('testing an invalid id', async() => {
    const res = await request(app).get('/api/events/abc');
    // check if the error handeling is working
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.error, "Event not found");
});

test('GET /health returns correctly', async() => {
    const res = await request(app).get('/health');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
    assert.strictEqual(res.body.service, 'holiday-events');
});


test('/POST error name is missing', async() => {
    const res = await request(app).post('/api/register')
    .send({ email: 'jane@example.com', eventId: 2 });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Name is required');
});

test('/post error invalid email is recived', async() => {
    const res = await request(app).post('/api/register')
    .send({ name: 'test', email: 'notvalemail.com', eventId: 2 });

    
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.body.error, "A valid email is required" );
});

test('/post event id is required', async() => {
    const res = await request(app).post('/api/register')
    .send({ name: 'test', email: 'jane@example.com'});

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'eventId is required');
});

test('/post sent with an invalid event id', async() => {
    const res = await request(app).post('/api/register')
    .send({ name: 'test', email: 'jane@example.com', eventId: 999});

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.error, 'Event not found');
});

test('/post but the event is full', async()=> {

    for (let i = 0; i < 12; i += 1) {
        await request(app).post('/api/register')
            .send({ name: 'test', email: 'jane@example.com', eventId: 7 });
    }

    const res = await request(app)
        .post('/api/register')
        .send({ name: 'test', email: 'jane@example.com', eventId: 7 });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.error, 'Event is full');
});

