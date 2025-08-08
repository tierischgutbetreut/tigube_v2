import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getContentBySlug, type ContentItem } from '../lib/supabase/blogService';

function BlogPostPage() {
  const { slug } = useParams();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [slug]);

  const load = async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await getContentBySlug(slug);
      if (error) {
        setError(error);
        return;
      }
      setItem(data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container-custom py-16 text-center text-gray-600">Lade Beitrag...</div>;
  if (error) return <div className="container-custom py-16 text-center text-red-600">{error}</div>;
  if (!item) return <div className="container-custom py-16 text-center text-gray-600">Beitrag nicht gefunden.</div>;

  return (
    <article className="container-custom py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/blog" className="text-sm text-primary-700 hover:underline">← Zurück zu Blog & News</Link>
        {item.type && (
          <span className={`text-xs px-2 py-1 rounded ${item.type === 'news' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.type}</span>
        )}
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">{item.title}</h1>
      {item.published_at && (
        <p className="text-gray-500 text-sm mt-1">{new Date(item.published_at).toLocaleDateString('de-DE')}</p>
      )}
      {item.cover_image_url && (
        <img src={item.cover_image_url} alt={item.title} className="w-full h-80 object-cover rounded-lg mt-6" />
      )}

      <div className="prose prose-lg max-w-none mt-8">
        <p style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
      </div>
    </article>
  );
}

export default BlogPostPage;


