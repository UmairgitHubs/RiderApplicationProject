import React, { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, Building2, MapPin, Package, Box, User, Warehouse, Eye, EyeOff, Mail, Lock, Phone } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { hubsApi } from '@/lib/api/hubs';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Hub } from '@/types/hub';

const hubSchema = z.object({
  name: z.string().min(1, 'Hub name is required'),
  city: z.string().min(1, 'City is required'),
  managerId: z.string().nullable().optional(),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1').default(100),
  sizeSqft: z.coerce.number().min(1, 'Size must be at least 1').default(5000),
  createNewManager: z.boolean().default(false),
  managerName: z.string().optional(),
  managerEmail: z.string().optional(),
  managerPhone: z.string().optional(), // Optional by default
  managerPassword: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.createNewManager) {
        if (!data.managerName || data.managerName.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Manager Name is required",
                path: ["managerName"]
            });
        }
        if (!data.managerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.managerEmail)) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Valid Email is required",
                path: ["managerEmail"]
            });
        }
        if (!data.managerPhone || data.managerPhone.length < 10) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Valid Phone is required",
                path: ["managerPhone"]
            });
        }
        if (!data.managerPassword || data.managerPassword.length < 6) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Password must be at least 6 characters",
                path: ["managerPassword"]
            });
        }
    }
});

type HubFormData = z.infer<typeof hubSchema>;

interface EditHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  hub: Hub | undefined;
}

