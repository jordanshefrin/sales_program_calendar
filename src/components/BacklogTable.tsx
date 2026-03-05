"use client";

import { useEffect, useState } from "react";

type BacklogItem = {
  id: string;
  idea: string;
  created_at: string;
};

export default function BacklogTable() {
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [newIdea, setNewIdea] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/backlog")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setItems(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function addIdea(e: React.FormEvent) {
    e.preventDefault();
    if (!newIdea.trim()) return;

    const res = await fetch("/api/backlog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea: newIdea.trim() }),
    });

    if (res.ok) {
      const item = await res.json();
      setItems((prev) => [item, ...prev]);
      setNewIdea("");
    }
  }

  async function removeIdea(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch("/api/backlog", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-24 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Program Ideas Backlog</h2>
      </div>

      {/* Add new idea */}
      <form onSubmit={addIdea} className="px-6 py-3 border-b bg-gray-50 flex gap-2">
        <input
          type="text"
          value={newIdea}
          onChange={(e) => setNewIdea(e.target.value)}
          className="flex-1 border rounded-md px-3 py-2 text-sm text-gray-900"
          placeholder="Add a program idea..."
        />
        <button
          type="submit"
          disabled={!newIdea.trim()}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
        >
          Add
        </button>
      </form>

      {items.length === 0 ? (
        <div className="px-6 py-4 text-sm text-gray-500">No ideas yet. Add one above.</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {items.map((item) => (
            <li key={item.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
              <span className="text-sm text-gray-900">{item.idea}</span>
              <button
                onClick={() => removeIdea(item.id)}
                className="text-xs text-red-500 hover:text-red-700 ml-4 whitespace-nowrap"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
