import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Heart, Flame, Users, Shield, Home } from 'lucide-react';

interface CategoryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  subcategories?: string[];
}

function CategoryCard({ title, description, icon, onClick, subcategories }: CategoryCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="memorial-card p-6 rounded-2xl cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-memorial-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-memorial-accent/20 transition-colors">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-memorial-accent transition-colors">
            {title}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-3">
            {description}
          </p>
          {subcategories && subcategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {subcategories.map((sub, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs rounded-full bg-white/5 text-gray-300 border border-white/10"
                >
                  {sub}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function MemorialSection() {
  const { t } = useTranslation('memorial');
  const navigate = useNavigate();

  const handleCategoryClick = (category: string) => {
    // For now, navigate to dashboard with category filter
    // In full implementation, this would go to a dedicated memorial page
    navigate(`/dashboard?memorial=${category}`);
  };

  return (
    <section className="memorial-theme py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Flame className="w-8 h-8 text-memorial-accent" />
          <h2 className="text-3xl font-display font-bold text-memorial-accent">
            {t('title')}
          </h2>
          <Flame className="w-8 h-8 text-memorial-accent" />
        </div>
        <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed">
          {t('description')}
        </p>
      </motion.div>

      {/* Category Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Holocaust Memories */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CategoryCard
            title={t('categories.holocaust.title')}
            description={t('categories.holocaust.description')}
            icon={<Heart className="w-7 h-7 text-memorial-accent" />}
            onClick={() => handleCategoryClick('holocaust')}
          />
        </motion.div>

        {/* October 7th Stories */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CategoryCard
            title={t('categories.october7.title')}
            description={t('categories.october7.description')}
            icon={<Shield className="w-7 h-7 text-memorial-accent" />}
            onClick={() => handleCategoryClick('october7')}
            subcategories={[
              t('subcategories.hostages.title'),
              t('subcategories.hostage_families.title'),
              t('subcategories.evacuees.title'),
              t('subcategories.soldiers.title'),
              t('subcategories.bereaved.title'),
            ]}
          />
        </motion.div>
      </div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mt-10"
      >
        <p className="text-gray-400 text-sm mb-4">
          {t('create.subtitle')}
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/dashboard?createMemorial=true')}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-memorial-accent/20 to-memorial-accent/10 border border-memorial-accent/30 text-memorial-accent font-semibold hover:from-memorial-accent/30 hover:to-memorial-accent/20 transition-all"
        >
          {t('create.start_writing')}
        </motion.button>
      </motion.div>

      {/* Support Resources */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12 p-6 rounded-xl bg-white/5 border border-white/10 max-w-2xl mx-auto text-center"
      >
        <h4 className="text-white font-semibold mb-2">{t('support.title')}</h4>
        <p className="text-gray-400 text-sm">{t('support.description')}</p>
      </motion.div>
    </section>
  );
}
