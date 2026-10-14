import { useProgress } from 'nprogress-next-react';

export default function Demo() {
  const progress = useProgress();

  return (
    <div style={styles.container}>
      <div style={styles.controls}>
        <button style={{ ...styles.button, ...styles.primary }} onClick={() => progress.start()}>
          Start
        </button>
        <button style={styles.button} onClick={() => progress.set(0.5)}>
          Set 50%
        </button>
        <button style={styles.button} onClick={() => progress.inc()}>
          Increment
        </button>
        <button style={styles.button} onClick={() => progress.done()}>
          Done
        </button>
        <button style={styles.button} onClick={() => progress.remove()}>
          Remove
        </button>
      </div>

      <div style={styles.instanceDemo}>
        <h2 style={styles.h2}>Isolated instance via <code>createProgress()</code></h2>
        <p style={styles.p}>
          Second progress bar with custom color, mounted in this container.
        </p>
        <SecondInstance />
      </div>
    </div>
  );
}

function SecondInstance() {
  const progress = useProgress({ color: '#e67e22' });

  return (
    <div style={styles.secondContainer}>
      <div style={styles.controls}>
        <button style={styles.button} onClick={() => progress.start()}>
          Start
        </button>
        <button style={styles.button} onClick={() => progress.set(0.75)}>
          Set 75%
        </button>
        <button style={styles.button} onClick={() => progress.done()}>
          Done
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { marginTop: '1.5rem' },
  controls: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' },
  button: {
    padding: '0.625rem 1rem',
    border: '1px solid #ddd',
    borderRadius: 6,
    background: '#fff',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'background 0.15s, border-color 0.15s',
  },
  primary: { background: '#29d', color: '#fff', borderColor: '#29d' },
  instanceDemo: { borderTop: '1px solid #eee', paddingTop: '1.5rem' },
  h2: { fontSize: '1.25rem', marginBottom: '0.5rem' },
  p: { marginBottom: '1rem', color: '#333' },
  secondContainer: { padding: '1rem', border: '1px solid #eee', borderRadius: 6, background: '#fafafa' },
};