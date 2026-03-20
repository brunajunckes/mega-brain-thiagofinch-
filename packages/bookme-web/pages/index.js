export async function getServerSideProps(context) {
  // Redirect to dashboard on server side
  return {
    redirect: {
      destination: '/dashboard',
      permanent: false,
    },
  };
}

export default function Home() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>📚 BookMe</h1>
      <p>Transform any file into a structured, editable book</p>
      <a href="/dashboard" style={{ 
        display: 'inline-block',
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '5px'
      }}>
        Get Started
      </a>
    </div>
  );
}
