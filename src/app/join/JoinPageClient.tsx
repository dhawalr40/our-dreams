'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────

type Phase =
  | 'loading'
  | 'no_code'
  | 'error'
  | 'invitation'
  | 'celebrating'
  | 'auth_choice'
  | 'signup'
  | 'login'
  | 'signup_pending'
  | 'accepting'
  | 'success'
  | 'already_member';

interface InviteInfo {
  valid: boolean;
  status: string;
  inviter_name: string;
  world_name: string;
  message: string | null;
  expires_at: string;
  error?: string;
}

// Main heading copy that changes with each NO click
const NO_HEADINGS = [
  null,                                           // 0: never shown (use invite heading)
  'EXCUSE ME? 😭',
  'Are you sure?? 🥺',
  'Like... REALLY sure??',
  'Think of all the cute memories...',
  'The cat is judging you. 🐱',
  'Fine. I\'ll stop asking 😂',
];

// NO button labels that evolve
const NO_LABELS = [
  'no thanks 😐',
  'still no',
  '...no',
  'nope',
  'no 💔',
  'still no 😤',
  'no (for real)',
];

// Floating heart positions for celebration
const HEARTS = [
  { left: '10%',  delay: '0s',    size: '1.4rem' },
  { left: '25%',  delay: '0.3s',  size: '1rem'   },
  { left: '40%',  delay: '0.1s',  size: '1.8rem' },
  { left: '55%',  delay: '0.5s',  size: '1.2rem' },
  { left: '70%',  delay: '0.2s',  size: '1.5rem' },
  { left: '82%',  delay: '0.4s',  size: '1rem'   },
  { left: '90%',  delay: '0.15s', size: '1.3rem' },
  { left: '18%',  delay: '0.6s',  size: '1.6rem' },
  { left: '60%',  delay: '0.35s', size: '0.9rem' },
  { left: '45%',  delay: '0.7s',  size: '1.1rem' },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function JoinPageClient({ code }: { code?: string }) {
  const router = useRouter();

  const [phase, setPhase]         = useState<Phase>('loading');
  const [invite, setInvite]       = useState<InviteInfo | null>(null);
  const [noCount, setNoCount]     = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errorType, setErrorType] = useState('');

  // Auth form state
  const [name, setName]                 = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError]       = useState('');
  const [formLoading, setFormLoading]   = useState(false);

  // Derived
  const noLabel    = NO_LABELS[Math.min(noCount, NO_LABELS.length - 1)];
  const noHeading  = NO_HEADINGS[Math.min(noCount, NO_HEADINGS.length - 1)];

  // ── On mount: validate code + check auth ──────────────────
  useEffect(() => {
    if (!code) {
      setPhase('no_code');
      return;
    }

    const supabase = createClient();

    Promise.all([
      fetch(`/api/invites/${code}`)
        .then(r => r.json())
        .catch(() => ({ valid: false, error: 'not_found' })),
      supabase.auth.getUser(),
    ]).then(([info, { data: { user } }]) => {
      setIsLoggedIn(!!user);

      // Guard against null/unexpected API response shape
      if (!info || typeof info !== 'object') {
        setErrorType('not_found');
        setPhase('error');
        return;
      }

      if (!info.valid) {
        setErrorType(info.error || 'not_found');
        setPhase('error');
        return;
      }

      setInvite(info as InviteInfo);
      setPhase('invitation');
    }).catch(() => {
      setErrorType('not_found');
      setPhase('error');
    });
  }, [code]);

  // ── Accept invite via API ─────────────────────────────────
  const handleAccept = useCallback(async () => {
    if (!code) return;
    setPhase('accepting');

    const res = await fetch(`/api/invites/${code}/accept`, { method: 'POST' });
    const data = await res.json();

    if (data.success) {
      setPhase('success');
      setTimeout(() => router.push('/home'), 3500);
      return;
    }

    if (data.error === 'already_member') {
      setPhase('already_member');
      return;
    }

    setErrorType(data.error || 'unknown');
    setPhase('error');
  }, [code, router]);

  // ── YES clicked ───────────────────────────────────────────
  function handleYes() {
    setPhase('celebrating');
    setTimeout(() => {
      if (isLoggedIn) {
        handleAccept();
      } else {
        setPhase('auth_choice');
      }
    }, 1600);
  }

  // ── NO clicked ────────────────────────────────────────────
  function handleNo() {
    setNoCount(c => c + 1);
  }

  // ── Signup ────────────────────────────────────────────────
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
          invite_code: code,   // prevents auto-world creation in trigger
        },
      },
    });

    setFormLoading(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setPhase('signup_pending');
  }

  // ── Login ─────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setFormLoading(false);

    if (error) {
      setFormError('Wrong email or password. Try again? 🎀');
      return;
    }

    setIsLoggedIn(true);
    handleAccept();
  }

  // ── Render helpers ────────────────────────────────────────

  const Decorations = () => (
    <>
      <div className="fixed top-8 left-8 text-4xl opacity-20 select-none pointer-events-none">🎀</div>
      <div className="fixed top-16 right-12 text-2xl opacity-15 select-none pointer-events-none">✨</div>
      <div className="fixed bottom-20 left-12 text-3xl opacity-15 select-none pointer-events-none">🌸</div>
      <div className="fixed bottom-8 right-8 text-4xl opacity-20 select-none pointer-events-none">♡</div>
    </>
  );

  // ══════════════════════════════════════════════════════════
  // LOADING
  // ══════════════════════════════════════════════════════════
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Decorations />
        <div className="text-center invite-fade-up">
          <div className="text-5xl mb-4 invite-float inline-block">🐱</div>
          <p className="text-[#8c7b7b] font-medium">Getting the cat ready...</p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // NO CODE
  // ══════════════════════════════════════════════════════════
  if (phase === 'no_code') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Decorations />
        <div className="w-full max-w-sm text-center invite-fade-up">
          <div className="text-6xl mb-4">🎀</div>
          <h1 className="font-display text-3xl text-[#3d2b2b] mb-2">Hmm...</h1>
          <p className="text-[#8c7b7b] mb-1">This invitation seems to be missing.</p>
          <p className="text-[#8c7b7b] text-sm">Ask your person for a fresh invite link.</p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // ERROR STATES
  // ══════════════════════════════════════════════════════════
  if (phase === 'error') {
    const errCopy: Record<string, { emoji: string; title: string; body: string }> = {
      expired: {
        emoji: '😭',
        title: 'This invite has gone on vacation.',
        body:  'It expired before you got here. Ask your person for a new one ♡',
      },
      revoked: {
        emoji: '🎀',
        title: 'This invitation has been revoked.',
        body:  'Ask your person to send a new invite.',
      },
      already_accepted: {
        emoji: '👀',
        title: 'Someone already claimed this invitation.',
        body:  'Each invite can only be used once.',
      },
      world_full: {
        emoji: '😂',
        title: "This little world is already full.",
        body:  "It's reserved for two people 🎀 — both seats are taken.",
      },
      not_found: {
        emoji: '🤔',
        title: 'Uh oh... this invite is sus.',
        body:  'We couldn\'t find it. Check the link and try again.',
      },
    };

    const { emoji, title, body } = errCopy[errorType] || {
      emoji: '😕',
      title: 'Something went wrong.',
      body:  'Try refreshing, or ask for a new invite link.',
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Decorations />
        <div className="w-full max-w-sm text-center invite-fade-up">
          <div className="text-6xl mb-4">{emoji}</div>
          <h1 className="font-display text-2xl text-[#3d2b2b] mb-2">{title}</h1>
          <p className="text-[#8c7b7b] text-sm">{body}</p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // ACCEPTING
  // ══════════════════════════════════════════════════════════
  if (phase === 'accepting') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Decorations />
        <div className="text-center invite-fade-up">
          <div className="text-5xl mb-4 invite-float inline-block">🎀</div>
          <p className="text-[#8c7b7b] font-medium">Adding you to the world...</p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // ALREADY MEMBER
  // ══════════════════════════════════════════════════════════
  if (phase === 'already_member') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Decorations />
        <div className="w-full max-w-sm text-center invite-pop-in">
          <div className="text-6xl mb-4">😂</div>
          <h1 className="font-display text-3xl text-[#3d2b2b] mb-2">Wait...</h1>
          <p className="text-[#8c7b7b] mb-1">You&apos;re already part of this little world!</p>
          <p className="text-[#8c7b7b] text-sm mb-6">🎀</p>
          <Button
            onClick={() => router.push('/home')}
            className="bg-[#d94f6c] hover:bg-[#c0392b] text-white rounded-xl px-8 py-3 font-semibold"
          >
            Go to Our World ♡
          </Button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // SUCCESS
  // ══════════════════════════════════════════════════════════
  if (phase === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <Decorations />
        {/* Floating celebration hearts */}
        {HEARTS.map((h, i) => (
          <span
            key={i}
            className="fixed bottom-0 pointer-events-none select-none"
            style={{
              left: h.left,
              fontSize: h.size,
              animation: `heart-rise 2.5s ease-out ${h.delay} both`,
            }}
          >
            ♡
          </span>
        ))}

        <div className="text-center celebration-burst">
          <div className="text-6xl mb-2">🎀</div>
          <h1 className="font-display text-4xl text-[#d94f6c] mb-1">IT&apos;S OFFICIAL</h1>
          <div className="text-3xl mb-4">🎀</div>
          <p className="font-display text-2xl text-[#3d2b2b] mb-1">
            Welcome to
          </p>
          <p className="font-display text-3xl text-[#d94f6c] mb-4">
            {invite?.world_name || 'Our Little World'}
          </p>
          <p className="text-[#8c7b7b] text-sm mb-6">
            Now let&apos;s fill it with a ridiculous amount of memories.
          </p>
          <Button
            onClick={() => router.push('/home')}
            className="bg-[#d94f6c] hover:bg-[#c0392b] text-white rounded-2xl px-8 py-4 font-semibold text-base shadow-lg"
          >
            Enter Our World ♡
          </Button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // CELEBRATING (after YES, before auth/accept)
  // ══════════════════════════════════════════════════════════
  if (phase === 'celebrating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <Decorations />
        {HEARTS.map((h, i) => (
          <span
            key={i}
            className="fixed bottom-0 pointer-events-none select-none"
            style={{
              left: h.left,
              fontSize: h.size,
              animation: `heart-rise 2s ease-out ${h.delay} both`,
            }}
          >
            ♡
          </span>
        ))}

        <div className="text-center celebration-burst">
          <div className="text-6xl mb-3">😭</div>
          <h1 className="font-display text-4xl text-[#d94f6c] mb-2">SHE SAID YES</h1>
          <div className="text-3xl mb-3">🎀</div>
          <p className="text-[#8c7b7b]">Okay okay...</p>
          <p className="text-[#8c7b7b]">{isLoggedIn ? 'Adding you to the world...' : "Let's make your account."}</p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // SIGNUP PENDING (check email)
  // ══════════════════════════════════════════════════════════
  if (phase === 'signup_pending') {
    const inviteUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/join?code=${code}`
      : `/join?code=${code}`;

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Decorations />
        <div className="w-full max-w-sm text-center invite-fade-up">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="font-display text-3xl text-[#3d2b2b] mb-2">Almost there!</h1>
          <p className="text-[#8c7b7b] mb-4">
            Check your email to confirm your account, then come back here to finish joining.
          </p>
          <div className="bg-[#fde8e8] border border-[#f4b8c1] rounded-2xl p-3 mb-4">
            <p className="text-xs text-[#8c7b7b] mb-1">Bookmark this link 🎀</p>
            <p className="text-[#d94f6c] text-xs font-mono break-all">{inviteUrl}</p>
          </div>
          <p className="text-[#8c7b7b] text-xs">
            Already confirmed?{' '}
            <button
              onClick={() => { setPhase('login'); setEmail(''); setPassword(''); setFormError(''); }}
              className="text-[#d94f6c] font-semibold hover:underline"
            >
              Log in here
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // AUTH CHOICE
  // ══════════════════════════════════════════════════════════
  if (phase === 'auth_choice') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Decorations />
        <div className="w-full max-w-sm invite-fade-up">
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">🎀</div>
            <h1 className="font-display text-3xl text-[#3d2b2b] mb-1">Welcome to Our Little World</h1>
            <p className="text-[#8c7b7b] text-sm">Create your account to join.</p>
          </div>

          <div className="bg-white rounded-3xl border border-[#f0ddd8] p-6 shadow-sm space-y-3">
            <Button
              onClick={() => { setPhase('signup'); setFormError(''); }}
              className="w-full bg-[#d94f6c] hover:bg-[#c0392b] text-white rounded-xl py-5 font-semibold"
            >
              Create account ♡
            </Button>
            <Button
              onClick={() => { setPhase('login'); setFormError(''); }}
              variant="outline"
              className="w-full rounded-xl py-5 font-semibold border-[#f0ddd8] text-[#3d2b2b] hover:border-[#d94f6c] hover:text-[#d94f6c]"
            >
              Already have an account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // SIGNUP FORM
  // ══════════════════════════════════════════════════════════
  if (phase === 'signup') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Decorations />
        <div className="w-full max-w-sm invite-fade-up">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#fde8e8] mb-3 shadow-sm">
              <Heart className="w-6 h-6 text-[#d94f6c] fill-[#d94f6c]" />
            </div>
            <h1 className="font-display text-3xl text-[#3d2b2b] mb-1">Join Our Little World</h1>
            <p className="text-[#8c7b7b] text-sm">Create your account to join {invite?.inviter_name}&apos;s world.</p>
          </div>

          <div className="bg-white rounded-3xl border border-[#f0ddd8] p-6 shadow-sm">
            {formError && (
              <div className="mb-4 p-3 bg-[#fde8e8] border border-[#f4b8c1] rounded-xl text-[#c0392b] text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Your name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7b7b]" />
                  <Input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="What should we call you?"
                    required
                    className="pl-10 rounded-xl border-[#f0ddd8] focus:border-[#d94f6c] bg-[#faf6f1]"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7b7b]" />
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="pl-10 rounded-xl border-[#f0ddd8] focus:border-[#d94f6c] bg-[#faf6f1]"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7b7b]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="pl-10 pr-10 rounded-xl border-[#f0ddd8] focus:border-[#d94f6c] bg-[#faf6f1]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c7b7b] hover:text-[#d94f6c]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={formLoading}
                className="w-full bg-[#d94f6c] hover:bg-[#c0392b] text-white rounded-xl py-5 font-semibold"
              >
                {formLoading
                  ? <span className="flex items-center gap-2"><span className="animate-spin">🎀</span> Creating...</span>
                  : 'Join Our World ♡'
                }
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => { setPhase('auth_choice'); setFormError(''); }}
                className="text-[#8c7b7b] text-sm hover:text-[#d94f6c]"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // LOGIN FORM
  // ══════════════════════════════════════════════════════════
  if (phase === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Decorations />
        <div className="w-full max-w-sm invite-fade-up">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#fde8e8] mb-3 shadow-sm">
              <Heart className="w-6 h-6 text-[#d94f6c] fill-[#d94f6c]" />
            </div>
            <h1 className="font-display text-3xl text-[#3d2b2b] mb-1">Welcome back</h1>
            <p className="text-[#8c7b7b] text-sm">Log in to join {invite?.inviter_name}&apos;s world.</p>
          </div>

          <div className="bg-white rounded-3xl border border-[#f0ddd8] p-6 shadow-sm">
            {formError && (
              <div className="mb-4 p-3 bg-[#fde8e8] border border-[#f4b8c1] rounded-xl text-[#c0392b] text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7b7b]" />
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="pl-10 rounded-xl border-[#f0ddd8] focus:border-[#d94f6c] bg-[#faf6f1]"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7b7b]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pl-10 pr-10 rounded-xl border-[#f0ddd8] focus:border-[#d94f6c] bg-[#faf6f1]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c7b7b] hover:text-[#d94f6c]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={formLoading}
                className="w-full bg-[#d94f6c] hover:bg-[#c0392b] text-white rounded-xl py-5 font-semibold"
              >
                {formLoading
                  ? <span className="flex items-center gap-2"><span className="animate-spin">🎀</span> Logging in...</span>
                  : 'Come in ♡'
                }
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => { setPhase('auth_choice'); setFormError(''); }}
                className="text-[#8c7b7b] text-sm hover:text-[#d94f6c]"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // MAIN INVITATION PAGE
  // ══════════════════════════════════════════════════════════
  const currentHeading = noCount === 0
    ? null
    : noHeading;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <Decorations />

      <div className="w-full max-w-xs">
        {/* Letter header */}
        <div className="text-center mb-4 invite-fade-up" style={{ animationDelay: '0.05s' }}>
          <p className="text-[#8c7b7b] text-xs tracking-widest uppercase font-semibold mb-1">
            💌 you&apos;ve got mail
          </p>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-[2rem] border-2 border-[#f4b8c1] shadow-[0_12px_40px_rgba(217,79,108,0.12)] overflow-hidden">
          {/* Washi tape top */}
          <div className="h-3 bg-gradient-to-r from-[#fde8e8] via-[#f4b8c1] to-[#fde8e8] opacity-80" />

          <div className="p-6">
            {/* Top badge */}
            <div
              className="text-center mb-5 invite-fade-up"
              style={{ animationDelay: '0.1s' }}
            >
              <span className="inline-block bg-[#fde8e8] text-[#d94f6c] text-sm font-bold px-4 py-1.5 rounded-full border border-[#f4b8c1] tracking-wide">
                🎀 HEY YOU 🎀
              </span>
            </div>

            {/* Cat section */}
            <div
              className="flex flex-col items-center mb-5 invite-fade-up"
              style={{ animationDelay: '0.15s' }}
            >
              {/* CSS cat */}
              <div className="relative invite-float">
                {/* Cat ears */}
                <div className="flex justify-between px-3 mb-[-4px]">
                  <div
                    className="w-5 h-5 bg-[#fde8e8] border-2 border-[#f4b8c1]"
                    style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
                  />
                  <div
                    className="w-5 h-5 bg-[#fde8e8] border-2 border-[#f4b8c1]"
                    style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
                  />
                </div>
                {/* Cat head */}
                <div className="w-20 h-20 rounded-full bg-[#fde8e8] border-2 border-[#f4b8c1] flex flex-col items-center justify-center shadow-sm">
                  {/* Eyes */}
                  <div className="flex gap-3 mb-1" style={{ animation: 'cat-blink 4s ease-in-out infinite' }}>
                    <div className="w-3 h-3 rounded-full bg-[#3d2b2b]" />
                    <div className="w-3 h-3 rounded-full bg-[#3d2b2b]" />
                  </div>
                  {/* Nose + mouth */}
                  <div className="text-[#d94f6c] text-xs leading-none font-bold">ᴗ</div>
                </div>
              </div>

              {/* Hearts around cat */}
              <div className="flex gap-2 mt-2 text-[#f4b8c1] text-sm select-none">
                <span>♡</span>
                <span className="text-[#d94f6c]">♡</span>
                <span>♡</span>
              </div>
            </div>

            {/* Main message */}
            <div
              className="text-center mb-2 invite-fade-up"
              style={{ animationDelay: '0.2s' }}
            >
              {currentHeading ? (
                <h1 key={noCount} className="font-display text-2xl text-[#d94f6c] mb-1 invitation-pop-in">
                  {currentHeading}
                </h1>
              ) : (
                <>
                  <p className="text-[#8c7b7b] text-sm mb-1">
                    <span className="font-semibold text-[#3d2b2b]">{invite?.inviter_name || 'Someone'}</span> wants you to join
                  </p>
                  <h1 className="font-display text-2xl text-[#3d2b2b] mb-1">
                    their little world
                  </h1>
                </>
              )}
            </div>

            {/* Invite message */}
            {invite?.message && noCount === 0 && (
              <div
                className="text-center mb-4 invite-fade-up"
                style={{ animationDelay: '0.25s' }}
              >
                <p className="text-[#8c7b7b] text-sm italic">
                  &ldquo;{invite.message}&rdquo;
                </p>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-2 my-4 opacity-40">
              <div className="flex-1 h-px bg-[#f4b8c1]" />
              <span className="text-[#d94f6c] text-xs">🎀</span>
              <div className="flex-1 h-px bg-[#f4b8c1]" />
            </div>

            {/* Will you join? */}
            <p
              className="text-center text-[#3d2b2b] font-semibold text-sm mb-5 invite-fade-up"
              style={{ animationDelay: '0.3s' }}
            >
              Will you join?
            </p>

            {/* YES button */}
            <div
              className="invite-fade-up"
              style={{ animationDelay: '0.35s' }}
            >
              <button
                onClick={handleYes}
                className="w-full bg-[#d94f6c] hover:bg-[#c0392b] active:scale-95 text-white rounded-2xl py-4 font-bold text-base shadow-[0_4px_16px_rgba(217,79,108,0.3)] transition-all duration-150 flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 fill-white" />
                YES ♡
              </button>
            </div>

            {/* NO button */}
            <div
              className="mt-3 invite-fade-up"
              style={{ animationDelay: '0.4s' }}
            >
              <button
                onClick={handleNo}
                className="w-full border border-[#f0ddd8] text-[#8c7b7b] hover:border-[#f4b8c1] hover:text-[#d94f6c] rounded-2xl py-3 text-sm font-medium transition-all duration-150"
              >
                {noLabel}
              </button>
            </div>

            {/* After many NOs */}
            {noCount >= 5 && (
              <p className="text-center text-[#8c7b7b] text-xs mt-3 opacity-70">
                (You can still click YES. The invitation doesn&apos;t expire from NOs.)
              </p>
            )}
          </div>

          {/* Bottom strip */}
          <div className="h-2 bg-gradient-to-r from-[#fde8e8] via-[#f4b8c1] to-[#fde8e8] opacity-60" />
        </div>

        {/* World name + timestamp */}
        {invite && (
          <p
            className="text-center text-[#8c7b7b] text-xs mt-4 invite-fade-up"
            style={{ animationDelay: '0.45s' }}
          >
            {invite.world_name} · expires {new Date(invite.expires_at).toLocaleDateString()}
          </p>
        )}

        {/* Already have account */}
        {!isLoggedIn && (
          <p
            className="text-center text-xs text-[#8c7b7b] mt-3 invite-fade-up"
            style={{ animationDelay: '0.5s' }}
          >
            Already have an account?{' '}
            <button
              onClick={() => setPhase('login')}
              className="text-[#d94f6c] font-semibold hover:underline"
            >
              Log in to accept
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
