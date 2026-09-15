import { supabaseAdmin as supabase } from "./supabaseAdmin";

export interface DashboardWidget {
  id: string;
  widget_key: string;
  is_enabled: boolean;
  display_order: number;
}

export async function getDashboardWidgets(): Promise<DashboardWidget[]> {
  const { data, error } = await supabase
    .from("dashboard_widgets")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function setDashboardWidgetEnabled(widgetKey: string, isEnabled: boolean) {
  const { error } = await supabase
    .from("dashboard_widgets")
    .update({ is_enabled: isEnabled })
    .eq("widget_key", widgetKey);

  if (error) throw error;
}

export async function reorderDashboardWidgets(orderedKeys: string[]) {
  await Promise.all(
    orderedKeys.map((key, index) =>
      supabase.from("dashboard_widgets").update({ display_order: index }).eq("widget_key", key)
    )
  );
}