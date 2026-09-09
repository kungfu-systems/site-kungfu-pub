export interface LibraryResource {
  id: string;
  title: string;
  source: string;
  description: string;
  tags: string[];
  category: string;
  type: string;
  language: string;
  prerequisite: string;
}
export interface LibraryFilters {
  query: string;
  category: string;
  type: string;
  language: string;
  recommendedOnly: boolean;
  recommendedIds: readonly string[];
  savedOnly: boolean;
  savedIds: readonly string[];
}
const normalize = (text: string) =>
  text.toLowerCase().replace(/[-_/]/g, ' ').replace(/\s+/g, ' ').trim();

// Identity affects ordering by default. Hiding other resources requires an explicit filter.
export function selectResources<T extends LibraryResource>(
  resources: readonly T[],
  filters: LibraryFilters,
): T[] {
  const terms = normalize(filters.query).split(' ').filter(Boolean);
  const rank = (id: string) => {
    const index = filters.recommendedIds.indexOf(id);
    return index < 0 ? Number.MAX_SAFE_INTEGER : index;
  };
  return resources
    .filter((resource) => {
      const searchable = normalize(
        `${resource.title} ${resource.source} ${resource.description} ${resource.prerequisite} ${resource.tags.join(' ')}`,
      );
      return (
        (!filters.recommendedOnly || filters.recommendedIds.includes(resource.id)) &&
        (!filters.savedOnly || filters.savedIds.includes(resource.id)) &&
        (!filters.category || filters.category === resource.category) &&
        (!filters.type || filters.type === resource.type) &&
        (!filters.language || filters.language === resource.language) &&
        terms.every((term) => searchable.includes(term))
      );
    })
    .sort((a, b) => rank(a.id) - rank(b.id));
}
