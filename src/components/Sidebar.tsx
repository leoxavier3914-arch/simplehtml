import type { TemplateSchema } from "@/types/schema";

interface SidebarProps {
  schema?: TemplateSchema;
  activeTab?: string;
  onSelect: (tabId: string) => void;
}

export function Sidebar({ schema, activeTab, onSelect }: SidebarProps) {
  if (!schema) {
    return (
      <aside className="sidebar empty">
        <p>Carregue um template para começar.</p>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <h2>Configurações</h2>
      <nav>
        {schema.tabs.map((tab) => (
          <button key={tab.id} className={tab.id === activeTab ? "active" : ""} onClick={() => onSelect(tab.id)}>
            {tab.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
