import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Payout = Database["public"]["Tables"]["payouts"]["Row"];

export function usePayouts(groupId: string | undefined) {
  return useQuery({
    queryKey: ["payouts", groupId],
    enabled: !!groupId,
    queryFn: async (): Promise<Payout[]> => {
      const { data, error } = await supabase
        .from("payouts")
        .select("*")
        .eq("group_id", groupId!)
        .order("cycle_month", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useReleasePayout(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      memberId: string;
      cycleMonth: number;
      amount: number;
      released: boolean;
    }) => {
      const { memberId, cycleMonth, amount, released } = input;
      const { data: existing } = await supabase
        .from("payouts")
        .select("id")
        .eq("group_id", groupId)
        .eq("cycle_month", cycleMonth)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("payouts")
          .update({
            released,
            released_at: released ? new Date().toISOString() : null,
            member_id: memberId,
            amount,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payouts").insert({
          group_id: groupId,
          member_id: memberId,
          cycle_month: cycleMonth,
          amount,
          released,
          released_at: released ? new Date().toISOString() : null,
        });
        if (error) throw error;
      }

      // Mirror flag onto the member row so "next payout" computation is fast.
      await supabase
        .from("members")
        .update({
          payout_received: released,
          payout_received_at: released ? new Date().toISOString() : null,
        })
        .eq("id", memberId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payouts", groupId] });
      qc.invalidateQueries({ queryKey: ["members", groupId] });
    },
  });
}
