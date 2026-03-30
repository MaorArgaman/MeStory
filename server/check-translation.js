const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  // Get ALL books with translations
  const { data: books, error } = await supabase
    .from('books')
    .select('id, title, translations')
    .not('translations', 'is', null);

  if (error) {
    console.log('Error:', error);
    return;
  }

  console.log('Books with translations:', books.length);

  for (const book of books) {
    console.log('\n' + '='.repeat(50));
    console.log('ID:', book.id);
    console.log('Title:', book.title);

    if (book.translations?.english) {
      const ch = book.translations.english.chapters[0];
      console.log('English title:', book.translations.english.title);
      console.log('First chapter title:', ch?.title);
      console.log('Content language check:', ch?.content?.substring(0, 100));
    }
  }
}

check().catch(e => console.error(e));
