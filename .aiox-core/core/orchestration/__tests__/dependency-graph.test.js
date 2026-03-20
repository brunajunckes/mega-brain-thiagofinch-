'use strict';

const { DependencyGraph } = require('../dependency-graph');

describe('DependencyGraph', () => {
  let graph;

  beforeEach(() => {
    graph = new DependencyGraph();
  });

  describe('addNode', () => {
    it('should add a node with metadata', () => {
      graph.addNode('task1', { priority: 'high', timeout: 5000 });
      expect(graph.nodes.get('task1')).toEqual({ priority: 'high', timeout: 5000 });
    });

    it('should add a node without metadata', () => {
      graph.addNode('task1');
      expect(graph.nodes.get('task1')).toEqual({});
    });

    it('should initialize edges for a new node', () => {
      graph.addNode('task1');
      expect(graph.edges.has('task1')).toBe(true);
      expect(graph.edges.get('task1')).toEqual([]);
    });

    it('should allow adding node with same ID multiple times (update metadata)', () => {
      graph.addNode('task1', { v: 1 });
      graph.addNode('task1', { v: 2 });
      expect(graph.nodes.get('task1')).toEqual({ v: 2 });
    });
  });

  describe('addEdge', () => {
    it('should add an edge between two nodes', () => {
      graph.addNode('task1');
      graph.addNode('task2');
      graph.addEdge('task1', 'task2');

      expect(graph.edges.get('task1')).toContain('task2');
    });

    it('should create source node if it does not exist', () => {
      graph.addEdge('task1', 'task2');
      expect(graph.edges.has('task1')).toBe(true);
    });

    it('should allow multiple edges from same node', () => {
      graph.addNode('task1');
      graph.addNode('task2');
      graph.addNode('task3');
      graph.addEdge('task1', 'task2');
      graph.addEdge('task1', 'task3');

      expect(graph.edges.get('task1')).toEqual(['task2', 'task3']);
    });

    it('should allow duplicate edges', () => {
      graph.addNode('task1');
      graph.addNode('task2');
      graph.addEdge('task1', 'task2');
      graph.addEdge('task1', 'task2');

      expect(graph.edges.get('task1')).toEqual(['task2', 'task2']);
    });
  });

  describe('topologicalSort', () => {
    it('should sort single node', () => {
      graph.addNode('task1');
      const result = graph.topologicalSort();
      expect(result).toEqual(['task1']);
    });

    it('should sort linear dependency chain', () => {
      // task3 -> task2 -> task1
      graph.addNode('task1');
      graph.addNode('task2');
      graph.addNode('task3');
      graph.addEdge('task3', 'task2');
      graph.addEdge('task2', 'task1');

      const result = graph.topologicalSort();
      // task1 should be first (no dependencies)
      expect(result.indexOf('task1')).toBeLessThan(result.indexOf('task2'));
      expect(result.indexOf('task2')).toBeLessThan(result.indexOf('task3'));
    });

    it('should sort complex graph', () => {
      //     task4
      //      |
      // task1 -> task2 -> task3
      graph.addNode('task1');
      graph.addNode('task2');
      graph.addNode('task3');
      graph.addNode('task4');
      graph.addEdge('task3', 'task2');
      graph.addEdge('task2', 'task1');
      graph.addEdge('task4', 'task1');

      const result = graph.topologicalSort();
      expect(result.indexOf('task1')).toBeLessThan(result.indexOf('task2'));
      expect(result.indexOf('task1')).toBeLessThan(result.indexOf('task3'));
      expect(result.indexOf('task1')).toBeLessThan(result.indexOf('task4'));
    });

    it('should handle nodes with no dependencies', () => {
      graph.addNode('task1');
      graph.addNode('task2');
      graph.addNode('task3');
      // No edges

      const result = graph.topologicalSort();
      expect(result).toHaveLength(3);
      expect(new Set(result)).toEqual(new Set(['task1', 'task2', 'task3']));
    });

    it('should sort subset of nodes', () => {
      graph.addNode('task1');
      graph.addNode('task2');
      graph.addNode('task3');
      graph.addNode('task4');
      graph.addEdge('task3', 'task2');
      graph.addEdge('task2', 'task1');

      const result = graph.topologicalSort(['task1', 'task3']);
      expect(result).toEqual(['task1', 'task3']);
    });

    it('should handle empty graph', () => {
      const result = graph.topologicalSort();
      expect(result).toEqual([]);
    });

    it('should throw on circular dependency', () => {
      graph.addNode('task1');
      graph.addNode('task2');
      graph.addEdge('task1', 'task2');
      graph.addEdge('task2', 'task1');

      expect(() => graph.topologicalSort()).toThrow(/Circular dependency/);
    });

    it('should throw on self-referential dependency', () => {
      graph.addNode('task1');
      graph.addEdge('task1', 'task1');

      expect(() => graph.topologicalSort()).toThrow(/Circular dependency/);
    });

    it('should throw on cycle in larger graph', () => {
      // task1 -> task2 -> task3 -> task2 (cycle)
      graph.addNode('task1');
      graph.addNode('task2');
      graph.addNode('task3');
      graph.addEdge('task1', 'task2');
      graph.addEdge('task2', 'task3');
      graph.addEdge('task3', 'task2');

      expect(() => graph.topologicalSort()).toThrow(/Circular dependency/);
    });

    it('should handle edges to unknown nodes', () => {
      graph.addNode('task1');
      graph.addEdge('task1', 'unknown');

      // Only processes explicitly added nodes
      const result = graph.topologicalSort();
      expect(result).toContain('task1');
      expect(result).not.toContain('unknown'); // unknown not in graph
    });

    it('should process unknown dependencies when explicitly included in taskIds', () => {
      graph.addNode('task1');
      graph.addEdge('task1', 'unknown');

      // Include unknown in the sort request
      const result = graph.topologicalSort(['task1', 'unknown']);
      expect(result).toContain('task1');
      expect(result).toContain('unknown');
    });
  });

  describe('detectCycles', () => {
    it('should detect no cycles in acyclic graph', () => {
      graph.addNode('task1');
      graph.addNode('task2');
      graph.addNode('task3');
      graph.addEdge('task1', 'task2');
      graph.addEdge('task2', 'task3');

      const cycles = graph.detectCycles();
      expect(cycles).toEqual([]);
    });

    it('should detect self-referential cycle', () => {
      graph.addNode('task1');
      graph.addEdge('task1', 'task1');

      const cycles = graph.detectCycles();
      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0]).toContain('task1');
    });

    it('should detect simple cycle', () => {
      graph.addNode('task1');
      graph.addNode('task2');
      graph.addEdge('task1', 'task2');
      graph.addEdge('task2', 'task1');

      const cycles = graph.detectCycles();
      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should detect cycle in complex graph', () => {
      graph.addNode('task1');
      graph.addNode('task2');
      graph.addNode('task3');
      graph.addNode('task4');
      graph.addEdge('task1', 'task2');
      graph.addEdge('task2', 'task3');
      graph.addEdge('task3', 'task4');
      graph.addEdge('task4', 'task2'); // Cycle: 2 -> 3 -> 4 -> 2

      const cycles = graph.detectCycles();
      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should handle graph with isolated nodes', () => {
      graph.addNode('task1');
      graph.addNode('task2');
      graph.addNode('task3');
      graph.addNode('task4');
      // No edges

      const cycles = graph.detectCycles();
      expect(cycles).toEqual([]);
    });

    it('should handle empty graph', () => {
      const cycles = graph.detectCycles();
      expect(cycles).toEqual([]);
    });
  });

  describe('performance', () => {
    it('should handle large graphs efficiently', () => {
      const start = Date.now();

      // Create a graph with 100 nodes in linear order
      for (let i = 0; i < 100; i++) {
        graph.addNode(`task${i}`);
        if (i > 0) {
          graph.addEdge(`task${i}`, `task${i - 1}`);
        }
      }

      const result = graph.topologicalSort();
      const duration = Date.now() - start;

      expect(result).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete in < 1 second
    });

    it('should handle wide dependency fan-out', () => {
      const start = Date.now();

      // Create a graph where task0 depends on 50 other tasks
      graph.addNode('task0');
      for (let i = 1; i <= 50; i++) {
        graph.addNode(`task${i}`);
        graph.addEdge('task0', `task${i}`);
      }

      const result = graph.topologicalSort();
      const duration = Date.now() - start;

      expect(result).toHaveLength(51);
      expect(result[50]).toBe('task0'); // task0 should be last
      expect(duration).toBeLessThan(1000);
    });
  });
});
