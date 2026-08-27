// Configuração de conexão com o Supabase
// Essas chaves são seguras pra ficar no código do site (é a chave "publicável",
// feita pra isso) — as regras de segurança de verdade estão no banco (RLS).
const SUPABASE_URL = 'https://sxbbjtpgqvzguvnejxgw.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_vOamsPE1t3SQhUZ4sYJHFQ_uOJhOB2B';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
