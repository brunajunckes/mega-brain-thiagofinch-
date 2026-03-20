import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Editor() {
  const router = useRouter();
  const { id } = router.query;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/books/${id}`)
      .then(r => r.json())
      .then(data => {
        setBook(data);
        if (data.chapters.length > 0) {
          setSelectedChapter(data.chapters[0]);
          if (data.chapters[0].sections.length > 0) {
            setSelectedSection(data.chapters[0].sections[0]);
            setEditingContent(data.chapters[0].sections[0].content);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !book) return <div style={{ padding: '20px' }}>Loading...</div>;

  const handleSaveSection = async () => {
    if (!selectedChapter || !selectedSection) return;
    setSaving(true);
    try {
      await fetch(`/api/books/${id}/chapters/${selectedChapter.id}/sections/${selectedSection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingContent })
      });
      alert('Saved!');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '250px', backgroundColor: '#f9f9f9', borderRight: '1px solid #ddd', overflowY: 'auto', padding: '20px' }}>
        <h2>{book.title}</h2>
        {book.chapters.map(ch => (
          <div key={ch.id}>
            <div onClick={() => setSelectedChapter(ch)} style={{ cursor: 'pointer', fontWeight: selectedChapter?.id === ch.id ? 'bold' : 'normal' }}>
              {ch.title}
            </div>
            {selectedChapter?.id === ch.id && (
              <div style={{ paddingLeft: '20px' }}>
                {ch.sections.map(sec => (
                  <div key={sec.id} onClick={() => { setSelectedSection(sec); setEditingContent(sec.content); }} style={{ cursor: 'pointer', fontSize: '13px' }}>
                    {sec.title || 'Untitled'}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderBottom: '1px solid #ddd' }}>
          <h1 style={{ margin: 0 }}>{selectedChapter?.title}</h1>
        </div>
        <textarea value={editingContent} onChange={(e) => setEditingContent(e.target.value)} style={{ flex: 1, padding: '20px', border: 'none', fontFamily: 'monospace' }} />
        <div style={{ padding: '20px', borderTop: '1px solid #ddd' }}>
          <button onClick={handleSaveSection} disabled={saving} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
