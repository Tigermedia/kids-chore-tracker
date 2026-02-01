"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

type Child = {
  _id: Id<"children">;
  _creationTime: number;
  familyId: Id<"families">;
  name: string;
  avatar: string;
  theme: string;
  xp: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  totalTasksCompleted: number;
  createdAt: number;
};

interface ChildContextType {
  selectedChild: Child | null;
  selectedChildId: Id<"children"> | null;
  children: Child[] | undefined;
  selectChild: (id: Id<"children">) => void;
  clearChild: () => void;
  isLoading: boolean;
}

const ChildContext = createContext<ChildContextType | null>(null);

const STORAGE_KEY = "selectedChildId";

export function ChildProvider({ children: childrenProp }: { children: ReactNode }) {
  const [selectedChildId, setSelectedChildId] = useState<Id<"children"> | null>(null);
  const [initialized, setInitialized] = useState(false);
  const childrenList = useQuery(api.children.listByFamily);

  // On mount, read from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSelectedChildId(stored as Id<"children">);
      }
    } catch {
      // localStorage not available
    }
    setInitialized(true);
  }, []);

  // Handle auto-select for single child, and validate stored ID
  useEffect(() => {
    if (!initialized || childrenList === undefined) return;

    // If there are no children, clear selection
    if (childrenList.length === 0) {
      setSelectedChildId(null);
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      return;
    }

    // If a child is selected, validate it still exists
    if (selectedChildId) {
      const exists = childrenList.some((c) => c._id === selectedChildId);
      if (!exists) {
        // Child was deleted, clear selection
        setSelectedChildId(null);
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
        return;
      }
    }

    // Auto-select if only 1 child
    if (childrenList.length === 1 && !selectedChildId) {
      const onlyChild = childrenList[0];
      setSelectedChildId(onlyChild._id);
      try { localStorage.setItem(STORAGE_KEY, onlyChild._id); } catch {}
    }
  }, [childrenList, selectedChildId, initialized]);

  const selectChild = useCallback((id: Id<"children">) => {
    setSelectedChildId(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
  }, []);

  const clearChild = useCallback(() => {
    setSelectedChildId(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const selectedChild = selectedChildId && childrenList
    ? childrenList.find((c) => c._id === selectedChildId) ?? null
    : null;

  const isLoading = !initialized || childrenList === undefined;

  return (
    <ChildContext.Provider
      value={{
        selectedChild,
        selectedChildId,
        children: childrenList,
        selectChild,
        clearChild,
        isLoading,
      }}
    >
      {childrenProp}
    </ChildContext.Provider>
  );
}

export function useChild() {
  const context = useContext(ChildContext);
  if (!context) {
    throw new Error("useChild must be used within a ChildProvider");
  }
  return context;
}
