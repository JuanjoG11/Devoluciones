// Quick Fix Script: Activate User in Database
// Run this with: node fix_user_activation.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://olrfvydwyndqquxmtuho.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9scmZ2eWR3eW5kcXF1eG10dWhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDE3NDUsImV4cCI6MjA4MzQ3Nzc0NX0.ui2jMr8-rG-bsFgeSea6ZpYks6utVClVGcQLq9Ptxn8';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function activateUser(username) {
    console.log(`\n🔧 Activando usuario: ${username}...`);

    try {
        // 1. Check if user exists
        const { data: existing, error: findError } = await sb
            .from('users')
            .select('id, username, name, is_active')
            .eq('username', username)
            .maybeSingle();

        if (findError) {
            console.error('❌ Error buscando usuario:', findError);
            return false;
        }

        if (existing) {
            // User exists - update status
            console.log(`📋 Usuario encontrado: ${existing.name}`);
            console.log(`   Estado actual: ${existing.is_active ? 'ACTIVO' : 'INACTIVO'}`);

            if (existing.is_active) {
                console.log('✅ El usuario ya está activo!');
                return true;
            }

            const { error: updateError } = await sb
                .from('users')
                .update({ is_active: true })
                .eq('id', existing.id);

            if (updateError) {
                console.error('❌ Error actualizando usuario:', updateError);
                return false;
            }

            console.log('✅ Usuario ACTIVADO exitosamente!');
            return true;

        } else {
            // User doesn't exist - create it
            console.log('📝 Usuario no existe en BD, creando...');

            const { error: insertError } = await sb
                .from('users')
                .insert({
                    username: username,
                    name: 'JUAN ALEJANDRO FRANCO MARIN',
                    role: 'auxiliar',
                    organization: 'TYM',
                    is_active: true,
                    password: '123'
                });

            if (insertError) {
                console.error('❌ Error creando usuario:', insertError);
                return false;
            }

            console.log('✅ Usuario CREADO y ACTIVADO exitosamente!');
            return true;
        }

    } catch (error) {
        console.error('❌ Error general:', error);
        return false;
    }
}

// Execute
console.log('🚀 Iniciando script de activación...');
const result = await activateUser('1087559558');

if (result) {
    console.log('\n✅ PROCESO COMPLETADO');
    console.log('El usuario puede intentar ingresar ahora.');
} else {
    console.log('\n❌ PROCESO FALLÓ');
    console.log('Revisa los errores arriba.');
}
