import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { startTestApp, type TestApp } from './support/harness.ts';

const checkIn = { emotion: 'Happy', magnitude: 7, description: 'Sunny walk', time: '09:30' };
const day = (overrides: object = {}) => ({ rating: 6.5, journal: 'A good day', emotions: [checkIn], ...overrides });

describe('days', () => {
  let app: TestApp;
  before(async () => {
    app = await startTestApp();
  });
  after(() => app.stop());

  it('reads an unrecorded date as a blank day without storing it', async () => {
    const { token } = await app.register();
    const blank = await app.request('GET', '/days/2024-12-10', { token });
    assert.equal(blank.status, 200);
    assert.deepEqual(blank.body, { date: '2024-12-10', rating: 0, journal: '', emotions: [] });
    assert.deepEqual((await app.request('GET', '/days', { token })).body, { items: [] });
  });

  it('records a day and replaces it on the next save', async () => {
    const { token } = await app.register();

    const saved = await app.request('PUT', '/days/2024-12-10', { token, body: day() });
    assert.equal(saved.status, 200);
    assert.deepEqual(saved.body, { date: '2024-12-10', ...day() });
    assert.equal(saved.body.ownerId, undefined, 'internal fields are not exposed');
    assert.deepEqual((await app.request('GET', '/days/2024-12-10', { token })).body, saved.body);

    const replaced = await app.request('PUT', '/days/2024-12-10', {
      token,
      body: day({ rating: 0, journal: '', emotions: [] }),
    });
    assert.equal(replaced.status, 200);
    const all = await app.request('GET', '/days', { token });
    assert.deepEqual(all.body.items, [{ date: '2024-12-10', rating: 0, journal: '', emotions: [] }]);
  });

  it('lists days oldest first and filters by an inclusive date range', async () => {
    const { token } = await app.register();
    for (const date of ['2024-12-31', '2024-11-30', '2025-01-01', '2024-12-01']) {
      await app.request('PUT', `/days/${date}`, { token, body: day() });
    }
    const dates = async (query: string) =>
      (await app.request('GET', `/days${query}`, { token })).body.items.map((item: { date: string }) => item.date);

    assert.deepEqual(await dates(''), ['2024-11-30', '2024-12-01', '2024-12-31', '2025-01-01']);
    assert.deepEqual(await dates('?from=2024-12-01&to=2024-12-31'), ['2024-12-01', '2024-12-31']);
    assert.deepEqual(await dates('?from=2024-12-02'), ['2024-12-31', '2025-01-01']);
    assert.deepEqual(await dates('?to=2024-11-30'), ['2024-11-30']);
    assert.equal((await app.request('GET', '/days?from=2025-01-01&to=2024-01-01', { token })).status, 400);
  });

  it("never exposes, overwrites or erases another user's days", async () => {
    const owner = await app.register();
    const intruder = await app.register();
    await app.request('PUT', '/days/2024-12-10', { token: owner.token, body: day({ journal: 'Private' }) });

    assert.equal((await app.request('GET', '/days/2024-12-10', { token: intruder.token })).body.journal, '');
    assert.deepEqual((await app.request('GET', '/days', { token: intruder.token })).body.items, []);
    await app.request('PUT', '/days/2024-12-10', { token: intruder.token, body: day({ journal: 'Mine' }) });
    assert.equal((await app.request('DELETE', '/days', { token: intruder.token })).status, 204);

    assert.equal((await app.request('GET', '/days/2024-12-10', { token: owner.token })).body.journal, 'Private');
    assert.deepEqual((await app.request('GET', '/days', { token: intruder.token })).body.items, []);
  });

  it('validates input', async () => {
    const { token } = await app.register();
    const invalid: [string, string, unknown][] = [
      ['PUT', '/days/2024-12-10', {}],
      ['PUT', '/days/2024-12-10', day({ rating: 11 })],
      ['PUT', '/days/2024-12-10', day({ rating: '7' })],
      ['PUT', '/days/2024-12-10', day({ journal: 'x'.repeat(2_001) })],
      ['PUT', '/days/2024-12-10', day({ emotions: [{ ...checkIn, emotion: 'Hangry' }] })],
      ['PUT', '/days/2024-12-10', day({ emotions: [{ ...checkIn, magnitude: 11 }] })],
      ['PUT', '/days/2024-12-10', day({ emotions: [{ ...checkIn, userId: 'x' }] })],
      ['PUT', '/days/2024-12-10', day({ ownerId: '0190a000-0000-7000-8000-000000000000' })],
      ['PUT', '/days/2024-12-10', day({ date: '2024-12-11' })],
      ['PUT', '/days/2024-13-40', day()],
      ['PUT', '/days/12-10-2024', day()],
      ['GET', '/days/yesterday', undefined],
      ['GET', '/days?from=soon', undefined],
      ['GET', '/days?username=someone', undefined],
    ];
    for (const [method, path, body] of invalid) {
      const response = await app.request(method, path, { token, body });
      assert.equal(response.status, 400, `${method} ${path} ${JSON.stringify(body)}`);
    }
  });
});
