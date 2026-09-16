'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Heart, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 scrapbook-bg">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">🎀</div>
          <h1 className="font-display text-3xl text-[#3d2b2b] mb-2">You&apos;re in!</h1>
          <p className="text-[#8c7b7b] mb-2">Check your email to confirm your account.</p>
          <p className="text-[#8c7b7b] text-sm">
            Then{' '}
            <Link href="/login" className="text-[#d94f6c] font-medium hover:underline">
              sign in
            </Link>{' '}
            to start building your little world ♡
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 scrapbook-bg">
      <div className="fixed top-8 left-8 text-4xl opacity-20 select-none">🎀</div>
      <div className="fixed top-16 right-12 text-2xl opacity-15 select-none">✨</div>
      <div className="fixed bottom-20 left-12 text-3xl opacity-15 select-none">🌸</div>
      <div className="fixed bottom-8 right-8 text-4xl opacity-20 select-none">♡</div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#fde8e8] mb-4 shadow-sm">
            <Heart className="w-7 h-7 text-[#d94f6c] fill-[#d94f6c]" />
          </div>
          <h1 className="font-display text-3xl text-[#3d2b2b] mb-1">Our Little World</h1>
          <p className="text-[#8c7b7b] text-sm">create your private corner ✨</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 border border-[#f0ddd8]">
          <h2 className="text-[#3d2b2b] font-semibold text-lg mb-1">Create your world</h2>
          <p className="text-[#8c7b7b] text-sm mb-6">Let&apos;s set up your private space</p>

          {error && (
            <div className="mb-4 p-3 bg-[#fde8e8] border border-[#f4b8c1] rounded-xl text-[#c0392b] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">
                Your name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7b7b]" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                  required
                  className="pl-10 rounded-xl border-[#f0ddd8] focus:border-[#d94f6c] bg-[#faf6f1]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7b7b]" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="pl-10 rounded-xl border-[#f0ddd8] focus:border-[#d94f6c] bg-[#faf6f1]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-[#3d2b2b] font-medium text-sm mb-1.5 block">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7b7b]" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="pl-10 pr-10 rounded-xl border-[#f0ddd8] focus:border-[#d94f6c] bg-[#faf6f1]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c7b7b] hover:text-[#d94f6c]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#d94f6c] hover:bg-[#c0392b] text-white rounded-xl py-5 font-semibold"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">🎀</span>
                  Creating your world...
                </span>
              ) : (
                "Let's begin ♡"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-[#8c7b7b] text-sm">
              Already have a world?{' '}
              <Link href="/login" className="text-[#d94f6c] font-medium hover:underline">
                Come back in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
