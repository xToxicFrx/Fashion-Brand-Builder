import { StudioLoader } from '@/components/Canvas/StudioLoader';

export const metadata = { title: 'Design Studio' };

export default function NewDesignPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Design Studio</h1>
        <p className="text-muted-foreground">
          Create a new design. Add text, shapes, and images, then save or publish.
        </p>
      </div>
      <StudioLoader />
    </div>
  );
}
