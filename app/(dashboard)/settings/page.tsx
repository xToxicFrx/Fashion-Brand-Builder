import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SettingsForm } from '@/components/Settings/SettingsForm';

export const dynamic = 'force-dynamic';

const TIERS = [
  { name: 'Free', price: '€0', features: ['1 design', 'Basic trends'] },
  {
    name: 'Starter',
    price: '€20/mo',
    features: ['10 designs', 'Full trends', '1 store'],
  },
  {
    name: 'Pro',
    price: '€50/mo',
    features: ['Unlimited designs', 'All features', 'Multiple stores'],
  },
];

export default async function SettingsPage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return null;

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and subscription.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm
              initial={{
                name: user.name ?? '',
                bio: user.bio ?? '',
                role: user.role,
                category: user.category,
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subscription</CardTitle>
            <CardDescription>
              Current plan:{' '}
              <Badge variant="secondary" className="capitalize">
                {user.subscriptionTier}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">
                    {tier.name}{' '}
                    <span className="text-sm text-muted-foreground">
                      {tier.price}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tier.features.join(' · ')}
                  </p>
                </div>
                {user.subscriptionTier === tier.name.toLowerCase() && (
                  <Badge>Current</Badge>
                )}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Billing is wired through Stripe; upgrade flows activate once Stripe
              keys are configured.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
