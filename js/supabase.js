
// Supabase Configuration
const SUPABASE_URL = 'https://olrfvydwyndqquxmtuho.supabase.co';
// WARNING: The key provided was 'sb_secret_...', which looks like a different type of token.
// Standard anon keys start with 'ey...'. trying this, but it may fail.
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9scmZ2eWR3eW5kcXF1eG10dWhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDE3NDUsImV4cCI6MjA4MzQ3Nzc0NX0.ui2jMr8-rG-bsFgeSea6ZpYks6utVClVGcQLq9Ptxn8';

let supabaseClient = null;

if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase client initialized');
} else {
    console.error('Supabase library not loaded!');
}

export const sb = supabaseClient;

// Helper to check connection
export const checkSupabaseConnection = async () => {
    if (!sb) return false;
    try {
        const { data, error } = await sb.from('users').select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log('Supabase Connected Successfully');
        return true;
    } catch (err) {
        console.error('Supabase Connection Failed:', err.message);
        return false;
    }
};
