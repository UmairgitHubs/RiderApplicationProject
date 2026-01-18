import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, User, Mail, Phone, MapPin, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { agentsApi } from '@/lib/api/agents';
import { useQueryClient } from '@tanstack/react-query';

interface AddAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddAgentModal({ isOpen, onClose }: AddAgentModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    territory: '',
    referralCode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        await agentsApi.create(formData);
        toast.success('Agent created successfully');
        queryClient.invalidateQueries({ queryKey: ['agents'] });
        queryClient.invalidateQueries({ queryKey: ['agent-stats'] });
        onClose();
        setFormData({ fullName: '', email: '', phone: '', password: '', territory: '', referralCode: '' });
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to create agent');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Add New Agent</h2>
                <button 
                    onClick={onClose} 
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-500 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input 
                                required
                                type="text" 
                                placeholder="John Doe"
                                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                                value={formData.fullName}
                                onChange={e => setFormData({...formData, fullName: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Referral Code</label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input 
                                required
                                type="text" 
                                placeholder="JOHND2024"
                                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none uppercase"
                                value={formData.referralCode}
                                onChange={e => setFormData({...formData, referralCode: e.target.value.toUpperCase()})}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input 
                            required
                            type="email" 
                            placeholder="john@example.com"
                            className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Phone</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input 
                                required
                                type="tel" 
                                placeholder="+1 234..."
                                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Territory</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input 
                                required
                                type="text" 
                                placeholder="New York Metro"
                                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                                value={formData.territory}
                                onChange={e => setFormData({...formData, territory: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Password</label>
                    <input 
                        required
                        type="password" 
                        placeholder="••••••••"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Create Agent
                    </button>
                </div>
            </form>
      </div>
    </div>
  );
}
