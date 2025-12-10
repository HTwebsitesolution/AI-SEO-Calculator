export type Intent = "lead_generation" | "support_reduction" | "conversion_increase" | "content_speed";
export type Constraint = "no_dev_time" | "no_new_tools" | "thirty_day_deadline" | "compliance";

export function recommendPlays(signals:any, intent:Intent, constraint:Constraint) {
  // Rule-based mapping
  const plays = [];
  if (intent === "lead_generation") {
    plays.push("missed_call_booking");
  }
  if (intent === "conversion_increase" || signals.hasSchema === false) {
    plays.push("faq_widget");
  }
  // constraint reordering
  if (constraint === "no_dev_time") plays.reverse();
  return Array.from(new Set(plays)).slice(0,2);
}

export function roiRanges(play:string, calibration:any) {
  if (play === "missed_call_booking") {
    const calls = Number(calibration?.missed_calls_per_week ?? 40);
    return {
      low: Math.round(calls*0.10),
      likely: Math.round(calls*0.18),
      high: Math.round(calls*0.30)
    };
  }
  // faq_widget
  const sessions = Number(calibration?.sessions_on_pages_per_week ?? 600);
  return {
    low: Math.round(sessions*0.0005*100)/100,
    likely: Math.round(sessions*0.001*100)/100,
    high: Math.round(sessions*0.0018*100)/100
  };
}
