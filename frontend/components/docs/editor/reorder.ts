/** Swaps the item at `index` with its neighbour in `direction`, or returns
 *  the array unchanged if that neighbour doesn't exist (already first/last). */
export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = items.slice();
  [next[index], next[target]] = [next[target] as T, next[index] as T];
  return next;
}
