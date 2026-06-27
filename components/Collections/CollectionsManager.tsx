'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Item {
  id: string;
  title: string;
  keyword: string | null;
  status: string;
}
interface Collection {
  id: string;
  name: string;
  description: string | null;
  status: string;
  items: Item[];
}

const ITEM_STATUSES = ['idea', 'designing', 'ready', 'listed'] as const;
const STATUS_STYLE: Record<string, string> = {
  idea: 'bg-muted text-muted-foreground',
  designing: 'bg-blue-100 text-blue-700',
  ready: 'bg-amber-100 text-amber-700',
  listed: 'bg-green-100 text-green-700',
};

export function CollectionsManager({
  initialCollections,
}: {
  initialCollections: Collection[];
}) {
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [itemInputs, setItemInputs] = useState<Record<string, string>>({});

  async function createCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not create');
      setCollections((c) => [{ ...json.collection, items: [] }, ...c]);
      setNewName('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create');
    } finally {
      setCreating(false);
    }
  }

  async function deleteCollection(id: string) {
    setCollections((c) => c.filter((x) => x.id !== id));
    await fetch(`/api/collections/${id}`, { method: 'DELETE' }).catch(() => {});
  }

  async function addItem(collectionId: string) {
    const title = (itemInputs[collectionId] ?? '').trim();
    if (!title) return;
    try {
      const res = await fetch(`/api/collections/${collectionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not add');
      setCollections((c) =>
        c.map((col) =>
          col.id === collectionId
            ? { ...col, items: [...col.items, json.item] }
            : col,
        ),
      );
      setItemInputs((m) => ({ ...m, [collectionId]: '' }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add');
    }
  }

  async function cycleStatus(collectionId: string, item: Item) {
    const idx = ITEM_STATUSES.indexOf(item.status as (typeof ITEM_STATUSES)[number]);
    const next = ITEM_STATUSES[(idx + 1) % ITEM_STATUSES.length];
    setCollections((c) =>
      c.map((col) =>
        col.id === collectionId
          ? {
              ...col,
              items: col.items.map((it) =>
                it.id === item.id ? { ...it, status: next } : it,
              ),
            }
          : col,
      ),
    );
    await fetch(`/api/collection-items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    }).catch(() => {});
  }

  async function deleteItem(collectionId: string, itemId: string) {
    setCollections((c) =>
      c.map((col) =>
        col.id === collectionId
          ? { ...col, items: col.items.filter((it) => it.id !== itemId) }
          : col,
      ),
    );
    await fetch(`/api/collection-items/${itemId}`, { method: 'DELETE' }).catch(
      () => {},
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createCollection} className="flex gap-3">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New collection / drop name — e.g. Summer Y2K Drop"
          maxLength={80}
        />
        <Button type="submit" disabled={creating} className="shrink-0">
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          New collection
        </Button>
      </form>

      {collections.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No collections yet. Create one to plan a drop around your trends.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {collections.map((col) => {
            const done = col.items.filter((i) => i.status === 'listed').length;
            return (
              <Card key={col.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg">{col.name}</CardTitle>
                    <button
                      onClick={() => deleteCollection(col.id)}
                      className="text-muted-foreground hover:text-red-600"
                      aria-label="Delete collection"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {col.items.length} item{col.items.length === 1 ? '' : 's'} ·{' '}
                    {done} listed
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {col.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                      >
                        <span className="truncate text-sm">{item.title}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => cycleStatus(col.id, item)}
                            className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                              STATUS_STYLE[item.status] ?? STATUS_STYLE.idea
                            }`}
                            title="Click to advance status"
                          >
                            {item.status}
                          </button>
                          <button
                            onClick={() => deleteItem(col.id, item.id)}
                            className="text-muted-foreground hover:text-red-600"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={itemInputs[col.id] ?? ''}
                      onChange={(e) =>
                        setItemInputs((m) => ({ ...m, [col.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addItem(col.id);
                        }
                      }}
                      placeholder="Add an item / design…"
                      maxLength={160}
                      className="h-9"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addItem(col.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
