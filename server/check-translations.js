const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  // Check books with translations and audio
  const { data: books, error } = await supabase
    .from('books')
    .select('id, title, language, translations, chapters')
    .eq('title', 'מסע אל הלא נודע')
    .limit(1);

  if (error) {
    console.log('Error:', error);
    return;
  }

  books.forEach(b => {
    console.log('Title:', b.title);
    console.log('Language:', b.language);
    console.log('Has translations:', !!b.translations);
    if (b.translations?.english) {
      console.log('English title:', b.translations.english.title);
    }

    console.log('\nChapters audio:');
    b.chapters?.forEach((ch, i) => {
      console.log(`\nChapter ${i + 1}: ${ch.title}`);
      if (ch.audio) {
        console.log('  Audio keys:', Object.keys(ch.audio));
        if (ch.audio.maleVoiceEn) {
          console.log('  maleVoiceEn URL:', ch.audio.maleVoiceEn.url?.substring(0, 80) + '...');
          console.log('  maleVoiceEn language:', ch.audio.maleVoiceEn.language);
        }
        if (ch.audio.maleVoiceHe) {
          console.log('  maleVoiceHe URL:', ch.audio.maleVoiceHe.url?.substring(0, 80) + '...');
          console.log('  maleVoiceHe language:', ch.audio.maleVoiceHe.language);
        }
      } else {
        console.log('  No audio');
      }
    });
  });
}

check().catch(e => console.error(e));
