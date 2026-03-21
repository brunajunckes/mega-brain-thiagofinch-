/**
 * Dependency Graph - Task dependency management and topological sorting
 * @module dependency-graph
 */

'use strict';

class DependencyGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  /**
   * Add a node to the graph
   */
  addNode(id, metadata = {}) {
    this.nodes.set(id, metadata);
    if (!this.edges.has(id)) {
      this.edges.set(id, []);
    }
  }

  /**
   * Add an edge (dependency) between nodes
   */
  addEdge(from, to) {
    if (!this.edges.has(from)) {
      this.edges.set(from, []);
    }
    this.edges.get(from).push(to);
  }

  /**
   * Topological sort - returns tasks in execution order
   */
  topologicalSort(taskIds = null) {
    const ids = taskIds || Array.from(this.nodes.keys());
    const visited = new Set();
    const visiting = new Set();
    const result = [];

    const visit = (id) => {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        throw new Error(`Circular dependency detected at ${id}`);
      }

      visiting.add(id);

      const deps = this.edges.get(id) || [];
      for (const dep of deps) {
        if (ids.includes(dep)) {
          visit(dep);
        }
      }

      visiting.delete(id);
      visited.add(id);
      result.push(id);
    };

    for (const id of ids) {
      visit(id);
    }

    return result;
  }

  /**
   * Detect circular dependencies
   */
  detectCycles() {
    const visited = new Set();
    const stack = new Set();
    const cycles = [];

    const dfs = (node, path = []) => {
      if (stack.has(node)) {
        cycles.push([...path, node]);
        return;
      }
      if (visited.has(node)) return;

      visited.add(node);
      stack.add(node);

      for (const dep of this.edges.get(node) || []) {
        dfs(dep, [...path, node]);
      }

      stack.delete(node);
    };

    for (const node of this.nodes.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return cycles;
  }
}

module.exports = { DependencyGraph };
