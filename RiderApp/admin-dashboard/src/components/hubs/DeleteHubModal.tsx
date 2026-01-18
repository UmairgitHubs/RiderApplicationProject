import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hubsApi } from '@/lib/api/hubs';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DeleteHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  hubId: string;
  hubName: string;
}

export default function DeleteHubModal({ isOpen, onClose, hubId, hubName }: DeleteHubModalProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: () => hubsApi.delete(hubId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubs'] });
      toast.success('Hub deleted successfully');
      onClose();
      router.push('/hubs');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete hub');
    }
  });

  const handleDelete = () => {
    mutate();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95%] max-w-md bg-white rounded-2xl shadow-xl z-50 outline-none animate-in zoom-in-95 duration-200">
          
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Delete Hub</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-4 mb-4 bg-red-50 p-4 rounded-xl text-red-700">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <p className="text-sm font-medium">This action cannot be undone.</p>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-bold text-gray-900">{hubName}</span>? 
              All associated data might be affected.
            </p>

            <div className="flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white border border-gray-200 rounded-lg transition-colors"
                disabled={isPending}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Hub
              </button>
            </div>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
