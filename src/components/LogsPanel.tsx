import { useProject } from "@/state/ProjectContext";

export function LogsPanel() {
  const { logs } = useProject();
  return (
    <section className="logs">
      <header>
        <h2>Status & Logs</h2>
      </header>
      <div className="log-list">
        {logs.length === 0 && <p className="empty">Nenhum log ainda.</p>}
        {logs.map((log) => (
          <article key={log.id} className={`log log-${log.type}`}>
            <time>{new Date(log.timestamp).toLocaleTimeString()}</time>
            <p>{log.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
