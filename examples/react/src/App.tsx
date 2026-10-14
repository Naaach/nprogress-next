import Demo from './Demo';

export default function App() {
  return (
    <main style={styles.main}>
      <h1 style={styles.h1}>nprogress-next <span style={styles.subtitle}>React Example</span></h1>
      <p style={styles.desc}>
        <code>ProgressBar</code> at app root + <code>useProgress()</code> hook in a component.
      </p>
      <Demo />
      <p style={styles.note}>
        Color passed via <code>color</code> prop. Styles auto-injected via <code>import 'nprogress-next-react/styles.css'</code>.
      </p>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { maxWidth: 720, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif', lineHeight: 1.6 },
  h1: { fontSize: '1.75rem', marginBottom: '0.5rem' },
  subtitle: { color: '#666', fontWeight: 400 },
  desc: { marginBottom: '2rem', color: '#333' },
  note: { marginTop: '2rem', fontSize: '0.875rem', color: '#666' },
};