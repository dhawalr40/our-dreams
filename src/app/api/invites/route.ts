import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';

// POST /api/invites — create a new invite for the authenticated user's world
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: member } = await supabase
    .from('world_members')
    .select('world_id, role')
    .eq('user_id', user.id)
    .order('role', { ascending: true })
    .limit(1)
    .single();

  if (!member) {
    return Response.json({ error: 'No world found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const message: string | null = body.message || null;

  // Return any still-valid pending invite instead of creating a duplicate
  const { data: existing } = await supabase
    .from('world_invites')
    .select('code, expires_at')
    .eq('world_id', member.world_id)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

  if (existing) {
    return Response.json({
      code: existing.code,
      url: `${baseUrl}/join?code=${existing.code}`,
      expires_at: existing.expires_at,
      is_existing: true,
    });
  }

  // Generate a cryptographically secure 12-char URL-safe code
  const code = randomBytes(9).toString('base64url');

  // Expires in 48 hours
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data: invite, error } = await supabase
    .from('world_invites')
    .insert({
      world_id:   member.world_id,
      created_by: user.id,
      code,
      message,
      expires_at: expiresAt,
    })
    .select('code, expires_at')
    .single();

  if (error) {
    console.error('invite creation error:', error);
    return Response.json({ error: 'Failed to create invite' }, { status: 500 });
  }

  return Response.json({
    code:        invite.code,
    url:         `${baseUrl}/join?code=${invite.code}`,
    expires_at:  invite.expires_at,
    is_existing: false,
  });
}

// GET /api/invites — list invites for the authenticated user's world
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: member } = await supabase
    .from('world_members')
    .select('world_id')
    .eq('user_id', user.id)
    .order('role', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!member) {
    return Response.json({ invites: [] });
  }

  const { data: invites } = await supabase
    .from('world_invites')
    .select('*')
    .eq('world_id', member.world_id)
    .order('created_at', { ascending: false });

  return Response.json({ invites: invites || [] });
}
