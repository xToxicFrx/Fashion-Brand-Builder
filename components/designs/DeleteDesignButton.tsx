'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function DeleteDesignButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!window.confirm('Delete this design? This cannot be undone.')) return;
    setLoading(true);
    const res = await fetch(`/api/designs/${id}`, { method: 'DELETE' });
    setLoading(false);
    if (res.ok) {
      toast.success('Design deleted.');
      router.refresh();
    } else {
      toast.error('Failed to delete design.');
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onDelete}
      disabled={loading}
      aria-label="Delete design"
    >
      {loading ? <Loader2 className="animate-spin" /> : <Trash2 />}
    </Button>
  );
}
