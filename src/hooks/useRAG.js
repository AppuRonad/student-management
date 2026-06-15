import { useState, useEffect, useCallback } from 'react';
import { buildKnowledgeBase } from '../services/ragService';
import { getAllTrackRecords } from '../services/portalApi';

/**
 * useRAG — keeps a knowledge base in sync with the latest student data.
 *
 * Returns:
 *   kb          — the indexed knowledge base object (pass to retrieve())
 *   rebuildKB   — call this to force a rebuild (e.g., after new data is added)
 *   kbStats     — { docCount, lastBuilt } for display
 */
export function useRAG(students = []) {
  const [kb,        setKb]        = useState(null);
  const [kbStats,   setKbStats]   = useState({ docCount: 0, lastBuilt: null });
  const [building,  setBuilding]  = useState(false);

  const rebuildKB = useCallback(async () => {
    if (!students.length) return;
    setBuilding(true);
    try {
      // Fetch track records + competitions for all students
      let trackRecords = [];
      let competitions = [];

      try {
        trackRecords = (await getAllTrackRecords()) || [];
      } catch {
        trackRecords = [];
      }

      // Gather competitions from localStorage / portalApi if available
      try {
        const compPromises = students.slice(0, 20).map(s =>
          fetch(`http://localhost:8080/api/competitions/${s.id}`)
            .then(r => r.ok ? r.json() : [])
            .catch(() => [])
        );
        const results = await Promise.all(compPromises);
        competitions = results.flat().filter(Boolean);
      } catch {
        competitions = [];
      }

      const built = buildKnowledgeBase(students, trackRecords, competitions);
      setKb(built);
      setKbStats({
        docCount: built.docs.length,
        lastBuilt: new Date(),
      });
    } finally {
      setBuilding(false);
    }
  }, [students]);

  // Auto-rebuild when students list changes
  useEffect(() => {
    if (students.length > 0) {
      rebuildKB();
    }
  }, [students.length]);

  return { kb, rebuildKB, kbStats, building };
}
