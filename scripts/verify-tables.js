#!/usr/bin/env node

/**
 * Quick verification script to check if tables exist in Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment
function loadEnv() {
    const envFile = path.join(__dirname, '..', '.env.staging');
    const envLocal = path.join(__dirname, '..', '.env.local');
    
    let envPath = envFile;
    if (!fs.existsSync(envFile) && fs.existsSync(envLocal)) {
        envPath = envLocal;
    }
    
    if (!fs.existsSync(envPath)) {
        console.error('❌ No environment file found');
        process.exit(1);
    }
    
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars = {};
    
    envContent.split('\n').forEach((line) => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                envVars[key.trim()] = value;
            }
        }
    });
    
    return envVars;
}

async function main() {
    console.log('\n🔍 Verifying Supabase Tables...\n');
    
    const env = loadEnv();
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
        console.error('❌ Missing Supabase credentials');
        process.exit(1);
    }
    
    console.log(`📋 Project: ${supabaseUrl}\n`);
    
    const supabase = createClient(supabaseUrl, serviceKey);
    
    const tables = ['users', 'trips', 'requests', 'matches', 'messages', 'disputes', 'payments'];
    
    for (const table of tables) {
        try {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                    console.log(`❌ ${table}: TABLE DOES NOT EXIST`);
                } else {
                    console.log(`⚠️  ${table}: Error - ${error.message}`);
                }
            } else {
                console.log(`✅ ${table}: EXISTS (${count || 0} rows)`);
            }
        } catch (e) {
            console.log(`❌ ${table}: Error - ${e.message}`);
        }
    }
    
    console.log('\n');
}

main().catch(console.error);

