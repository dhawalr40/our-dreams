import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

type InviteRow = {
  code: string;
  status: string;
  expires_at: string;
  message: string | null;
  worlds: { name: string } | null;
};

function buildSafeResponse(invite: InviteRow) {
  const isExpired = new Date(invite.expires_at) < new Date();
  const status = isExpired && invite.status === 'pending' ? 'expired' : invite.status;
  const worldName = (invite.worlds as { name: string } | null)?.name ?? 'Our Little World';

  const error =
    status === 'expired'   ? 'expired'
    : status === 'revoked'   ? 'revoked'
    : status === 'accepted'  ? 'already_accepted'
    : null;

  return {
    valid:        status === 'pending',
    status,
    inviter_name: 'Someone special',
    world_name:   worldName,
    message:      invite.message,
    expires_at:   invite.expires_at,
    error,
  };
}

// GET /api/invites/[code] — public invite info
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code || code.length < 4) {
      return Response.json({ valid: false, error: 'not_found' });
    }

    const supabase = await createClient();

    // ── Primary: security definer RPC (works for anon, returns display name) ──
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_invite_info', {
      p_code: code,
    });

    if (!rpcError && rpcData !== null && rpcData !== undefined) {
      // Supabase rpc() can return json-typed values as strings on some versions
      const result = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
      return Response.json(result);
    }

    if (rpcError) {
      console.error('[invites/[code]] RPC error:\n' + JSON.stringify(rpcError, null, 2));
    }

    // ── Fallback: direct query ─────────────────────────────────────────────────
    // Requires the "Public can look up invites by code" SELECT policy (using true).
    // Reached when get_invite_info() hasn't been created yet.
    const { data: invite, error: queryError } = await supabase
      .from('world_invites')
      .select('code, status, expires_at, message, worlds(name)')
      .eq('code', code)
      .maybeSingle();

    if (queryError) {
      console.error('[invites/[code]] fallback query failed:\n' + JSON.stringify(queryError, null, 2));
      return Response.json({ valid: false, error: 'not_found' });
    }

    if (!invite) {
      return Response.json({ valid: false, error: 'not_found' });
    }

    return Response.json(buildSafeResponse(invite as unknown as InviteRow));
  } catch (err) {
    console.error('[invites/[code]] unhandled error:\n' + JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    return Response.json({ valid: false, error: 'not_found' });
  }
}

// DELETE /api/invites/[code] — revoke an invite (owner only, enforced by RLS)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('world_invites')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('code', code)
      .eq('created_by', user.id);

    if (error) {
      console.error('revoke invite error:', error);
      return Response.json({ error: 'Failed to revoke' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('[invites/[code] DELETE] unhandled error:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
