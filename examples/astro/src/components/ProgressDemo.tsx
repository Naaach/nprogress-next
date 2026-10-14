import { ProgressBar, useProgress } from 'nprogress-next-react';
import 'nprogress-next-react/styles.css';

export default function ProgressDemo() {
  const progress = useProgress();
  const secondProgress = useProgress({ color: '#e67e22' });

  const styles = {
    controls: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' } as React.CSSProperties,
    button: {
      padding: '0.625rem 1rem',
      border: '1px solid #ddd',
      borderRadius: 6,
      background: '#fff',
      cursor: 'pointer',
      fontSize: '0.9rem',
      transition: 'background 0.15s, border-color 0.15s',
    } as React.CSSProperties,
    primary: { background: '#29d', color: '#fff', borderColor: '#29d' } as React.CSSProperties,
    instanceDemo: { borderTop: '1px solid #eee', paddingTop: '1rem' } as React.CSSProperties,
    h3: { fontSize: '1.1rem', marginBottom: '0.5rem' } as React.CSSProperties,
    p: { marginBottom: '1rem', color: '#333' } as React.CSSProperties,
    secondContainer: { padding: '1rem', border: '1px solid #eee', borderRadius: 6, background: '#fafafa' } as React.CSSProperties,
  };

  return (
    <div>
      <ProgressBar color="#29d" progress={progress.status ?? 0} />

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
        <h3 style={styles.h3}>Isolated instance via <code>createProgress()</code></h3>
        <p style={styles.p}>
          Second progress bar with custom color, using the <code>progress</code> prop.
        </p>
        <div style={styles.secondContainer}>
          <ProgressBar progress={secondProgress.status ?? 0} color="#e67e22" />
          <div style={styles.controls}>
            <button style={styles.button} onClick={() => secondProgress.start()}>
              Start
            </button>
            <button style={styles.button} onClick={() => secondProgress.set(0.75)}>
              Set 75%
            </button>
            <button style={styles.button} onClick={() => secondProgress.done()}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}