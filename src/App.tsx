import { useEffect, useMemo, useState } from "react";
import { useProject } from "@/state/ProjectContext";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { FormBuilder } from "@/components/FormBuilder";
import { PreviewPanel } from "@/components/PreviewPanel";
import { LogsPanel } from "@/components/LogsPanel";
import { FormProviderSelector } from "@/components/FormProviderSelector";
import "./App.css";

export default function App() {
  const { project, rendered, loading } = useProject();
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);

  const tabs = project?.schema?.tabs ?? [];

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const currentTab = useMemo(() => tabs.find((tab) => tab.id === activeTab), [tabs, activeTab]);

  return (
    <div className="app-shell">
      <TopBar />
      <main>
        <Sidebar schema={project?.schema} activeTab={activeTab} onSelect={setActiveTab} />
        <section className="editor">
          {loading && <div className="loading">Carregando template...</div>}
          {!loading && currentTab && (
            <>
              {currentTab.id === "form" && <FormProviderSelector />}
              <FormBuilder tab={currentTab} />
            </>
          )}
          {!loading && !currentTab && <p className="empty">Selecione ou carregue um template para começar.</p>}
        </section>
        <PreviewPanel rendered={rendered} />
      </main>
      <LogsPanel />
    </div>
  );
}
