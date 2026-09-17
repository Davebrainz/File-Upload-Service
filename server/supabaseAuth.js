import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseAuth = Boolean(supabaseUrl && supabaseAnonKey);

function getClient(accessToken) {
  if (!hasSupabaseAuth) {
    throw new Error('Supabase Auth is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY.');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(accessToken ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } } : {}),
  });
}

function formatUser(user) {
  return user
    ? {
        id: user.id,
        email: user.email || '',
        username: user.user_metadata?.username || '',
      }
    : null;
}

function authError(error) {
  const message = error?.message || 'Authentication failed.';
  if (/invalid login credentials/i.test(message)) {
    return 'The email or password is incorrect.';
  }
  if (/user already registered/i.test(message)) {
    return 'This email already has an account.';
  }
  return message;
}

export async function signUpWithSupabase({ email, password, username }) {
  try {
    const { data, error } = await getClient().auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { username: username?.trim() || '' } },
    });

    if (error) return { success: false, error: authError(error) };

    return {
      success: true,
      user: formatUser(data.user),
      session: data.session,
      requiresEmailConfirmation: Boolean(data.user && !data.session),
    };
  } catch (error) {
    return { success: false, error: authError(error) };
  }
}

export async function signInWithSupabase({ email, password }) {
  try {
    const { data, error } = await getClient().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) return { success: false, error: authError(error) };
    return { success: true, user: formatUser(data.user), session: data.session };
  } catch (error) {
    return { success: false, error: authError(error) };
  }
}

export async function updateSupabaseUsername(accessToken, username) {
  try {
    const { data, error } = await getClient(accessToken).auth.updateUser({
      data: { username: username.trim() },
    });

    if (error) return { success: false, error: authError(error) };
    return { success: true, user: formatUser(data.user) };
  } catch (error) {
    return { success: false, error: authError(error) };
  }
}
