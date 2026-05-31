import dotenv from 'dotenv'; dotenv.config();
import { supabaseAdmin } from '../config/supabase';
(async () => {
  const { data } = await supabaseAdmin
    .from('books')
    .select('title, cover_design')
    .eq('language', 'he')
    .like('title', '%מוורשה%')
    .limit(1).single();
  const b = data as any;
  console.log('Title:', b?.title);
  console.log('Front imageUrl:', b?.cover_design?.front?.imageUrl);
  console.log('Back imageUrl :', b?.cover_design?.back?.imageUrl);
  console.log('Back type     :', b?.cover_design?.back?.type);
  console.log('Back synopsis :', b?.cover_design?.back?.synopsis?.substring(0, 60) + '...');
  process.exit(0);
})();
