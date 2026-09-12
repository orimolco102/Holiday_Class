const test = require('node:test');
const assert = require('assert');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const fixtureHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf-8');
const appPath = require.resolve('../public/app.js');

function sampleEvents() {
    return [
        { id: 1, name: 'Winter Gala', category: 'Social', date: 'Dec 20', location: 'Main Hall', description: 'A festive evening.', spots: 4 }
    ];
}

function flushPromises() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

// app.js expects a real DOM (document, form elements, ...) and keeps
// module-level state, so each test gets a fresh document and a fresh copy.
function loadApp(fetchImpl) {
    global.document = new JSDOM(fixtureHtml).window.document;
    global.Event = new JSDOM().window.Event;
    global.fetch = fetchImpl;
    delete require.cache[appPath];
    require(appPath);
    return flushPromises();
}

test('GET /api/events is called on load', async () => {
    const originalFetch = global.fetch;
    const calls = [];

    try {
        await loadApp(async (url) => {
            calls.push(url);
            return { ok: true, json: async () => sampleEvents() };
        });

        assert.deepStrictEqual(calls, ['/api/events']);
    } finally {
        global.fetch = originalFetch;
    }
});

test('shows an error message when GET /api/events fails', async () => {
    const originalFetch = global.fetch;

    try {
        await loadApp(async () => {
            throw new Error('network down');
        });

        const status = document.getElementById('events-status');
        assert.strictEqual(status.hidden, false);
        assert.strictEqual(status.textContent, 'Events could not be loaded. Please refresh the page.');
    } finally {
        global.fetch = originalFetch;
    }
});

test('POST /api/register is called with the form data on submit', async () => {
    const originalFetch = global.fetch;
    let registerCall;

    try {
        await loadApp(async (url, options) => {
            if (url === '/api/events') {
                return { ok: true, json: async () => sampleEvents() };
            }
            registerCall = { url, options };
            return { ok: true, json: async () => ({ registration: { name: 'Jane', eventName: 'Winter Gala' } }) };
        });

        const form = document.getElementById('register-form');
        form.elements.name.value = 'Jane';
        form.elements.email.value = 'jane@example.com';
        document.getElementById('event-select').innerHTML = '<option value="1"></option>';
        document.getElementById('event-select').value = '1';
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await flushPromises();

        assert.strictEqual(registerCall.url, '/api/register');
        assert.strictEqual(registerCall.options.method, 'POST');
        assert.deepStrictEqual(JSON.parse(registerCall.options.body), {
            name: 'Jane',
            email: 'jane@example.com',
            eventId: 1
        });
    } finally {
        global.fetch = originalFetch;
    }
});

test('shows an error message when POST /api/register fails', async () => {
    const originalFetch = global.fetch;

    try {
        await loadApp(async (url) => {
            if (url === '/api/events') {
                return { ok: true, json: async () => sampleEvents() };
            }
            return { ok: false, json: async () => ({ error: 'Event is full.' }) };
        });

        const form = document.getElementById('register-form');
        form.elements.name.value = 'Jane';
        form.elements.email.value = 'jane@example.com';
        document.getElementById('event-select').innerHTML = '<option value="1"></option>';
        document.getElementById('event-select').value = '1';
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await flushPromises();

        const formError = document.getElementById('form-error');
        assert.strictEqual(formError.hidden, false);
        assert.strictEqual(formError.textContent, 'Event is full.');
    } finally {
        global.fetch = originalFetch;
    }
});
