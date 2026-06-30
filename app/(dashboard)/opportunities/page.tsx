import { getCurrentUser } from '@/lib/auth';
import { getUserCategory } from '@/lib/category-server';
import { getCategory } from '@/lib/categories';
import { OpportunityFinder } from '@/components/Opportunities/OpportunityFinder';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Opportunity Finder' };

export default async function OpportunitiesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const categoryId = await getUserCategory(user.id);
  const cat = getCategory(categoryId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Opportunity Finder</h1>
        <p className="text-muted-foreground">
          The best {cat.label.toLowerCase()} opportunities to launch right now —
          ranked by demand, competition and margin. Pick one to analyze or turn
          into a design.
        </p>
      </div>
      <OpportunityFinder categoryLabel={cat.label} />
    </div>
  );
}
