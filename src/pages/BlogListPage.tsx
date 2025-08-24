import { useEffect, useState } from 'react';
import { getPublishedContent, type ContentItem } from '../lib/supabase/blogService';

interface BlogListPageProps {}

function BlogListPage({}: BlogListPageProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [type, setType] = useState<'all' | 'blog' | 'news'>('all');

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await getPublishedContent({ type, limit: 12, offset: 0, search });
      if (error) {
        setError(error);
        return;
      }
      setItems(data || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">🐾 Neu aus der tigube-Welt</h1>
        <p className="text-gray-600 mt-2">Von Neuigkeiten bei tigube bis zu Expertenwissen rund um die Pflege, Erziehung und Freude mit Haustieren.</p>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="all">Alle</option>
          <option value="blog">Blog</option>
          <option value="news">News</option>
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suche in Beiträgen"
          className="w-full md:w-96 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button className="btn btn-outline" onClick={load}>Filtern</button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-600">Lade Beiträge...</div>
      ) : error ? (
        <div className="py-16 text-center text-red-600">{error}</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-gray-600">Keine Beiträge gefunden.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <a key={item.id} href={`/blog/${item.slug}`} className="block rounded-lg border hover:shadow transition-shadow overflow-hidden">
              {item.cover_image_url && (
                <img src={item.cover_image_url} alt={item.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded ${item.type === 'news' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.type}</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 line-clamp-2 mt-1">{item.title}</h2>
                {item.excerpt && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-3">{item.excerpt}</p>
                )}
                {item.published_at && (
                  <p className="mt-3 text-xs text-gray-500">{new Date(item.published_at).toLocaleDateString('de-DE')}</p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default BlogListPage;


