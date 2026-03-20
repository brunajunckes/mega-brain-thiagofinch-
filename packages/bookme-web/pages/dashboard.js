import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/books')
      .then(r => r.json())
      .then(setBooks)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error.message}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>My Books</h1>
      <a href="/create" style={{
        padding: '10px 20px',
        backgroundColor: '#28a745',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '5px',
        display: 'inline-block',
        marginBottom: '20px'
      }}>
        + New Book
      </a>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {books.map(book => (
          <div key={book.id} style={{
            border: '1px solid #ddd',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3>{book.title}</h3>
            <p style={{ color: '#666' }}>by {book.author}</p>
            <p style={{ fontSize: '14px', color: '#999' }}>
              {book.chapters} chapters • {book.words} words
            </p>
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
              <a href={`/editor/${book.id}`} style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                flex: 1,
                textAlign: 'center'
              }}>
                Edit
              </a>
              <button onClick={() => deleteBook(book.id)} style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {books.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '40px', color: '#999' }}>
          <p>No books yet. <a href="/create">Create your first book</a></p>
        </div>
      )}
    </div>
  );

  function deleteBook(id) {
    if (!confirm('Delete this book?')) return;
    fetch(`/api/books/${id}`, { method: 'DELETE' })
      .then(() => setBooks(books.filter(b => b.id !== id)))
      .catch(alert);
  }
}
