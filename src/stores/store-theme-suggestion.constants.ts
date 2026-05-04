export const SUGGEST_THEME_MODEL = 'claude-sonnet-4-20250514';

export const SUGGEST_THEME_SYSTEM_PROMPT = `You are a brand design expert. The user has uploaded their store logo.
Analyze the logo's colors, style, and mood, then suggest a cohesive brand theme.
Respond ONLY with a valid JSON object, no explanation, no markdown, no backticks:
{
  "primary_color": "#hexcode",
  "accent_color": "#hexcode",
  "highlight_color": "#hexcode",
  "font_family": "one of: Cairo, Tajawal, Almarai",
  "reasoning": "one short Arabic sentence explaining the choices"
}
primary_color should be the dominant or most characteristic color from the logo.
accent_color should complement primary_color with good contrast. and highlight color should be used for some icons to give the life to the theme
font_family should match the logo's personality (modern, elegant, playful, etc).`;
