/**
 * Graph Processor — SIT Full Stack Engineering Challenge Round 1
 * Processes directed graph edges and returns structured hierarchy insights.
 */

const USER_ID = "aryan_20050410";
const EMAIL_ID = "aryan.sheladia.btech2023@sitpune.edu.in";
const ENROLLMENT_NUMBER = "23070122202";

/**
 * Validates a single edge string.
 * Returns { valid: true, parent, child } or { valid: false }
 */
function validateEdge(raw) {
  if (typeof raw !== "string") return { valid: false };

  const trimmed = raw.trim();
  if (trimmed === "") return { valid: false };

  // Must be exactly X->Y where X and Y are single uppercase letters A-Z
  const match = trimmed.match(/^([A-Z])->([A-Z])$/);
  if (!match) return { valid: false };

  const parent = match[1];
  const child = match[2];

  // Self-loop is invalid
  if (parent === child) return { valid: false };

  return { valid: true, parent, child };
}

/**
 * Main processing function.
 * @param {string[]} edges - Array of edge strings like "A->B"
 * @returns {object} Full API response object
 */
function processGraph(edges) {
  const invalidEntries = [];
  const duplicateEdges = [];
  const seenEdgeKeys = new Set();
  const duplicateEdgeKeys = new Set();

  // Edges that pass validation and dedup
  const cleanEdges = [];

  // ── Step 1: Validate & Deduplicate ──────────────────────────────
  for (const raw of edges) {
    const result = validateEdge(raw);

    if (!result.valid) {
      invalidEntries.push(raw);
      continue;
    }

    const key = `${result.parent}->${result.child}`;

    if (seenEdgeKeys.has(key)) {
      // Only record each duplicate edge string once
      if (!duplicateEdgeKeys.has(key)) {
        duplicateEdgeKeys.add(key);
        duplicateEdges.push(key);
      }
      continue;
    }

    seenEdgeKeys.add(key);
    cleanEdges.push({ parent: result.parent, child: result.child });
  }

  // ── Step 2: Build graph with single-parent enforcement ──────────
  const childToParent = {};          // child → parent
  const parentToChildren = {};       // parent → [child, ...]
  const allNodes = new Set();

  for (const edge of cleanEdges) {
    allNodes.add(edge.parent);
    allNodes.add(edge.child);

    // Multi-parent rule: first parent wins, discard later edges
    if (edge.child in childToParent) continue;

    childToParent[edge.child] = edge.parent;
    if (!parentToChildren[edge.parent]) {
      parentToChildren[edge.parent] = [];
    }
    parentToChildren[edge.parent].push(edge.child);
  }

  // ── Step 3: Find connected components ───────────────────────────
  // Build undirected adjacency from the final edge set
  const adj = {};
  for (const node of allNodes) adj[node] = new Set();

  for (const child in childToParent) {
    const parent = childToParent[child];
    adj[parent].add(child);
    adj[child].add(parent);
  }

  const visited = new Set();
  const components = [];

  for (const node of allNodes) {
    if (visited.has(node)) continue;

    const component = [];
    const queue = [node];
    visited.add(node);

    while (queue.length > 0) {
      const cur = queue.shift();
      component.push(cur);
      for (const neighbor of adj[cur]) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    components.push(component);
  }

  // ── Step 4: Build hierarchies ───────────────────────────────────
  const childSet = new Set(Object.keys(childToParent));
  const hierarchies = [];

  for (const component of components) {
    const roots = component.filter((n) => !childSet.has(n));

    if (roots.length === 0) {
      // Pure cycle — every node is a child
      const sortedComp = [...component].sort();
      hierarchies.push({
        root: sortedComp[0],
        tree: {},
        has_cycle: true,
      });
    } else {
      // With single-parent enforcement, exactly one root per component
      const root = roots.sort()[0];

      const tree = {};
      tree[root] = buildSubtree(root, parentToChildren);
      const depth = calcDepth(root, parentToChildren);

      const entry = { root, tree, depth };
      // Spec: omit has_cycle for non-cyclic trees
      hierarchies.push(entry);
    }
  }

  // ── Step 5: Summary ────────────────────────────────────────────
  const nonCyclic = hierarchies.filter((h) => !h.has_cycle);
  const cyclic = hierarchies.filter((h) => h.has_cycle);

  let largestTreeRoot = "";
  let maxDepth = 0;

  for (const h of nonCyclic) {
    if (
      h.depth > maxDepth ||
      (h.depth === maxDepth && h.root < largestTreeRoot)
    ) {
      maxDepth = h.depth;
      largestTreeRoot = h.root;
    }
  }

  return {
    user_id: USER_ID,
    email_id: EMAIL_ID,
    enrollment_number: ENROLLMENT_NUMBER,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: {
      total_trees: nonCyclic.length,
      total_cycles: cyclic.length,
      largest_tree_root: largestTreeRoot,
    },
  };
}

/**
 * Recursively builds a nested tree object from a node.
 */
function buildSubtree(node, parentToChildren) {
  const children = parentToChildren[node] || [];
  const subtree = {};
  for (const child of children.sort()) {
    subtree[child] = buildSubtree(child, parentToChildren);
  }
  return subtree;
}

/**
 * Calculates depth = number of nodes on the longest root-to-leaf path.
 */
function calcDepth(node, parentToChildren) {
  const children = parentToChildren[node] || [];
  if (children.length === 0) return 1;

  let maxChildDepth = 0;
  for (const child of children) {
    maxChildDepth = Math.max(maxChildDepth, calcDepth(child, parentToChildren));
  }
  return 1 + maxChildDepth;
}

module.exports = { processGraph };
