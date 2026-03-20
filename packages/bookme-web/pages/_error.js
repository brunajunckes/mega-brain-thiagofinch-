export default function Error({ statusCode }) {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>{statusCode || 'Error'}</h1>
      <p>{statusCode === 404 ? 'Page not found' : 'An error occurred'}</p>
      <a href="/" style={{ color: '#0070f3' }}>Go home</a>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
