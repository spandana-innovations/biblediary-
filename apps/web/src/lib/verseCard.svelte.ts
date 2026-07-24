/** State for the shareable verse-card modal. */
export interface CardData {
  title: string;
  ref: string;
  text: string;
  season: string;
  dateLine: string;
}
export const card = $state({ data: null as CardData | null });
export const openCard = (d: CardData) => (card.data = d);
export const closeCard = () => (card.data = null);
