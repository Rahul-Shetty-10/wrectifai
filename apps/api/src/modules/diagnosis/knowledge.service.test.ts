import { test, before, after } from 'node:test';
import assert from 'node:assert';
import { getDbPool } from '../../config/database';
import { KnowledgeService } from './knowledge.service';

let pool: ReturnType<typeof getDbPool>;

before(() => {
  pool = getDbPool();
});

// Do not close the shared database pool in individual test files as it disrupts concurrent/subsequent tests.

test('DB - KnowledgeService.findMatchingIssues resolves matching issues from keywords', async () => {
  // Test matching a clear engine noise keyword
  const engineMatches = await KnowledgeService.findMatchingIssues(
    'My engine makes a ticking sound when accelerating',
    undefined,
    undefined,
    'engine_noise'
  );

  assert.ok(engineMatches.length > 0, 'Should find at least one engine noise match');
  assert.strictEqual(engineMatches[0].category, 'engine_noise');
  assert.strictEqual(engineMatches[0].issue_name, 'Low Engine Oil or Poor Lubrication');
  assert.strictEqual(engineMatches[0].diy_allowed, true);
  assert.strictEqual(engineMatches[0].safety_critical, false);
});

test('DB - KnowledgeService.findMatchingIssues filters by category correctly', async () => {
  // Even if keywords might overlap, forcing a category should limit result
  const acMatches = await KnowledgeService.findMatchingIssues(
    'ac is not cooling and making a whining sound',
    undefined,
    undefined,
    'ac_not_cooling'
  );

  assert.ok(acMatches.length > 0);
  assert.strictEqual(acMatches[0].category, 'ac_not_cooling');
  assert.ok(acMatches.every(m => m.category === 'ac_not_cooling'));
});

test('DB - KnowledgeService.findMatchingIssues handles vehicle specific filters', async () => {
  // Testing with dummy make that has zero matching rules (should return issues because makes is NULL/all)
  const matches = await KnowledgeService.findMatchingIssues(
    'wipers leaving streaks or brake vibration',
    'Ferrari',
    2020
  );

  // Since all seed data has makes = NULL, it should still match all vehicles
  assert.ok(matches.length > 0);
  const brakeIssue = matches.find(m => m.issue_name === 'Warped Brake Disc');
  assert.ok(brakeIssue);
  assert.strictEqual(brakeIssue?.safety_critical, true);
  assert.strictEqual(brakeIssue?.diy_allowed, false);
});
