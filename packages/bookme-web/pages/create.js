import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Create() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    author: '',
    description: '',
    driveUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error('Failed to create book');
      
      const book = await res.json();
      router.push(`/editor/${book.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Create New Book</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Title *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '10px', marginTop: '5px' }}
          />
        </div>

        <div>
          <label>Author</label>
          <input
            type="text"
            name="author"
            value={form.author}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', marginTop: '5px' }}
          />
        </div>

        <div>
          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', marginTop: '5px', minHeight: '100px' }}
          />
        </div>

        <div>
          <label>Google Drive URL (optional)</label>
          <input
            type="url"
            name="driveUrl"
            value={form.driveUrl}
            onChange={handleChange}
            placeholder="https://drive.google.com/file/d/..."
            style={{ width: '100%', padding: '10px', marginTop: '5px' }}
          />
        </div>

        {error && <div style={{ color: 'red', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Creating...' : 'Create Book'}
        </button>
      </form>
    </div>
  );
}
