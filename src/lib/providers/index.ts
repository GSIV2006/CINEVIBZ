import type { Media, MediaType, PageResult } from '@/lib/types';
import { cataloguePage, detail } from './tmdb';
// A provider boundary for a future, permission-cleared catalogue integration.
export interface CatalogueProvider {
  detail(type: MediaType, id: number, full?: boolean): Promise<Media>;
  page(
    path: string,
    type: MediaType,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<PageResult>;
}
export const catalogue: CatalogueProvider = { detail, page: cataloguePage };
