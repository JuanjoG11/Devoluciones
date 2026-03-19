
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://olrfvydwyndqquxmtuho.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9scmZ2eWR3eW5kcXF1eG10dWhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDE3NDUsImV4cCI6MjA4MzQ3Nzc0NX0.ui2jMr8-rG-bsFgeSea6ZpYks6utVClVGcQLq9Ptxn8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createUser() {
    console.log('Inserting user Juanjo...');
    const { data, error } = await supabase.from('users').insert({
        username: '1089380738',
        name: 'JUANJO',
        role: 'auxiliar',
        organization: 'TYM',
        is_active: true,
        password: '123'
    });

    if (error) {
        console.error('Error inserting user:', error);
    } else {
        console.log('User inserted successfully:', data);
    }
}

createUser();
