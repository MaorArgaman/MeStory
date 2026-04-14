import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Users,
  Ticket,
  Copy,
  Check,
  X,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

interface Organization {
  id: string;
  name: string;
  nameEn?: string;
  type: string;
  description?: string;
  contactEmail: string;
  contactPhone?: string;
  status: string;
  subscription: {
    plan: string;
    maxBooks: number;
    maxMembers: number;
  };
  coupons: Coupon[];
  statistics: {
    totalMembers: number;
    totalBooks: number;
  };
}

export default function OrganizationsManager() {
  const { i18n } = useTranslation();
  const isHebrew = i18n.language === 'he';

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await api.get('/organizations');
      if (response.data.success) {
        setOrganizations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error(isHebrew ? 'שגיאה בטעינת ארגונים' : 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success(isHebrew ? 'הקוד הועתק!' : 'Code copied!');
  };

  const handleDeleteOrg = async (id: string) => {
    if (!confirm(isHebrew ? 'האם למחוק ארגון זה?' : 'Delete this organization?')) {
      return;
    }

    try {
      await api.delete(`/organizations/${id}`);
      toast.success(isHebrew ? 'הארגון נמחק' : 'Organization deleted');
      fetchOrganizations();
    } catch (error) {
      toast.error(isHebrew ? 'מחיקה נכשלה' : 'Delete failed');
    }
  };

  const handleCreateCoupon = async (orgId: string) => {
    try {
      const response = await api.post(`/organizations/${orgId}/coupons`, {
        discountPercent: 100,
        maxUses: -1,
      });

      if (response.data.success) {
        toast.success(isHebrew ? 'קופון נוצר!' : 'Coupon created!');
        handleCopyCode(response.data.data.code);
        fetchOrganizations();
      }
    } catch (error) {
      toast.error(isHebrew ? 'יצירת קופון נכשלה' : 'Failed to create coupon');
    }
  };

  const handleToggleCoupon = async (orgId: string, couponId: string, isActive: boolean) => {
    try {
      await api.put(`/organizations/${orgId}/coupons/${couponId}`, {
        isActive: !isActive,
      });
      fetchOrganizations();
    } catch (error) {
      toast.error(isHebrew ? 'עדכון נכשל' : 'Update failed');
    }
  };

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { he: string; en: string }> = {
      military_unit: { he: 'יחידה צבאית', en: 'Military Unit' },
      association: { he: 'עמותה', en: 'Association' },
      community: { he: 'קהילה', en: 'Community' },
      school: { he: 'בית ספר', en: 'School' },
      other: { he: 'אחר', en: 'Other' },
    };
    return labels[type]?.[isHebrew ? 'he' : 'en'] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-memorial-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isHebrew ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-memorial-gold/20 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-memorial-gold" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {isHebrew ? 'ניהול ארגונים' : 'Organizations'}
            </h2>
            <p className="text-sm text-gray-400">
              {organizations.length} {isHebrew ? 'ארגונים' : 'organizations'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-memorial-gold text-slate-900 font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          {isHebrew ? 'ארגון חדש' : 'New Organization'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isHebrew ? 'חיפוש ארגון...' : 'Search organizations...'}
          className="w-full pr-10 pl-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-memorial-gold/50"
        />
      </div>

      {/* Organizations List */}
      <div className="space-y-4">
        {filteredOrgs.map((org) => (
          <motion.div
            key={org.id}
            layout
            className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
          >
            {/* Organization Header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5"
              onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-memorial-gold/30 to-amber-600/30 flex items-center justify-center text-lg font-bold text-memorial-gold">
                  {org.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{org.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span>{getTypeLabel(org.type)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {org.statistics.totalMembers}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Ticket className="w-4 h-4" />
                      {org.coupons.length} {isHebrew ? 'קופונים' : 'coupons'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    org.status === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {org.status === 'active'
                    ? isHebrew
                      ? 'פעיל'
                      : 'Active'
                    : isHebrew
                    ? 'לא פעיל'
                    : 'Inactive'}
                </span>
                {expandedOrg === org.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {expandedOrg === org.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/10"
                >
                  <div className="p-4 space-y-4">
                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">{isHebrew ? 'אימייל:' : 'Email:'}</span>
                        <span className="text-white mr-2">{org.contactEmail}</span>
                      </div>
                      {org.contactPhone && (
                        <div>
                          <span className="text-gray-400">{isHebrew ? 'טלפון:' : 'Phone:'}</span>
                          <span className="text-white mr-2">{org.contactPhone}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400">{isHebrew ? 'מנוי:' : 'Plan:'}</span>
                        <span className="text-memorial-gold mr-2 capitalize">
                          {org.subscription.plan}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">
                          {isHebrew ? 'ספרים:' : 'Books:'}
                        </span>
                        <span className="text-white mr-2">
                          {org.statistics.totalBooks} /{' '}
                          {org.subscription.maxBooks === -1 ? '∞' : org.subscription.maxBooks}
                        </span>
                      </div>
                    </div>

                    {/* Coupons */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-400">
                          {isHebrew ? 'קופונים' : 'Coupons'}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateCoupon(org.id);
                          }}
                          className="flex items-center gap-1 text-xs text-memorial-gold hover:underline"
                        >
                          <Plus className="w-3 h-3" />
                          {isHebrew ? 'צור קופון' : 'Create Coupon'}
                        </button>
                      </div>

                      {org.coupons.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          {isHebrew ? 'אין קופונים' : 'No coupons'}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {org.coupons.map((coupon) => (
                            <div
                              key={coupon.id}
                              className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <code className="px-2 py-1 bg-memorial-gold/20 text-memorial-gold rounded font-mono text-sm">
                                  {coupon.code}
                                </code>
                                <span className="text-sm text-gray-400">
                                  {coupon.discountPercent}%{' '}
                                  {isHebrew ? 'הנחה' : 'off'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {coupon.usedCount}/{coupon.maxUses === -1 ? '∞' : coupon.maxUses}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyCode(coupon.code);
                                  }}
                                  className="p-1.5 hover:bg-white/10 rounded"
                                  title={isHebrew ? 'העתק' : 'Copy'}
                                >
                                  {copiedCode === coupon.code ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleCoupon(org.id, coupon.id, coupon.isActive);
                                  }}
                                  className={`p-1.5 rounded ${
                                    coupon.isActive
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-gray-500/20 text-gray-400'
                                  }`}
                                  title={coupon.isActive ? 'Deactivate' : 'Activate'}
                                >
                                  {coupon.isActive ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <X className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingOrg(org);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        {isHebrew ? 'ערוך' : 'Edit'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOrg(org.id);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        {isHebrew ? 'מחק' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {filteredOrgs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>
              {searchQuery
                ? isHebrew
                  ? 'לא נמצאו ארגונים'
                  : 'No organizations found'
                : isHebrew
                ? 'אין ארגונים עדיין'
                : 'No organizations yet'}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingOrg) && (
          <OrganizationModal
            organization={editingOrg}
            onClose={() => {
              setShowCreateModal(false);
              setEditingOrg(null);
            }}
            onSave={() => {
              setShowCreateModal(false);
              setEditingOrg(null);
              fetchOrganizations();
            }}
            isHebrew={isHebrew}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Organization Create/Edit Modal
function OrganizationModal({
  organization,
  onClose,
  onSave,
  isHebrew,
}: {
  organization: Organization | null;
  onClose: () => void;
  onSave: () => void;
  isHebrew: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    nameEn: organization?.nameEn || '',
    type: organization?.type || 'association',
    description: organization?.description || '',
    contactEmail: organization?.contactEmail || '',
    contactPhone: organization?.contactPhone || '',
    status: organization?.status || 'active',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.contactEmail) {
      toast.error(isHebrew ? 'נא למלא שם ואימייל' : 'Name and email required');
      return;
    }

    setSaving(true);

    try {
      if (organization) {
        await api.put(`/organizations/${organization.id}`, formData);
        toast.success(isHebrew ? 'הארגון עודכן' : 'Organization updated');
      } else {
        await api.post('/organizations', formData);
        toast.success(isHebrew ? 'הארגון נוצר' : 'Organization created');
      }
      onSave();
    } catch (error) {
      toast.error(isHebrew ? 'שגיאה בשמירה' : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const orgTypes = [
    { id: 'military_unit', he: 'יחידה צבאית', en: 'Military Unit' },
    { id: 'association', he: 'עמותה', en: 'Association' },
    { id: 'community', he: 'קהילה', en: 'Community' },
    { id: 'school', he: 'בית ספר', en: 'School' },
    { id: 'other', he: 'אחר', en: 'Other' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl border border-memorial-gold/20 overflow-hidden"
        dir={isHebrew ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-xl font-semibold text-white">
            {organization
              ? isHebrew
                ? 'עריכת ארגון'
                : 'Edit Organization'
              : isHebrew
              ? 'ארגון חדש'
              : 'New Organization'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {isHebrew ? 'שם (עברית)' : 'Name (Hebrew)'}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {isHebrew ? 'שם (אנגלית)' : 'Name (English)'}
              </label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {isHebrew ? 'סוג' : 'Type'}
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
            >
              {orgTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {isHebrew ? type.he : type.en}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {isHebrew ? 'תיאור' : 'Description'}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {isHebrew ? 'אימייל' : 'Email'}
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {isHebrew ? 'טלפון' : 'Phone'}
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {isHebrew ? 'סטטוס' : 'Status'}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
            >
              <option value="active">{isHebrew ? 'פעיל' : 'Active'}</option>
              <option value="inactive">{isHebrew ? 'לא פעיל' : 'Inactive'}</option>
              <option value="pending">{isHebrew ? 'ממתין' : 'Pending'}</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
            >
              {isHebrew ? 'ביטול' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-memorial-gold text-slate-900 font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {organization
                    ? isHebrew
                      ? 'עדכן'
                      : 'Update'
                    : isHebrew
                    ? 'צור'
                    : 'Create'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
