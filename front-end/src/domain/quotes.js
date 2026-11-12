import { fromIso } from "./dates.js";

const QUOTES = [
  ["The happiness of your life depends upon the quality of your thoughts.", "Marcus Aurelius"],
  ["Nothing can bring you peace but yourself.", "Ralph Waldo Emerson"],
  ["How we spend our days is, of course, how we spend our lives.", "Annie Dillard"],
  ["Knowing yourself is the beginning of all wisdom.", "Aristotle"],
  ["Wherever you are, be all there.", "Jim Elliot"],
  ["The only journey is the one within.", "Rainer Maria Rilke"],
  ["Be kind, for everyone you meet is fighting a hard battle.", "Ian Maclaren"],
  ["It is not the mountain we conquer, but ourselves.", "Edmund Hillary"],
  ["What we think, we become.", "attributed to the Buddha"],
  ["Rest is not idleness.", "John Lubbock"],
  ["Little by little, one travels far.", "Spanish proverb"],
  ["Fall seven times, stand up eight.", "Japanese proverb"],
  ["The best way out is always through.", "Robert Frost"],
  ["No feeling is final.", "Rainer Maria Rilke"],
];

/** The same quote all day, a different one tomorrow. */
export function quoteFor(iso) {
  const dayNumber = Math.round(fromIso(iso).getTime() / 86_400_000);
  const [text, author] = QUOTES[((dayNumber % QUOTES.length) + QUOTES.length) % QUOTES.length];
  return { text, author };
}
