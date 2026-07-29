// Remove Arabic Tatweel characters (ـ) that stretch/elongate text
export function removeTatweel(text: string): string {
  if (!text) return text;
  // Unicode U+0640 is the Arabic Tatweel character
  return text.replace(/ـ/g, "");
}

// Clean up extremely long repeated characters (like ـــــــ) that break layouts
export function cleanLongText(text: string, maxRepeats = 10): string {
  if (!text) return text;

  // First remove tatweel characters
  let cleaned = removeTatweel(text);

  // Replace any character repeated more than maxRepeats times with max repeats
  return cleaned.replace(/(.)\1{10,}/g, (match) => {
    const char = match[0];
    return char.repeat(maxRepeats);
  });
}

// Add zero-width spaces for better text breaking in Arabic
export function addSoftBreaks(text: string): string {
  if (!text) return text;

  // Add zero-width space after every few characters to allow breaking
  const zeroWidthSpace = "​";
  return text.replace(/(.{8})/g, "$1" + zeroWidthSpace);
}
