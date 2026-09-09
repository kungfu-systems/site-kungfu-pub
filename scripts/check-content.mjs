import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const catalog = JSON.parse(
  readFileSync(new URL('../src/data/catalog.json', import.meta.url), 'utf8'),
);
const resourceIds = new Set(catalog.resources.map((r) => r.id));
const nodeIds = new Set(catalog.nodes.map((n) => n.id));
for (const key of ['resources', 'nodes', 'roadmaps', 'observations', 'careerSources']) {
  const items = catalog[key];
  assert.equal(new Set(items.map((x) => x.id)).size, items.length, `${key}: duplicate ID`);
}
for (const resource of [...catalog.resources, ...catalog.careerSources]) {
  assert.equal(new URL(resource.url).protocol, 'https:');
}
for (const resource of catalog.resources) {
  for (const key of [
    'title',
    'source',
    'description',
    'category',
    'type',
    'language',
    'level',
    'prerequisite',
    'start',
    'outcome',
    'access',
    'reviewNote',
  ]) {
    assert.equal(typeof resource[key], 'string', `${resource.id}: missing ${key}`);
    assert(resource[key].trim(), `${resource.id}: empty ${key}`);
  }
  assert.equal(new URL(resource.sourceUrl).protocol, 'https:');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(resource.checkedAt), `${resource.id}: invalid check date`);
  assert(resource.checkedAt <= catalog.reviewedAt, `${resource.id}: inconsistent check date`);
}
for (const node of catalog.nodes) {
  for (const id of node.prerequisites)
    assert(nodeIds.has(id), `${node.id}: missing prerequisite ${id}`);
  for (const id of node.resourceIds)
    assert(resourceIds.has(id), `${node.id}: missing resource ${id}`);
  if (node.tutorial)
    assert(
      existsSync(new URL(`../src/content/tutorials/${node.tutorial}.md`, import.meta.url)),
      `Missing tutorial ${node.tutorial}`,
    );
}
const visiting = new Set(),
  visited = new Set();
function visit(id) {
  assert(!visiting.has(id), `Prerequisite cycle at ${id}`);
  if (visited.has(id)) return;
  visiting.add(id);
  catalog.nodes.find((n) => n.id === id).prerequisites.forEach(visit);
  visiting.delete(id);
  visited.add(id);
}
catalog.nodes.forEach((n) => visit(n.id));
for (const roadmap of catalog.roadmaps) {
  assert.equal(new Set(roadmap.nodes).size, roadmap.nodes.length, 'Duplicate roadmap node');
  roadmap.nodes.forEach((id) => assert(nodeIds.has(id), `Unknown roadmap node: ${id}`));
}
for (const observation of catalog.observations)
  observation.resourceIds.forEach((id) =>
    assert(resourceIds.has(id), `Unknown observation source: ${id}`),
  );
console.log(
  `Content verified: ${catalog.roadmaps.length} roadmaps, ${catalog.nodes.length} nodes, ${catalog.resources.length} resources, ${catalog.observations.length} observations; references valid; prerequisite graph acyclic.`,
);