export default function EditHubModal({ isOpen, onClose, hub }: EditHubModalProps) {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = React.useState(false);

  // Fetch Potential Managers
  const { data: managersData, isLoading: isLoadingManagers } = useQuery({
    queryKey: ['potential-managers'],
    queryFn: () => hubsApi.getManagers()
  });

  const managers = managersData?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<HubFormData>({
    resolver: zodResolver(hubSchema),
    defaultValues: {
        name: '',
        city: 'Dubai',
        managerId: '',
        address: '',
        capacity: 100,
        sizeSqft: 5000,
        createNewManager: false,
        managerName: '',
        managerEmail: '',
        managerPhone: '',
        managerPassword: ''
    }
  });

  const createNewManager = watch('createNewManager');

  // Pre-fill form when hub changes or modal opens
  useEffect(() => {
    if (isOpen && hub) {
      setValue('name', hub.name);
      setValue('city', hub.city || 'Dubai'); 
      setValue('managerId', hub.manager?.id || ''); 
      setValue('address', hub.address);
      setValue('capacity', hub.capacity || 100);
      setValue('sizeSqft', hub.size_sqft || 5000); 
      setValue('createNewManager', false); 
      setValue('managerName', '');
      setValue('managerEmail', '');
      setValue('managerPhone', '');
      setValue('managerPassword', '');
    }
  }, [isOpen, hub, setValue]);

  // Create Mutation
  const { mutate, isPending } = useMutation({
    mutationFn: (data: HubFormData) => hubsApi.update(hub?.id || '', {
        ...data,
        capacity: Number(data.capacity),
        sizeSqft: Number(data.sizeSqft),
         // Send manager fields to allow updating existing manager or creating new
        managerName: data.managerName,
        managerEmail: data.managerEmail,
        managerPhone: data.managerPhone,
        managerPassword: data.createNewManager ? data.managerPassword : undefined,
        managerId: !data.createNewManager ? data.managerId : undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub', hub?.id] }); // Invalidate specific hub
      queryClient.invalidateQueries({ queryKey: ['hubs'] }); // Invalidate list
      toast.success('Hub updated successfully');
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update hub');
    }
  });

  const onSubmit = (data: HubFormData) => {
    if (hub?.id) {
        mutate(data);
    }
  };

  const handleClose = () => {
      reset();
      onClose();
  }

   const managerId = watch('managerId');

   // Update fields when selected manager changes
   useEffect(() => {
       if (!createNewManager && managerId && managers.length > 0) {
           const selectedManager = managers.find((m: any) => m.id === managerId);
           if (selectedManager) {
               setValue('managerName', selectedManager.full_name);
               setValue('managerEmail', selectedManager.email);
               setValue('managerPhone', selectedManager.phone || '');
           }
       }
   }, [managerId, createNewManager, managers, setValue]);

  if (!hub) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95%] max-w-2xl bg-white rounded-xl shadow-xl z-50 outline-none animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10 rounded-t-xl">
             <div className="flex items-center gap-3">
                 <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
                    <Building2 className="w-5 h-5" />
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-gray-900">Edit Hub</h2>
                    <p className="text-sm text-gray-500">Update hub details and configuration</p>
                 </div>
             </div>
             <button 
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Hub Details Section */}
            <div className="space-y-4">
               <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Warehouse className="w-4 h-4 text-primary" /> Hub Details
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Hub Name <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input 
                                {...register('name')}
                                type="text" 
                                placeholder="e.g. Central Hub Dubai"
                                className={`w-full pl-9 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                            />
                        </div>
                        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                         <label className="text-sm font-medium text-gray-700">City <span className="text-red-500">*</span></label>
                         <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input 
                                {...register('city')}
                                type="text" 
                                placeholder="e.g. Dubai"
                                className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${errors.city ? 'border-red-500' : 'border-gray-200'}`}
                            />
                        </div>
                         {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                         <label className="text-sm font-medium text-gray-700">Capacity <span className="text-red-500">*</span></label>
                         <div className="relative">
                             <Package className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                             <input 
                                {...register('capacity')}
                                type="number"
                                min="0"
                                placeholder="100"
                                className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${errors.capacity ? 'border-red-500' : 'border-gray-200'}`}
                            />
                        </div>
                         {errors.capacity && <p className="text-red-500 text-xs">{errors.capacity.message}</p>}
                    </div>
                     <div className="space-y-1.5">
                         <label className="text-sm font-medium text-gray-700">Storage Size (SqFt) <span className="text-red-500">*</span></label>
                         <div className="relative">
                             <Box className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                             <input 
                                {...register('sizeSqft')}
                                type="number" 
                                min="0"
                                placeholder="5000"
                                 className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${errors.sizeSqft ? 'border-red-500' : 'border-gray-200'}`}
                            />
                         </div>
                         {errors.sizeSqft && <p className="text-red-500 text-xs">{errors.sizeSqft.message}</p>}
                    </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Address <span className="text-red-500">*</span></label>
                  <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <textarea 
                        {...register('address')}
                        rows={2}
                        placeholder="Full address of the hub facility..."
                         className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none ${errors.address ? 'border-red-500' : 'border-gray-200'}`}
                      />
                  </div>
                   {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
                </div>
            </div>

            {/* Manager Section */}
            <div className="space-y-4">
                 <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" /> Manager Information
                    </h3>
                    
                    <div className="flex items-center gap-2 text-xs bg-gray-50 p-1 rounded-lg border border-gray-100">
                        <button
                            type="button"
                            onClick={() => setValue('createNewManager', true)}
                            className={`px-3 py-1 rounded-md transition-all font-medium ${createNewManager ? 'bg-white text-primary shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Create New
                        </button>
                         <button
                            type="button"
                            onClick={() => setValue('createNewManager', false)}
                            className={`px-3 py-1 rounded-md transition-all font-medium ${!createNewManager ? 'bg-white text-primary shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Select Existing
                        </button>
                    </div>
                 </div>
               
               {createNewManager ? (
                   <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Manager Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input 
                                        {...register('managerName')}
                                        type="text" 
                                        placeholder="Full Name"
                                        className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${errors.managerName ? 'border-red-500' : 'border-gray-200'}`}
                                    />
                                </div>
                                {errors.managerName && <p className="text-red-500 text-xs">{errors.managerName.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                     <input 
                                        {...register('managerEmail')}
                                        type="email" 
                                        placeholder="Email Address"
                                        className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${errors.managerEmail ? 'border-red-500' : 'border-gray-200'}`}
                                    />
                                </div>
                                {errors.managerEmail && <p className="text-red-500 text-xs">{errors.managerEmail.message}</p>}
                            </div>
                        </div>

                         <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                     <input 
                                        {...register('managerPhone')}
                                        type="tel" 
                                        placeholder="Mobile Number"
                                        className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${errors.managerPhone ? 'border-red-500' : 'border-gray-200'}`}
                                    />
                                </div>
                                {errors.managerPhone && <p className="text-red-500 text-xs">{errors.managerPhone.message}</p>}
                        </div>
                        
                         <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Password</label>
                             <div className="relative">
                                 <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                 <input 
                                    {...register('managerPassword')}
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Create a secure password"
                                    className={`w-full pl-9 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${errors.managerPassword ? 'border-red-500' : 'border-gray-200'}`}
                                />
                                 <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.managerPassword && <p className="text-red-500 text-xs">{errors.managerPassword.message}</p>}
                        </div>
                   </div>
               ) : (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Assigned Manager</label>
                            <select 
                                {...register('managerId')}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white text-sm"
                                disabled={isLoadingManagers}
                            >
                                <option value="">Select a manager</option>
                                {managers.map((manager: any) => (
                                    <option key={manager.id} value={manager.id}>
                                        {manager.full_name} ({manager.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                         {/* Editable fields for existing manager */}
                         {managerId && (
                           <div className="pt-2 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Name</label>
                                    <div className="relative">
                                         <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                         <input 
                                            {...register('managerName')}
                                            type="text" 
                                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-gray-50/50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Email</label>
                                     <div className="relative">
                                         <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                         <input 
                                            {...register('managerEmail')}
                                            type="email" 
                                             // Often emails are unique/identifiers so might be safer read-only or careful editing
                                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-gray-50/50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Phone</label>
                                     <div className="relative">
                                         <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                         <input 
                                            {...register('managerPhone')}
                                            type="tel" 
                                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-gray-50/50"
                                        />
                                    </div>
                                </div>
                           </div>
                         )}
                    </div>
               )}
            </div>

            {/* Footer Actions */}
            <div className="pt-4 flex justify-end gap-3 border-t border-gray-50 mt-2">
              <button 
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 bg-white border border-gray-300 rounded-lg transition-colors focus:ring-2 focus:ring-gray-200 cursor-pointer"
                disabled={isPending}
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit(onSubmit)}
                disabled={isPending}
                className="px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-all flex items-center gap-2 shadow-sm shadow-primary/20 focus:ring-2 focus:ring-primary/20"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>

          </form>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
