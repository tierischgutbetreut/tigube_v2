import { useEffect, useMemo, useState } from 'react';
import { adminSupabase } from '../../lib/supabase/adminClient';
import type { ContentItem } from '../../lib/supabase/blogService';
import { Plus, Search, Edit3, Trash2, Newspaper, Crop as CropIcon, X } from 'lucide-react';
import Cropper from 'react-easy-crop';

interface BlogCmsPanelProps {
  currentAdminId: string;
}

type FormState = Omit<ContentItem, 'id' | 'created_at' | 'updated_at' | 'author_id'> & {
  id?: string;
  author_id?: string | null;
};

const emptyForm: FormState = {
  type: 'blog',
  slug: '',
  title: '',
  excerpt: '',
  content: '',
  cover_image_url: '',
  status: 'draft',
  published_at: null,
  author_id: null,
};

function BlogCmsPanel({ currentAdminId }: BlogCmsPanelProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'blog' | 'news' | 'all'>('blog');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [editing, setEditing] = useState<FormState | null>(null);

  // Taxonomies
  interface Category { id: string; name: string; slug: string; }
  interface Tag { id: string; name: string; slug: string; }
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newTagName, setNewTagName] = useState<string>('');

  // Image upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const byType = typeFilter === 'all' ? true : it.type === typeFilter;
      const byStatus = statusFilter === 'all' ? true : it.status === statusFilter;
      const bySearch = search.trim().length === 0 ? true : (
        it.title.toLowerCase().includes(search.toLowerCase()) ||
        (it.excerpt || '').toLowerCase().includes(search.toLowerCase())
      );
      return byType && byStatus && bySearch;
    });
  }, [items, typeFilter, statusFilter, search]);

  useEffect(() => {
    void Promise.all([load(), loadTaxonomies()]);
  }, []);

  const load = async () => {
    if (!adminSupabase) {
      setError('Admin-Zugriff nicht konfiguriert (Service Role Key fehlt).');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await adminSupabase
        .from('content_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) {
        setError(error.message);
        return;
      }
      setItems((data || []) as unknown as ContentItem[]);
    } finally {
      setLoading(false);
    }
  };

  const loadTaxonomies = async () => {
    if (!adminSupabase) return;
    const [{ data: catData }, { data: tagData }] = await Promise.all([
      adminSupabase.from('content_categories').select('id, name, slug').order('name', { ascending: true }),
      adminSupabase.from('content_tags').select('id, name, slug').order('name', { ascending: true })
    ]);
    setCategories((catData || []) as any);
    setTags((tagData || []) as any);
  };

  const startCreate = () => {
    setEditing({ ...emptyForm, author_id: currentAdminId, type: 'blog' });
    setSelectedCategoryIds([]);
    setSelectedTagIds([]);
    setUploadFile(null);
    setUploadPreview(null);
  };

  const startEdit = (item: ContentItem) => {
    setEditing({
      id: item.id,
      type: item.type,
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt || '',
      content: item.content,
      cover_image_url: item.cover_image_url || '',
      status: item.status,
      published_at: item.published_at,
      author_id: item.author_id,
    });
    // Load selected categories/tags for this item
    void loadItemTaxonomies(item.id);
    setUploadFile(null);
    setUploadPreview(null);
  };

  const loadItemTaxonomies = async (itemId: string) => {
    if (!adminSupabase) return;
    const [{ data: catRels }, { data: tagRels }] = await Promise.all([
      adminSupabase.from('content_item_categories').select('category_id').eq('content_item_id', itemId),
      adminSupabase.from('content_item_tags').select('tag_id').eq('content_item_id', itemId)
    ]);
    setSelectedCategoryIds((catRels || []).map((r: any) => r.category_id));
    setSelectedTagIds((tagRels || []).map((r: any) => r.tag_id));
  };

  const remove = async (id: string) => {
    if (!adminSupabase) return;
    if (!confirm('Diesen Inhalt wirklich löschen?')) return;
    const { error } = await adminSupabase.from('content_items').delete().eq('id', id);
    if (error) {
      alert(error.message);
      return;
    }
    await load();
  };

  const save = async () => {
    if (!adminSupabase || !editing) return;
    const payload = { ...editing } as any;
    if (!payload.slug) payload.slug = slugify(payload.title);
    if (payload.status === 'published' && !payload.published_at) payload.published_at = new Date().toISOString();

    let contentItemId = editing.id;
    if (editing.id) {
      const { error } = await adminSupabase
        .from('content_items')
        .update(payload)
        .eq('id', editing.id);
      if (error) return alert(error.message);
    } else {
      const { data, error } = await adminSupabase
        .from('content_items')
        .insert({ ...payload, author_id: currentAdminId })
        .select('id')
        .single();
      if (error) return alert(error.message);
      contentItemId = (data as any).id as string;
    }

    // If a new file was selected, upload to Supabase Storage and update cover_image_url
    if (contentItemId && uploadFile) {
      const fileExt = (uploadFile.name.split('.').pop() || 'jpg').toLowerCase();
      const storagePath = `covers/${contentItemId}/cover-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await (adminSupabase as any).storage
        .from('blog_images')
        .upload(storagePath, uploadFile, { upsert: true, contentType: uploadFile.type, cacheControl: '3600' });
      if (uploadError) {
        alert(`Upload fehlgeschlagen: ${uploadError.message}`);
      } else {
        const { data: pub } = (adminSupabase as any).storage.from('blog_images').getPublicUrl(storagePath);
        const publicUrl = pub?.publicUrl as string | undefined;
        if (publicUrl) {
          const { error: updErr } = await adminSupabase
            .from('content_items')
            .update({ cover_image_url: publicUrl })
            .eq('id', contentItemId);
          if (updErr) alert(updErr.message);
        }
      }
    }

    // Update relations (delete-all then insert selection)
    if (contentItemId) {
      const ops: Promise<any>[] = [];
      ops.push(adminSupabase.from('content_item_categories').delete().eq('content_item_id', contentItemId));
      ops.push(adminSupabase.from('content_item_tags').delete().eq('content_item_id', contentItemId));
      await Promise.all(ops);

      const relOps: Promise<any>[] = [];
      if (selectedCategoryIds.length > 0) {
        relOps.push(
          adminSupabase.from('content_item_categories').insert(
            selectedCategoryIds.map((category_id) => ({ content_item_id: contentItemId, category_id }))
          )
        );
      }
      if (selectedTagIds.length > 0) {
        relOps.push(
          adminSupabase.from('content_item_tags').insert(
            selectedTagIds.map((tag_id) => ({ content_item_id: contentItemId, tag_id }))
          )
        );
      }
      if (relOps.length > 0) await Promise.all(relOps);
    }
    setEditing(null);
    setUploadFile(null);
    setUploadPreview(null);
    await load();
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const createCategory = async () => {
    if (!adminSupabase || !newCategoryName.trim()) return;
    const payload = { name: newCategoryName.trim(), slug: slugify(newCategoryName) };
    const { data, error } = await adminSupabase.from('content_categories').insert(payload).select('id').single();
    if (error) return alert(error.message);
    setNewCategoryName('');
    await loadTaxonomies();
    // Auto-select newly created category
    if ((data as any)?.id) setSelectedCategoryIds((prev) => [...prev, (data as any).id]);
  };

  const createTag = async () => {
    if (!adminSupabase || !newTagName.trim()) return;
    const payload = { name: newTagName.trim(), slug: slugify(newTagName) };
    const { data, error } = await adminSupabase.from('content_tags').insert(payload).select('id').single();
    if (error) return alert(error.message);
    setNewTagName('');
    await loadTaxonomies();
    if ((data as any)?.id) setSelectedTagIds((prev) => [...prev, (data as any).id]);
  };

  async function getCroppedBlob(imageSrc: string, area: { x: number; y: number; width: number; height: number }): Promise<Blob> {
    const image = document.createElement('img');
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;
    await new Promise((res, rej) => {
      image.onload = res;
      image.onerror = rej;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(area.width);
    canvas.height = Math.round(area.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context missing');
    ctx.drawImage(
      image,
      area.x,
      area.y,
      area.width,
      area.height,
      0,
      0,
      area.width,
      area.height
    );
    return await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Blob failed'))), 'image/jpeg', 0.9);
    });
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold">Blog & News</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-2 top-2.5" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suchen..."
              className="border rounded-md pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={startCreate}>
            <Plus className="h-4 w-4 mr-1" /> Neu
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 flex flex-wrap gap-2">
        <select className="border rounded-md px-2 py-1" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
          <option value="blog">Blog</option>
          <option value="news">News</option>
          <option value="all">Alle</option>
        </select>
        <select className="border rounded-md px-2 py-1" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          <option value="all">Status: Alle</option>
          <option value="draft">Entwurf</option>
          <option value="published">Veröffentlicht</option>
        </select>
        <button className="btn btn-outline btn-sm" onClick={() => void load()}>Aktualisieren</button>
      </div>

      {/* List */}
      <div className="divide-y">
        {loading ? (
          <div className="p-6 text-gray-600">Lade Inhalte...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-6 text-gray-600">Keine Inhalte gefunden.</div>
        ) : (
          filteredItems.map((it) => (
            <div key={it.id} className="p-4 flex items-start gap-3">
              {it.cover_image_url && (
                <img src={it.cover_image_url} alt="cover" className="w-16 h-16 object-cover rounded" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">{it.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${it.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{it.status}</span>
                  {it.published_at && (
                    <span className="text-xs text-gray-500">{new Date(it.published_at).toLocaleString('de-DE')}</span>
                  )}
                </div>
                <div className="font-medium text-gray-900 mt-1">{it.title}</div>
                <div className="text-sm text-gray-600 line-clamp-2">{it.excerpt}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-outline btn-sm" onClick={() => startEdit(it)}>
                  <Edit3 className="h-4 w-4 mr-1" /> Bearbeiten
                </button>
                <button className="btn btn-ghost btn-sm text-red-600" onClick={() => void remove(it.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Löschen
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[95vh] h-[95vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">{editing.id ? 'Inhalt bearbeiten' : 'Neuen Inhalt erstellen'}</h3>
              <button className="text-gray-500 hover:text-gray-800" onClick={() => setEditing(null)}>Schließen</button>
            </div>
            <div className="p-4 space-y-3 overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Typ</label>
                  <select className="w-full border rounded-md px-3 py-2" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as any })}>
                    <option value="blog">Blog</option>
                    <option value="news">News</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Slug</label>
                  <input className="w-full border rounded-md px-3 py-2" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="mein-artikel" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Titel</label>
                <input className="w-full border rounded-md px-3 py-2" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Kurzbeschreibung</label>
                <textarea className="w-full border rounded-md px-3 py-2" rows={2} value={editing.excerpt ?? ''} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} />
              </div>

              <div>
                 <label className="block text-sm text-gray-700 mb-1">Cover Bild</label>
                 <div className="flex flex-col gap-2">
                   {uploadPreview ? (
                     <img src={uploadPreview} alt="Preview" className="w-full max-h-40 object-cover rounded border" />
                   ) : editing.cover_image_url ? (
                     <img src={editing.cover_image_url} alt="Cover" className="w-full max-h-40 object-cover rounded border" />
                   ) : null}
                   {(uploadPreview || editing.cover_image_url) && (
                     <div className="flex gap-2">
                       <button
                         type="button"
                         className="btn btn-outline btn-xs"
                         onClick={() => {
                           if (!uploadPreview && editing.cover_image_url) {
                             setUploadPreview(editing.cover_image_url);
                           }
                           setIsCropping(true);
                         }}
                       >
                         <CropIcon className="h-3 w-3 mr-1" /> Zuschneiden
                       </button>
                     </div>
                   )}
                   <input
                     type="file"
                     accept="image/*"
                     onChange={(e) => {
                       const file = e.target.files?.[0] || null;
                       setUploadFile(file);
                       if (file) {
                         const url = URL.createObjectURL(file);
                         setUploadPreview(url);
                       } else {
                         setUploadPreview(null);
                       }
                     }}
                   />
                   <input
                     className="w-full border rounded-md px-3 py-2"
                     value={editing.cover_image_url ?? ''}
                     onChange={(e) => setEditing({ ...editing, cover_image_url: e.target.value })}
                     placeholder="https://... (optional, wird überschrieben wenn Datei gewählt)"
                   />
                   <p className="text-xs text-gray-500">Empfohlen: 1200×675 px • Seitenverhältnis 16:9 • JPG/PNG bis 5 MB</p>
                 </div>
              </div>
              
              {/* Inline Cropper Overlay */}
              {isCropping && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] h-[90vh] flex flex-col">
                    <div className="p-3 border-b flex items-center justify-between">
                      <div className="font-medium">Bild zuschneiden (16:9)</div>
                      <button className="text-gray-500 hover:text-gray-800" onClick={() => setIsCropping(false)}>
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex-1 relative bg-black">
                      <Cropper
                        image={uploadPreview || editing.cover_image_url || ''}
                        crop={crop}
                        zoom={zoom}
                        aspect={16 / 9}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={(c, areaPx) => setCroppedAreaPixels(areaPx)}
                        showGrid
                        objectFit="contain"
                      />
                    </div>
                    <div className="p-3 border-t flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-gray-600">Zoom</label>
                        <input
                          type="range"
                          min={1}
                          max={3}
                          step={0.1}
                          value={zoom}
                          onChange={(e) => setZoom(Number(e.target.value))}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="btn btn-outline btn-sm" onClick={() => setIsCropping(false)}>Abbrechen</button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={async () => {
                            if (!croppedAreaPixels || !(uploadPreview || editing.cover_image_url)) return;
                            try {
                              const blob = await getCroppedBlob(uploadPreview || (editing.cover_image_url as string), croppedAreaPixels);
                              const file = new File([blob], 'cover-cropped.jpg', { type: 'image/jpeg' });
                              setUploadFile(file);
                              const url = URL.createObjectURL(blob);
                              setUploadPreview(url);
                              setIsCropping(false);
                            } catch (e) {
                              alert('Zuschneiden fehlgeschlagen');
                            }
                          }}
                        >
                          Zuschneiden übernehmen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-700 mb-1">Inhalt</label>
                <textarea className="w-full border rounded-md px-3 py-2" rows={10} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Status</label>
                  <select className="w-full border rounded-md px-3 py-2" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as any })}>
                    <option value="draft">Entwurf</option>
                    <option value="published">Veröffentlicht</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Veröffentlichungsdatum</label>
                  <input type="datetime-local" className="w-full border rounded-md px-3 py-2" value={editing.published_at ? toLocalInput(editing.published_at) : ''} onChange={(e) => setEditing({ ...editing, published_at: fromLocalInput(e.target.value) })} />
                </div>
              </div>

              {/* Categories & Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Kategorien</label>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 max-h-40 overflow-auto border rounded p-2">
                    {categories.length === 0 ? (
                      <span className="text-sm text-gray-500">Keine Kategorien</span>
                    ) : (
                      categories.map((c) => (
                        <label key={c.id} className="inline-flex items-center gap-2 text-sm bg-gray-50 px-2 py-1 rounded border">
                          <input type="checkbox" checked={selectedCategoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)} />
                          {c.name}
                        </label>
                      ))
                    )}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Neue Kategorie" className="flex-1 border rounded px-2 py-1" />
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => void createCategory()}>Hinzufügen</button>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Tags</label>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 max-h-40 overflow-auto border rounded p-2">
                    {tags.length === 0 ? (
                      <span className="text-sm text-gray-500">Keine Tags</span>
                    ) : (
                      tags.map((t) => (
                        <label key={t.id} className="inline-flex items-center gap-2 text-sm bg-gray-50 px-2 py-1 rounded border">
                          <input type="checkbox" checked={selectedTagIds.includes(t.id)} onChange={() => toggleTag(t.id)} />
                          {t.name}
                        </label>
                      ))
                    )}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="Neuer Tag" className="flex-1 border rounded px-2 py-1" />
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => void createTag()}>Hinzufügen</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button className="btn btn-outline" onClick={() => setEditing(null)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={() => void save()}>Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromLocalInput(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return d.toISOString();
}

export default BlogCmsPanel;


