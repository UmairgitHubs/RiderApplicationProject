import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '@/lib/api/support';
import { toast } from 'sonner';

export const useSupport = (params?: { status?: string; priority?: string; search?: string; page?: number }) => {
  return useQuery({
    queryKey: ['support-tickets', params],
    queryFn: () => supportApi.getTickets(params),
  });
};

export const useSupportStats = () => {
  return useQuery({
    queryKey: ['support-stats'],
    queryFn: () => supportApi.getStats(),
  });
};

export const useTicketDetails = (id: string | null) => {
  return useQuery({
    queryKey: ['ticket-details', id],
    queryFn: () => supportApi.getTicketById(id!),
    enabled: !!id,
  });
};

export const useReplyTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, message, status }: { id: string; message: string; status?: string }) =>
      supportApi.reply(id, message, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-details', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
      toast.success('Reply sent successfully');
    },
    onError: () => {
      toast.error('Failed to send reply');
    },
  });
};

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, priority }: { id: string; status?: string; priority?: string }) =>
      supportApi.updateTicket(id, { status, priority }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-details', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
      toast.success('Ticket updated successfully');
    },
    onError: () => {
      toast.error('Failed to update ticket');
    },
  });
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { user_id: string; subject: string; category: string; priority?: string; message: string }) =>
      supportApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
      toast.success('Ticket created successfully');
    },
    onError: () => {
      toast.error('Failed to create ticket');
    },
  });
};

export const useSearchSupportUsers = (query: string) => {
  return useQuery({
    queryKey: ['search-support-users', query],
    queryFn: () => supportApi.searchUsers(query),
    enabled: query.length >= 2,
  });
};


