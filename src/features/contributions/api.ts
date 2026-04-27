import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Contribution = Database["public"]["Tables"]["contributions"]["Row"];

export function useContributions(groupId: string | undefined) {
  return useQuery({
    queryKey: ["contributions", groupId],
    enabled: !!groupId,
    queryFn: async (): Promise<Contribution[]> => {
      const { data, error } = await supabase
        .from("contributions")
        .select("*")
        .eq("group_id", groupId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Toggle a contribution paid/unpaid; upserts if no row exists yet. */
export function useToggleContribution(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      memberId: string;
      cycleMonth: number;
      paid: boolean;
      amount: number;
    }) => {
      const { memberId, cycleMonth, paid, amount } = input;
      const { data: existing } = await supabase
        .from("contributions")
        .select("id")
        .eq("member_id", memberId)
        .eq("cycle_month", cycleMonth)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("contributions")
          .update({
            paid,
            paid_at: paid ? new Date().toISOString() : null,
            amount,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contributions").insert({
          group_id: groupId,
          member_id: memberId,
          cycle_month: cycleMonth,
          paid,
          paid_at: paid ? new Date().toISOString() : null,
          amount,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contributions", groupId] });
    },
  });
}
