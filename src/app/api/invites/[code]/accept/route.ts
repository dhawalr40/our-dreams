import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

// POST /api/invites/[code]/accept — atomic server-side invite acceptance
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // The accept_world_invite function handles all validation atomically:
  // checks status, expiry, membership limit, duplicate prevention, and
  // inserts world_members + marks invite accepted in a single transaction.
  const { data, error } = await supabase.rpc('accept_world_invite', { p_code: code });

  if (error) {
    console.error('accept_world_invite error:', error);
    return Response.json({ success: false, error: 'server_error' }, { status: 500 });
  }

  return Response.json(data);
}
