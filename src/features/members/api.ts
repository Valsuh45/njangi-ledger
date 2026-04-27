import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Member = Database["public"]["Tables"]["members"]["Row"];

export function useMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: ["members", groupId],
    enabled: !!groupId,
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("group_id", groupId!)
        .order("payout_position", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMember(memberId: string | undefined) {
  return useQuery({
    queryKey: ["member", memberId],
    enabled: !!memberId,
    queryFn: async (): Promise<Member | null> => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("id", memberId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useAddMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; phone?: string; payout_position?: number }) => {
      // Determine next position if not provided
      let position = input.payout_position;
      if (!position) {
        const { data: existing } = await supabase
          .from("members")
          .select("payout_position")
          .eq("group_id", groupId)
          .order("payout_position", { ascending: false })
          .limit(1);
        position = (existing?.[0]?.payout_position ?? 0) + 1;
      }
      const { data, error } = await supabase
        .from("members")
        .insert({
          group_id: groupId,
          name: input.name,
          phone: input.phone || null,
          payout_position: position,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", groupId] });
    },
  });
}

export function useUpdateMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Member> }) => {
      const { data, error } = await supabase
        .from("members")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", groupId] });
    },
  });
}

export function useDeleteMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", groupId] });
      qc.invalidateQueries({ queryKey: ["contributions", groupId] });
      qc.invalidateQueries({ queryKey: ["payouts", groupId] });
    },
  });
}
