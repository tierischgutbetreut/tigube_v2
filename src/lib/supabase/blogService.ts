import { supabase } from './client';

export type ContentItemType = 'blog' | 'news';

export interface ContentItem {
  id: string;
  type: ContentItemType;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetPostsOptions {
  type?: ContentItemType | 'all';
  limit?: number;
  offset?: number;
  search?: string;
}

export async function getPublishedContent(options: GetPostsOptions = {}) {
  const { type = 'all', limit = 10, offset = 0, search } = options;

  const client = supabase as any;
  let query = client
    .from('content_items')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type !== 'all') {
    query = query.eq('type', type);
  }

  if (search && search.trim().length > 0) {
    query = query.ilike('title', `%${search}%`);
  }

  const { data, error } = await query;
  if (error) return { data: null as ContentItem[] | null, error: error.message };
  return { data: data as ContentItem[], error: null };
}

export async function getContentBySlug(slug: string) {
  const client = supabase as any;
  const { data, error } = await client
    .from('content_items')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) return { data: null as ContentItem | null, error: error.message };
  return { data: data as ContentItem, error: null };
}


