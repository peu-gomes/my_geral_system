"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Search, 
  Sparkles, 
  Github, 
  ExternalLink, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  FolderDot, 
  Tag, 
  BrainCircuit, 
  Check, 
  Loader2, 
  ArrowLeftRight,
  TrendingUp, 
  BarChart2, 
  X, 
  Info, 
  Globe, 
  Layers, 
  Download, 
  Upload,
  Calendar,
  Layers2,
  List,
  LayoutGrid,
  ChevronRight,
  ArrowRight,
  Sparkle,
  Settings,
  Sliders,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { INITIAL_PROJECTS, Project, Task } from "@/lib/initial-projects";

function generateUniqueId(prefix: string): string {
  if (typeof window !== "undefined") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

export default function Home() {
  // Store state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"bento" | "kanban" | "list">("bento");
  
  // Modals & Drawers
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"general" | "tasks" | "notes" | "ai">("general");

  // New Project Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSource, setNewSource] = useState<"ai_studio" | "external">("external");
  const [newStatus, setNewStatus] = useState<"planning" | "in_progress" | "completed">("planning");
  const [newTagsString, setNewTagsString] = useState("");
  const [newGithub, setNewGithub] = useState("");
  const [newDeploy, setNewDeploy] = useState("");
  const [newWorkspace, setNewWorkspace] = useState("");
  const [isSmartDraftLoading, setIsSmartDraftLoading] = useState(false);
  const [smartDraftPrompt, setSmartDraftPrompt] = useState("");
  const [showSmartDraftInput, setShowSmartDraftInput] = useState(false);

  // Gemini loading states for existing projects
  const [isRefiningDescription, setIsRefiningDescription] = useState(false);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // System Settings States
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [userName, setUserName] = useState("Desenvolvedor");
  const [aiPersona, setAiPersona] = useState("mentor"); // "mentor" | "minimalist" | "scrum" | "creative"
  const [defaultViewMode, setDefaultViewMode] = useState<"bento" | "kanban" | "list">("bento");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [tempUserName, setTempUserName] = useState("");
  const [tempAiPersona, setTempAiPersona] = useState("mentor");
  const [tempDefaultViewMode, setTempDefaultViewMode] = useState<"bento" | "kanban" | "list">("bento");
  const [tempTheme, setTempTheme] = useState<"light" | "dark">("light");

  // New task input (within details drawer)
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Load projects from localStorage or use initial projects
  useEffect(() => {
    const saved = localStorage.getItem("project_hub_projects");
    const savedName = localStorage.getItem("project_hub_username");
    const savedPersona = localStorage.getItem("project_hub_ai_persona");
    const savedView = localStorage.getItem("project_hub_default_view");
    const savedTheme = localStorage.getItem("project_hub_theme");

    const timer = setTimeout(() => {
      if (saved) {
        try {
          setProjects(JSON.parse(saved));
        } catch (e) {
          setProjects(INITIAL_PROJECTS);
        }
      } else {
        setProjects(INITIAL_PROJECTS);
        localStorage.setItem("project_hub_projects", JSON.stringify(INITIAL_PROJECTS));
      }

      if (savedName) setUserName(savedName);
      if (savedPersona) setAiPersona(savedPersona);
      if (savedView) {
        setDefaultViewMode(savedView as any);
        setViewMode(savedView as any);
      }
      if (savedTheme) {
        setTheme(savedTheme as "light" | "dark");
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Sync theme with DOM and localStorage
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("project_hub_theme", theme);
  }, [theme]);

  // Sync projects to localStorage on change
  const saveProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    localStorage.setItem("project_hub_projects", JSON.stringify(updatedProjects));
  };

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // Handle Project Creation
  const handleCreateProject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTitle.trim()) {
      showToast("Por favor, insira um título para o projeto.", "error");
      return;
    }

    const tagsArray = newTagsString
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newProj: Project = {
      id: generateUniqueId("project"),
      title: newTitle.trim(),
      description: newDescription.trim(),
      status: newStatus,
      source: newSource,
      tags: tagsArray,
      tasks: [],
      links: {
        github: newGithub.trim() || undefined,
        deploy: newDeploy.trim() || undefined,
        workspace: newWorkspace.trim() || undefined,
      },
      notes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newProj, ...projects];
    saveProjects(updated);
    setIsNewProjectModalOpen(false);
    resetForm();
    showToast(`Projeto "${newProj.title}" criado com sucesso!`);
    
    // Auto-open details for the newly created project
    setSelectedProjectId(newProj.id);
    setDrawerTab("general");
    setIsDetailsDrawerOpen(true);
  };

  const resetForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewSource("external");
    setNewStatus("planning");
    setNewTagsString("");
    setNewGithub("");
    setNewDeploy("");
    setNewWorkspace("");
    setSmartDraftPrompt("");
    setShowSmartDraftInput(false);
  };

  // Smart Draft / Gemini Assistant to auto-fill forms
  const handleSmartDraft = async () => {
    if (!smartDraftPrompt.trim()) {
      showToast("Escreva uma ideia curta para a IA estruturar.", "error");
      return;
    }

    setIsSmartDraftLoading(true);
    setAiError(null);

    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-roadmap",
          projectTitle: smartDraftPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao comunicar com a IA.");
      }

      const data = await response.json();
      
      // We will also use standard generation logic to create a summary
      setNewTitle(smartDraftPrompt.substring(0, 50));
      setNewDescription(data.copilotTips || "");
      if (data.technologies && data.technologies.length > 0) {
        setNewTagsString(data.technologies.slice(0, 4).join(", "));
      }
      
      showToast("Formulário pré-preenchido com sugestões da IA!", "success");
      setShowSmartDraftInput(false);
    } catch (error: any) {
      console.error(error);
      showToast("Erro ao usar IA. Preenchendo com rascunho padrão.", "error");
      // Fallback
      setNewTitle(smartDraftPrompt);
      setNewDescription("Gerado a partir da ideia: " + smartDraftPrompt);
    } finally {
      setIsSmartDraftLoading(false);
    }
  };

  // Refine Description with Gemini
  const handleRefineDescription = async (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj || !proj.description) {
      showToast("O projeto precisa ter uma descrição para ser refinada.", "error");
      return;
    }

    setIsRefiningDescription(true);
    setAiError(null);

    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refine-description",
          projectTitle: proj.title,
          projectDescription: proj.description,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro de processamento da IA");
      }

      const data = await response.json();
      
      const updated = projects.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            description: data.refinedDescription,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });

      saveProjects(updated);
      showToast("Descrição polida e otimizada pela IA com sucesso!");
    } catch (err: any) {
      console.error(err);
      showToast("Falha ao refinar descrição com a IA.", "error");
    } finally {
      setIsRefiningDescription(false);
    }
  };

  // Generate Roadmap with Gemini
  const handleGenerateRoadmap = async (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;

    setIsGeneratingRoadmap(true);
    setAiError(null);

    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-roadmap",
          projectTitle: proj.title,
          projectDescription: proj.description,
          tags: proj.tags,
          aiPersona: aiPersona,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha na geração do roadmap.");
      }

      const data = await response.json();

      const updated = projects.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            aiRoadmap: {
              tasks: data.tasks || [],
              technologies: data.technologies || [],
              difficulty: data.difficulty || "Médio",
              timeEstimate: data.timeEstimate || "N/A",
              copilotTips: data.copilotTips || "",
              generatedAt: new Date().toISOString(),
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });

      saveProjects(updated);
      showToast("Cronograma e mentor de projeto criados pela IA!");
    } catch (err: any) {
      console.error(err);
      showToast("Não foi possível gerar o cronograma com IA.", "error");
      setAiError("Erro ao se conectar à IA. Verifique sua chave de API nas configurações.");
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  // Import AI suggested tasks to actual tasks
  const handleImportAiTasks = (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj || !proj.aiRoadmap || !proj.aiRoadmap.tasks) return;

    const aiTasks: Task[] = proj.aiRoadmap.tasks.map((t, idx) => ({
      id: generateUniqueId(`ai-task-${idx}`),
      title: t.title,
      completed: false,
    }));

    const updated = projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: [...p.tasks, ...aiTasks],
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    saveProjects(updated);
    showToast(`${aiTasks.length} tarefas da IA importadas para o seu checklist!`);
    setDrawerTab("tasks");
  };

  // Update simple project fields directly
  const handleUpdateField = (projectId: string, field: keyof Project, value: any) => {
    const updated = projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          [field]: value,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    saveProjects(updated);
  };

  // Update specific link
  const handleUpdateLink = (projectId: string, linkKey: keyof Project["links"], value: string) => {
    const updated = projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          links: {
            ...p.links,
            [linkKey]: value || undefined,
          },
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    saveProjects(updated);
  };

  // Task Actions
  const handleAddTask = (projectId: string) => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: generateUniqueId("task"),
      title: newTaskTitle.trim(),
      completed: false,
    };

    const updated = projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: [...p.tasks, newTask],
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    saveProjects(updated);
    setNewTaskTitle("");
  };

  const handleToggleTask = (projectId: string, taskId: string) => {
    const updated = projects.map((p) => {
      if (p.id === projectId) {
        const updatedTasks = p.tasks.map((t) => {
          if (t.id === taskId) {
            return { ...t, completed: !t.completed };
          }
          return t;
        });
        return {
          ...p,
          tasks: updatedTasks,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    saveProjects(updated);
  };

  const handleDeleteTask = (projectId: string, taskId: string) => {
    const updated = projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: p.tasks.filter((t) => t.id !== taskId),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    saveProjects(updated);
  };

  // Delete Project
  const handleDeleteProject = (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;

    if (confirm(`Tem certeza de que deseja excluir o projeto "${proj.title}"?`)) {
      const updated = projects.filter((p) => p.id !== projectId);
      saveProjects(updated);
      setIsDetailsDrawerOpen(false);
      setSelectedProjectId(null);
      showToast(`Projeto "${proj.title}" excluído.`);
    }
  };

  // Move Project Status (Kanban actions)
  const handleMoveStatus = (projectId: string, newStatus: Project["status"]) => {
    handleUpdateField(projectId, "status", newStatus);
    showToast(`Status atualizado para: ${getStatusLabel(newStatus)}`, "info");
  };

  // Import / Export JSON Backup
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projects, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `project-hub-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Backup exportado com sucesso!");
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            // Basic validation
            const isValid = parsed.every((p) => p.id && p.title);
            if (isValid) {
              saveProjects(parsed);
              showToast("Backup importado com sucesso! Seus dados foram sincronizados.");
            } else {
              showToast("Formato de arquivo inválido.", "error");
            }
          } else {
            showToast("O backup precisa ser uma lista de projetos.", "error");
          }
        } catch (error) {
          showToast("Erro ao ler o arquivo de backup.", "error");
        }
      };
    }
  };

  // System Settings Actions
  const handleSaveSettings = (name: string, persona: string, view: "bento" | "kanban" | "list", themeValue: "light" | "dark") => {
    const cleanName = name.trim() || "Desenvolvedor";
    setUserName(cleanName);
    setAiPersona(persona);
    setDefaultViewMode(view);
    setViewMode(view);
    setTheme(themeValue);
    localStorage.setItem("project_hub_username", cleanName);
    localStorage.setItem("project_hub_ai_persona", persona);
    localStorage.setItem("project_hub_default_view", view);
    localStorage.setItem("project_hub_theme", themeValue);
    showToast("Configurações do sistema salvas com sucesso!", "success");
    setIsSettingsModalOpen(false);
  };

  const handleResetSystem = () => {
    if (confirm("ATENÇÃO: Isso irá apagar todos os seus projetos e redefinir o sistema para o estado original de fábrica. Deseja continuar?")) {
      localStorage.removeItem("project_hub_projects");
      localStorage.removeItem("project_hub_username");
      localStorage.removeItem("project_hub_ai_persona");
      localStorage.removeItem("project_hub_default_view");
      localStorage.removeItem("project_hub_theme");
      setProjects(INITIAL_PROJECTS);
      setUserName("Desenvolvedor");
      setAiPersona("mentor");
      setViewMode("bento");
      setDefaultViewMode("bento");
      setTheme("light");
      showToast("Sistema redefinido com sucesso!", "info");
      setIsSettingsModalOpen(false);
    }
  };

  // Helper Labels & Styles
  const getStatusLabel = (status: Project["status"]) => {
    switch (status) {
      case "planning": return "Planejamento";
      case "in_progress": return "Desenvolvimento";
      case "completed": return "Concluído";
      case "archived": return "Arquivado";
    }
  };

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "planning": return "bg-amber-50 text-amber-700 border-amber-200/50";
      case "in_progress": return "bg-blue-50 text-blue-700 border-blue-200/50";
      case "completed": return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
      case "archived": return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getSourceBadge = (source: Project["source"]) => {
    if (source === "ai_studio") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
          <Sparkles className="w-2.5 h-2.5 text-indigo-500 animate-pulse" />
          AI Studio
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
        <Globe className="w-2.5 h-2.5 text-slate-500" />
        Externo
      </span>
    );
  };

  // Helper for relative updated time label
  const formatRelativeTime = (isoString: string) => {
    if (!isoString) return "recente";
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 15) return "agora mesmo";
      if (diffSecs < 60) return `há ${diffSecs}s`;
      if (diffMins < 60) return `há ${diffMins} min`;
      if (diffHours < 24) return `há ${diffHours}h`;
      if (diffDays === 1) return "ontem";
      if (diffDays < 7) return `há ${diffDays} dias`;
      
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch {
      return "recente";
    }
  };

  // Filter & Search computation sorted by updatedAt descending
  const filteredProjects = projects
    .filter((p) => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" ? true : p.status === statusFilter;
      const matchesSource = sourceFilter === "all" ? true : p.source === sourceFilter;
      const matchesTag = selectedTag ? p.tags.includes(selectedTag) : true;

      return matchesSearch && matchesStatus && matchesSource && matchesTag;
    })
    .sort((a, b) => {
      const getTimeSafe = (dateStr: string | undefined | null) => {
        if (!dateStr) return 0;
        try {
          const t = new Date(dateStr).getTime();
          return isNaN(t) ? 0 : t;
        } catch {
          return 0;
        }
      };
      
      const dateA = getTimeSafe(a.updatedAt || a.createdAt);
      const dateB = getTimeSafe(b.updatedAt || b.createdAt);
      
      if (dateB !== dateA) {
        return dateB - dateA;
      }
      
      // Fallback a data de criacao
      const createA = getTimeSafe(a.createdAt);
      const createB = getTimeSafe(b.createdAt);
      return createB - createA;
    });

  // Calculate generic statistics
  const totalProjectsCount = projects.length;
  const inProgressCount = projects.filter((p) => p.status === "in_progress").length;
  const completedCount = projects.filter((p) => p.status === "completed").length;
  const planningCount = projects.filter((p) => p.status === "planning").length;

  const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0);
  const completedTasks = projects.reduce((acc, p) => acc + p.tasks.filter((t) => t.completed).length, 0);
  const globalProgressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Extract unique tags
  const allTags = Array.from(new Set(projects.flatMap((p) => p.tags)));

  // Calculate task percentage for single project
  const getProjectProgress = (p: Project) => {
    if (p.tasks.length === 0) return 0;
    const comp = p.tasks.filter((t) => t.completed).length;
    return Math.round((comp / p.tasks.length) * 100);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      
      {/* Dynamic Alert Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
          >
            <div className={`shadow-sm rounded-lg border p-3 flex items-center justify-between backdrop-blur-md bg-white/95 ${
              notification.type === "success" 
                ? "border-emerald-100 text-emerald-800" 
                : notification.type === "error" 
                ? "border-red-100 text-red-800" 
                : "border-blue-100 text-blue-800"
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  notification.type === "success" ? "bg-emerald-500" : notification.type === "error" ? "bg-red-500" : "bg-blue-500"
                }`} />
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header */}
      <header className="border-b border-slate-100 bg-white/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 font-sans flex items-center gap-1.5">
              Project Hub
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-normal text-slate-500 font-mono">
                Minimalist
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Olá, <span className="text-slate-800 font-bold">{userName}</span>! Pronto para organizar seus fluxos hoje?
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Export/Import triggers */}
          <div className="flex items-center bg-slate-50 border border-slate-200/60 rounded-lg p-1">
            <button
              onClick={handleExportBackup}
              title="Exportar backup dos projetos"
              className="p-1.5 hover:bg-white rounded-md text-slate-500 hover:text-slate-900 transition-all flex items-center gap-1 text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Exportar</span>
            </button>
            <label
              title="Importar backup de projetos"
              className="p-1.5 hover:bg-white rounded-md text-slate-500 hover:text-slate-900 transition-all flex items-center gap-1 text-xs font-medium cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Importar</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>

          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            title={theme === "light" ? "Mudar para Modo Escuro" : "Mudar para Modo Claro"}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-all border border-slate-200/60 flex items-center justify-center shadow-sm"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 text-slate-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </button>

          <button
            onClick={() => {
              setTempUserName(userName);
              setTempAiPersona(aiPersona);
              setTempDefaultViewMode(defaultViewMode);
              setTempTheme(theme);
              setIsSettingsModalOpen(true);
            }}
            title="Configurações do Sistema"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-all border border-slate-200/60 flex items-center gap-1.5 text-xs font-medium"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Configurar</span>
          </button>

          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] transition-all px-3.5 py-1.5 rounded-lg text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Projeto</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* Statistics & Overview Dashboard Widget */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-100/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <p className="text-xs font-mono text-slate-400">Total Geral</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-semibold text-slate-800">{totalProjectsCount}</span>
              <span className="text-[10px] text-slate-400">projetos</span>
            </div>
          </div>
          
          <div className="bg-white border border-slate-100/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono text-slate-400">Em Desenvolvimento</p>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-semibold text-blue-600">{inProgressCount}</span>
              <span className="text-[10px] text-slate-400">ativos</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <p className="text-xs font-mono text-slate-400">Em Planejamento</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-semibold text-amber-600">{planningCount}</span>
              <span className="text-[10px] text-slate-400">ideias</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <p className="text-xs font-mono text-slate-400">Concluídos</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-semibold text-emerald-600">{completedCount}</span>
              <span className="text-[10px] text-slate-400">entregues</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100/80 rounded-xl p-4 shadow-sm col-span-2 md:col-span-1 flex flex-col justify-between">
            <p className="text-xs font-mono text-slate-400 flex items-center gap-1">
              Progresso Geral
              <TrendingUp className="w-3 h-3 text-emerald-500" />
            </p>
            <div className="mt-2">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-2xl font-semibold text-slate-800">{globalProgressPercent}%</span>
                <span className="text-[9px] text-slate-400 font-mono">{completedTasks}/{totalTasks} tarefas</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500 ease-out"
                  style={{ width: `${globalProgressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Filter Navigation & Search Bar */}
        <section className="bg-white border border-slate-100 shadow-sm rounded-xl p-4 flex flex-col gap-4">
          
          {/* Top Line: Search and View Mode buttons */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por título, descrição ou tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-mono"
                >
                  limpar
                </button>
              )}
            </div>

            {/* Quick Filter Selects */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Source filter */}
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-2.5 rounded-lg text-xs focus:outline-none focus:border-slate-400"
              >
                <option value="all">Todas Fontes</option>
                <option value="ai_studio">AI Studio</option>
                <option value="external">Projetos Externos</option>
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-2.5 rounded-lg text-xs focus:outline-none focus:border-slate-400"
              >
                <option value="all">Todos Status</option>
                <option value="planning">Em Planejamento</option>
                <option value="in_progress">Em Desenvolvimento</option>
                <option value="completed">Concluídos</option>
                <option value="archived">Arquivados</option>
              </select>

              <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

              {/* View mode toggle buttons */}
              <div className="bg-slate-100 p-0.5 rounded-lg flex items-center">
                <button
                  onClick={() => setViewMode("bento")}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === "bento" 
                      ? "bg-white text-slate-900 shadow-xs" 
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Visualização Bento Grid"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === "kanban" 
                      ? "bg-white text-slate-900 shadow-xs" 
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Visualização Quadro Kanban"
                >
                  <Layers2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === "list" 
                      ? "bg-white text-slate-900 shadow-xs" 
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Visualização em Lista"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>

          {/* Bottom Line: Tags Cloud filtration */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-50">
              <span className="text-[10px] font-mono text-slate-400 mr-1.5 uppercase tracking-wider">Filtrar por Tag:</span>
              <button
                onClick={() => setSelectedTag(null)}
                className={`text-xs px-2 py-1 rounded-md transition-all ${
                  !selectedTag 
                    ? "bg-slate-950 text-white font-medium" 
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                Todas
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`text-xs px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
                    selectedTag === tag 
                      ? "bg-slate-950 text-white font-medium" 
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <Tag className="w-2.5 h-2.5 opacity-60" />
                  {tag}
                </button>
              ))}
            </div>
          )}

        </section>

        {/* Dynamic Project Views Container */}
        <section className="flex-1">
          {filteredProjects.length === 0 ? (
            <div className="bg-white border border-slate-100/80 shadow-sm rounded-xl py-12 px-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-100">
                <FolderDot className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Nenhum projeto encontrado</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Experimente ajustar os filtros de busca ou crie um novo projeto para começar.
              </p>
              <button
                onClick={() => setIsNewProjectModalOpen(true)}
                className="mt-4 text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all"
              >
                Criar Primeiro Projeto
              </button>
            </div>
          ) : (
            <>
              {/* BENTO GRID VIEW */}
              {viewMode === "bento" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((p) => {
                    const progress = getProjectProgress(p);
                    return (
                      <motion.div
                        layout
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white border border-slate-200/50 hover:border-slate-300 rounded-xl shadow-xs hover:shadow-sm transition-all flex flex-col h-full group"
                      >
                        {/* Card Header */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              {getSourceBadge(p.source)}
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${getStatusColor(p.status)}`}>
                                {getStatusLabel(p.status)}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                setSelectedProjectId(p.id);
                                setDrawerTab("general");
                                setIsDetailsDrawerOpen(true);
                              }}
                              className="text-left block"
                            >
                              <h3 className="font-semibold text-slate-800 hover:text-slate-950 text-base leading-tight group-hover:translate-x-0.5 transition-transform duration-200 flex items-center gap-1">
                                {p.title}
                                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                              </h3>
                            </button>

                            <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                              {p.description || "Nenhuma descrição fornecida."}
                            </p>
                          </div>

                          <div className="mt-4">
                            {/* Tags cloud */}
                            {p.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {p.tags.map((t) => (
                                  <span key={t} className="text-[10px] bg-slate-50 text-slate-500 border border-slate-200/40 px-1.5 py-0.5 rounded">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Task progression slider */}
                            {p.tasks.length > 0 ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                                  <span>Progresso</span>
                                  <span>{progress}% ({p.tasks.filter(t => t.completed).length}/{p.tasks.length})</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-slate-800 h-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                                <span>Checklist vazio</span>
                                <button
                                  onClick={() => {
                                    setSelectedProjectId(p.id);
                                    setDrawerTab("tasks");
                                    setIsDetailsDrawerOpen(true);
                                  }}
                                  className="text-slate-600 hover:underline flex items-center gap-0.5 font-sans"
                                >
                                  + Criar metas
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/50 flex items-center justify-between rounded-b-xl text-slate-400">
                          <div className="flex items-center gap-2">
                            {p.links.github && (
                              <a href={p.links.github} target="_blank" rel="noreferrer" title="Ver código no GitHub" className="hover:text-slate-900 transition-colors">
                                <Github className="w-4 h-4" />
                              </a>
                            )}
                            {p.links.deploy && (
                              <a href={p.links.deploy} target="_blank" rel="noreferrer" title="Acessar deploy online" className="hover:text-slate-900 transition-colors">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            {p.links.workspace && (
                              <a href={p.links.workspace} target="_blank" rel="noreferrer" title="Workspace AI Studio" className="hover:text-indigo-600 transition-colors flex items-center gap-0.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                              </a>
                            )}
                            {(p.links.github || p.links.deploy || p.links.workspace) && <span className="text-slate-200 text-xs">|</span>}
                            <span className="text-[10px] font-mono text-slate-400" title={`Atualizado em: ${new Date(p.updatedAt).toLocaleString()}`}>
                              {formatRelativeTime(p.updatedAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {p.aiRoadmap && (
                              <span className="flex items-center gap-0.5 text-[10px] text-indigo-600 font-mono bg-indigo-50/70 border border-indigo-100/60 px-1.5 py-0.5 rounded">
                                <Sparkle className="w-2.5 h-2.5" />
                                IA Mentor
                              </span>
                            )}
                            
                            <button
                              onClick={() => {
                                setSelectedProjectId(p.id);
                                setDrawerTab("general");
                                setIsDetailsDrawerOpen(true);
                              }}
                              className="text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors"
                            >
                              Ver Detalhes
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* KANBAN BOARD VIEW */}
              {viewMode === "kanban" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  
                  {/* Status Column generator */}
                  {(["planning", "in_progress", "completed"] as Project["status"][]).map((colStatus) => {
                    const colProjects = filteredProjects.filter((p) => p.status === colStatus);
                    
                    return (
                      <div key={colStatus} className="bg-slate-50 border border-slate-200/50 rounded-xl p-4 flex flex-col gap-4 min-h-[500px]">
                        
                        {/* Column Header */}
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800">
                              {getStatusLabel(colStatus)}
                            </span>
                            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-mono font-semibold">
                              {colProjects.length}
                            </span>
                          </div>
                        </div>

                        {/* Column Cards */}
                        <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                          {colProjects.length === 0 ? (
                            <div className="border border-dashed border-slate-200/80 rounded-lg py-8 text-center text-xs text-slate-400 font-mono">
                              Sem projetos
                            </div>
                          ) : (
                            colProjects.map((p) => (
                              <motion.div
                                layout
                                layoutId={p.id}
                                key={p.id}
                                className="bg-white border border-slate-200/60 rounded-lg p-4 shadow-2xs hover:shadow-xs transition-shadow relative group"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  {getSourceBadge(p.source)}
                                  
                                  <div className="flex items-center gap-1.5">
                                    {/* Relative time indicator, hidden when hover triggers Quick Movers */}
                                    <span className="text-[10px] font-mono text-slate-400 group-hover:hidden" title={`Atualizado em: ${new Date(p.updatedAt).toLocaleString()}`}>
                                      {formatRelativeTime(p.updatedAt)}
                                    </span>

                                    {/* Quick Arrow Movers to easily shift status */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {colStatus !== "planning" && (
                                        <button
                                          onClick={() => {
                                            const prevs: Project["status"][] = ["planning", "in_progress", "completed"];
                                            const currIdx = prevs.indexOf(colStatus);
                                            handleMoveStatus(p.id, prevs[currIdx - 1]);
                                          }}
                                          title="Mover para esquerda"
                                          className="p-1 bg-slate-50 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 border border-slate-200"
                                        >
                                          <ChevronRight className="w-3 h-3 rotate-180" />
                                        </button>
                                      )}
                                      {colStatus !== "completed" && (
                                        <button
                                          onClick={() => {
                                            const nexts: Project["status"][] = ["planning", "in_progress", "completed"];
                                            const currIdx = nexts.indexOf(colStatus);
                                            handleMoveStatus(p.id, nexts[currIdx + 1]);
                                          }}
                                          title="Mover para direita"
                                          className="p-1 bg-slate-50 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 border border-slate-200"
                                        >
                                          <ChevronRight className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    setSelectedProjectId(p.id);
                                    setDrawerTab("general");
                                    setIsDetailsDrawerOpen(true);
                                  }}
                                  className="text-left w-full"
                                >
                                  <h4 className="font-semibold text-slate-800 text-sm hover:underline">
                                    {p.title}
                                  </h4>
                                </button>

                                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-normal">
                                  {p.description}
                                </p>

                                {/* Mini tasks summary */}
                                {p.tasks.length > 0 && (
                                  <div className="mt-3 flex items-center justify-between">
                                    <div className="w-1/2 bg-slate-100 h-1 rounded-full overflow-hidden">
                                      <div 
                                        className="bg-slate-800 h-full"
                                        style={{ width: `${getProjectProgress(p)}%` }}
                                      />
                                    </div>
                                    <span className="text-[9px] font-mono text-slate-400">
                                      {p.tasks.filter(t => t.completed).length}/{p.tasks.length}
                                    </span>
                                  </div>
                                )}
                              </motion.div>
                            ))
                          )}
                        </div>

                      </div>
                    );
                  })}

                </div>
              )}

              {/* SLICK LIST VIEW */}
              {viewMode === "list" && (
                <div className="bg-white border border-slate-200/50 rounded-xl shadow-xs overflow-hidden">
                  <div className="min-w-full divide-y divide-slate-100">
                    {/* List Header */}
                    <div className="bg-slate-50 px-6 py-3 flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      <div className="w-2/5 font-semibold">Projeto</div>
                      <div className="w-1/5 font-semibold">Status</div>
                      <div className="w-1/5 font-semibold">Progresso</div>
                      <div className="w-1/5 font-semibold text-right">Ações</div>
                    </div>

                    {/* List Body */}
                    <div className="divide-y divide-slate-100">
                      {filteredProjects.map((p) => {
                        const progress = getProjectProgress(p);
                        return (
                          <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                            
                            {/* Title & Info */}
                            <div className="w-2/5 pr-4">
                              <div className="flex items-center gap-2 mb-1">
                                {getSourceBadge(p.source)}
                                {p.tags.slice(0, 2).map((t) => (
                                  <span key={t} className="text-[9px] font-mono bg-slate-50 border border-slate-100 text-slate-400 px-1 rounded">
                                    {t}
                                  </span>
                                ))}
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedProjectId(p.id);
                                  setDrawerTab("general");
                                  setIsDetailsDrawerOpen(true);
                                }}
                                className="text-left"
                              >
                                <span className="font-semibold text-slate-800 text-sm hover:underline block">
                                  {p.title}
                                </span>
                              </button>
                              <span className="text-[10px] font-mono text-slate-400 block mt-0.5" title={`Atualizado em: ${new Date(p.updatedAt).toLocaleString()}`}>
                                Alterado {formatRelativeTime(p.updatedAt)}
                              </span>
                            </div>

                            {/* Status */}
                            <div className="w-1/5">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${getStatusColor(p.status)}`}>
                                {getStatusLabel(p.status)}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-1/5 pr-4">
                              {p.tasks.length > 0 ? (
                                <div className="space-y-1">
                                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-slate-800 h-full"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {progress}% ({p.tasks.filter(t => t.completed).length}/{p.tasks.length})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-mono">Sem tarefas</span>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="w-1/5 flex items-center justify-end gap-3 text-slate-400">
                              {p.links.github && (
                                <a href={p.links.github} target="_blank" rel="noreferrer" title="Ver código" className="hover:text-slate-900">
                                  <Github className="w-3.5 h-3.5" />
                                </a>
                              )}
                              {p.links.deploy && (
                                <a href={p.links.deploy} target="_blank" rel="noreferrer" title="Acessar Deploy" className="hover:text-slate-900">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              
                              <button
                                onClick={() => {
                                  setSelectedProjectId(p.id);
                                  setDrawerTab("general");
                                  setIsDetailsDrawerOpen(true);
                                }}
                                className="text-xs font-semibold text-slate-800 hover:underline"
                              >
                                Gerenciar
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>
              )}
            </>
          )}
        </section>

      </main>

      {/* Footer Branding and clock */}
      <footer className="border-t border-slate-100 bg-white py-6 px-6 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>Project Hub © 2026. Feito com simplicidade técnica.</p>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span>Sincronizado via Local Storage</span>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* DIALOG: NEW PROJECT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isNewProjectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewProjectModalOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white border border-slate-200/80 rounded-xl shadow-lg max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 font-sans">
                    Criar Novo Projeto
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Preencha os dados ou use a assistente inteligente
                  </p>
                </div>
                <button
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Scroller Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                
                {/* AI SMART DRAFT TOGGLE */}
                <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowSmartDraftInput(!showSmartDraftInput)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-bounce" />
                      <span>{showSmartDraftInput ? "Cancelar Rascunho IA" : "Usar Rascunho Inteligente com IA"}</span>
                    </button>
                  </div>

                  {showSmartDraftInput && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[10px] text-indigo-600/80 leading-normal">
                        Digite sua ideia simples em poucas palavras. A IA criará uma descrição polida e sugerirá tags para preencher o formulário.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ex: Plataforma de aulas de surf integrada ao calendário"
                          value={smartDraftPrompt}
                          onChange={(e) => setSmartDraftPrompt(e.target.value)}
                          className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-400"
                        />
                        <button
                          type="button"
                          onClick={handleSmartDraft}
                          disabled={isSmartDraftLoading}
                          className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isSmartDraftLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkle className="w-3 h-3" />
                          )}
                          <span>Estruturar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Standard Form fields */}
                <form id="new-project-form" onSubmit={handleCreateProject} className="space-y-4">
                  
                  {/* Title field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Título do Projeto *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Meu Aplicativo de Notas"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  {/* Description Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Descrição / Ideia Principal
                    </label>
                    <textarea
                      placeholder="Breve resumo do propósito deste projeto..."
                      rows={3}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  {/* Source and Status selectors (Flex box) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Origem do Projeto
                      </label>
                      <select
                        value={newSource}
                        onChange={(e) => setNewSource(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-slate-400"
                      >
                        <option value="external">Projeto Externo</option>
                        <option value="ai_studio">Este Workspace (AI Studio)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Status Inicial
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-slate-400"
                      >
                        <option value="planning">Em Planejamento</option>
                        <option value="in_progress">Em Desenvolvimento</option>
                        <option value="completed">Concluído</option>
                      </select>
                    </div>
                  </div>

                  {/* Tags input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tags / Tecnologias (separadas por vírgula)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Next.js, API, Tailwind, Python"
                      value={newTagsString}
                      onChange={(e) => setNewTagsString(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-mono text-xs"
                    />
                  </div>

                  {/* Links (Group accordion-lite) */}
                  <div className="border border-slate-100 rounded-lg p-3 space-y-3">
                    <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">Links de Apoio (Opcional)</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-mono">Repo:</span>
                        <input
                          type="url"
                          placeholder="Link do GitHub"
                          value={newGithub}
                          onChange={(e) => setNewGithub(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-14 pr-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
                        />
                      </div>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-mono">Live:</span>
                        <input
                          type="url"
                          placeholder="Link de Produção"
                          value={newDeploy}
                          onChange={(e) => setNewDeploy(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                </form>

              </div>

              {/* Modal Footer Controls */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="new-project-form"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  Criar Projeto
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DRAWER SLIDE-OVER: PROJECT DETAILS AND CO-PILOT CHAT */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isDetailsDrawerOpen && selectedProject && (
          <div className="fixed inset-0 z-40 overflow-hidden">
            
            {/* Drawer Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsDrawerOpen(false)}
              className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs transition-opacity"
            />

            {/* Slide over layout panel */}
            <div className="absolute inset-y-0 right-0 max-w-full pl-10 flex">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-screen max-w-xl bg-white border-l border-slate-200/80 shadow-2xl flex flex-col h-full"
              >
                
                {/* Header detail */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {getSourceBadge(selectedProject.source)}
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getStatusColor(selectedProject.status)}`}>
                        {getStatusLabel(selectedProject.status)}
                      </span>
                    </div>

                    <h2 className="text-base font-semibold text-slate-900 truncate font-sans">
                      {selectedProject.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2.5 ml-4">
                    <button
                      onClick={() => handleDeleteProject(selectedProject.id)}
                      title="Excluir Projeto"
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsDetailsDrawerOpen(false)}
                      className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Drawer Menu Tabs Navigation */}
                <div className="flex border-b border-slate-100 bg-slate-50/50 px-4">
                  <button
                    onClick={() => setDrawerTab("general")}
                    className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                      drawerTab === "general"
                        ? "border-slate-900 text-slate-900 font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Info className="w-3.5 h-3.5" />
                    Geral
                  </button>

                  <button
                    onClick={() => setDrawerTab("tasks")}
                    className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                      drawerTab === "tasks"
                        ? "border-slate-900 text-slate-900 font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Metas
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-full font-mono">
                      {selectedProject.tasks.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setDrawerTab("notes")}
                    className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                      drawerTab === "notes"
                        ? "border-slate-900 text-slate-900 font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Anotações
                  </button>

                  <button
                    onClick={() => setDrawerTab("ai")}
                    className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 relative ${
                      drawerTab === "ai"
                        ? "border-indigo-600 text-indigo-700 font-bold"
                        : "border-transparent text-indigo-600/80 hover:text-indigo-900"
                    }`}
                  >
                    <BrainCircuit className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    Mentor IA
                    {selectedProject.aiRoadmap && (
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full absolute top-2 right-1" />
                    )}
                  </button>
                </div>

                {/* Tab Content Panels */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* TAB 1: GENERAL INFO PANEL */}
                  {drawerTab === "general" && (
                    <div className="space-y-5 animate-fadeIn">
                      
                      {/* Project Title and Source Edit */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Título do Projeto
                          </label>
                          <input
                            type="text"
                            value={selectedProject.title}
                            onChange={(e) => handleUpdateField(selectedProject.id, "title", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-slate-400"
                          />
                        </div>

                        {/* Status Select inside details */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                              Status Atual
                            </label>
                            <select
                              value={selectedProject.status}
                              onChange={(e) => handleUpdateField(selectedProject.id, "status", e.target.value as any)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
                            >
                              <option value="planning">Em Planejamento</option>
                              <option value="in_progress">Em Desenvolvimento</option>
                              <option value="completed">Concluído</option>
                              <option value="archived">Arquivado</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                              Provedor / Origem
                            </label>
                            <select
                              value={selectedProject.source}
                              onChange={(e) => handleUpdateField(selectedProject.id, "source", e.target.value as any)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
                            >
                              <option value="external">Externo</option>
                              <option value="ai_studio">AI Studio (Daqui)</option>
                            </select>
                          </div>
                        </div>

                        {/* Description Section with AI Polisher */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                              Sobre o Projeto
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRefineDescription(selectedProject.id)}
                              disabled={isRefiningDescription || !selectedProject.description}
                              className="text-[10px] font-semibold text-indigo-700 hover:text-indigo-900 transition-colors flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100/60 px-2 py-0.5 rounded-md disabled:opacity-50"
                            >
                              {isRefiningDescription ? (
                                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              ) : (
                                <Sparkles className="w-2.5 h-2.5" />
                              )}
                              Polir com IA
                            </button>
                          </div>
                          
                          <textarea
                            value={selectedProject.description}
                            onChange={(e) => handleUpdateField(selectedProject.id, "description", e.target.value)}
                            rows={4}
                            placeholder="Descreva o escopo e o que torna este projeto único..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-700 leading-relaxed focus:outline-none focus:border-slate-400"
                          />
                        </div>

                        {/* Editable Tag cloud list */}
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Tags e Tecnologias (separadas por vírgulas)
                          </label>
                          <input
                            type="text"
                            value={selectedProject.tags.join(", ")}
                            onChange={(e) => {
                              const arr = e.target.value.split(",").map(t => t.trim()).filter(t => t.length > 0);
                              handleUpdateField(selectedProject.id, "tags", arr);
                            }}
                            placeholder="Next.js, Tailwind, IA"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400 font-mono"
                          />
                          <p className="text-[9px] text-slate-400 mt-1">Exiba-os separando as tecnologias com uma vírgula simples.</p>
                        </div>

                        {/* SUPPORT LINKS EDIT */}
                        <div className="border border-slate-100 rounded-lg p-4 space-y-3">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Links de Apoio e Desenvolvimento</span>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-400 w-16">GitHub:</span>
                              <input
                                type="url"
                                value={selectedProject.links.github || ""}
                                onChange={(e) => handleUpdateLink(selectedProject.id, "github", e.target.value)}
                                placeholder="https://github.com/exemplo"
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-slate-400"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-400 w-16">Deploy:</span>
                              <input
                                type="url"
                                value={selectedProject.links.deploy || ""}
                                onChange={(e) => handleUpdateLink(selectedProject.id, "deploy", e.target.value)}
                                placeholder="https://meuprojeto.com"
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-slate-400"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-400 w-16">Workspace:</span>
                              <input
                                type="url"
                                value={selectedProject.links.workspace || ""}
                                onChange={(e) => handleUpdateLink(selectedProject.id, "workspace", e.target.value)}
                                placeholder="Link do AI Studio Workspace"
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-slate-400"
                              />
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* TAB 2: TASKS CHECKLISTS */}
                  {drawerTab === "tasks" && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800">Checklist de Metas</h3>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Etapas necessárias para entregar o projeto</p>
                        </div>
                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                          {getProjectProgress(selectedProject)}% concluído
                        </span>
                      </div>

                      {/* Add task bar input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Adicionar nova meta ou tarefa..."
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddTask(selectedProject.id);
                          }}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                        />
                        <button
                          onClick={() => handleAddTask(selectedProject.id)}
                          className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                        >
                          Adicionar
                        </button>
                      </div>

                      {/* Checklist Loop */}
                      <div className="space-y-2 mt-4">
                        {selectedProject.tasks.length === 0 ? (
                          <div className="border border-dashed border-slate-100 rounded-lg py-8 text-center text-xs text-slate-400">
                            Nenhuma tarefa cadastrada. Adicione metas acima ou gere um roadmap inteligente com a IA!
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {selectedProject.tasks.map((task) => (
                              <div
                                key={task.id}
                                className="flex items-center justify-between py-2.5 px-1 group hover:bg-slate-50/50 rounded-lg transition-colors"
                              >
                                <button
                                  onClick={() => handleToggleTask(selectedProject.id, task.id)}
                                  className="flex items-center gap-3 text-left flex-1"
                                >
                                  {task.completed ? (
                                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Circle className="w-4.5 h-4.5 text-slate-300 shrink-0" />
                                  )}
                                  <span className={`text-xs ${task.completed ? "line-through text-slate-400" : "text-slate-700 font-medium"}`}>
                                    {task.title}
                                  </span>
                                </button>

                                <button
                                  onClick={() => handleDeleteTask(selectedProject.id, task.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 text-slate-400 hover:text-red-500 rounded transition-all"
                                  title="Excluir tarefa"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: NOTES SCRATCHPAD */}
                  {drawerTab === "notes" && (
                    <div className="space-y-4 animate-fadeIn h-full flex flex-col">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">Bloco de Notas</h3>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Rascunhos livres e anotações rápidas para este projeto (Salva automaticamente)</p>
                      </div>

                      <textarea
                        value={selectedProject.notes || ""}
                        onChange={(e) => handleUpdateField(selectedProject.id, "notes", e.target.value)}
                        placeholder="Escreva livremente aqui... ideias, anotações de reuniões, comandos importantes para lembrar, dependências adicionais, etc."
                        className="w-full flex-1 min-h-[300px] bg-amber-50/30 border border-amber-100 rounded-xl p-4 text-xs font-mono text-slate-800 leading-relaxed focus:outline-none focus:border-amber-300/60 shadow-inner"
                      />
                    </div>
                  )}

                  {/* TAB 4: IA MENTOR ROADMAP CO-PILOT */}
                  {drawerTab === "ai" && (
                    <div className="space-y-5 animate-fadeIn">
                      
                      {/* IA Header */}
                      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-md relative overflow-hidden">
                        
                        {/* Background abstract shape */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
                        
                        <div className="relative z-10 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shrink-0">
                            <Sparkle className="w-4 h-4 text-white animate-pulse" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-sans">
                              Mentor Técnico IA
                            </h3>
                            <p className="text-[10px] text-slate-300 leading-normal mt-1 max-w-sm">
                              Usando o Gemini, nossa IA analisa seu projeto e traça um cronograma de tarefas sob medida, indica tecnologias modernas e fornece feedbacks valiosos de arquitetura.
                            </p>
                            
                            {!selectedProject.aiRoadmap && (
                              <button
                                type="button"
                                onClick={() => handleGenerateRoadmap(selectedProject.id)}
                                disabled={isGeneratingRoadmap}
                                className="mt-4 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all disabled:opacity-50"
                              >
                                {isGeneratingRoadmap ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Mapeando arquitetura...
                                  </>
                                ) : (
                                  <>
                                    <BrainCircuit className="w-3.5 h-3.5" />
                                    Mapear Projeto com IA
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Display error if occurred */}
                      {aiError && (
                        <div className="p-3 bg-red-50 text-red-800 text-xs rounded-lg border border-red-100 flex items-center gap-2">
                          <Info className="w-4 h-4 shrink-0 text-red-500" />
                          <p>{aiError}</p>
                        </div>
                      )}

                      {/* Gerenating state visualizer loader */}
                      {isGeneratingRoadmap && (
                        <div className="py-12 flex flex-col items-center text-center gap-3">
                          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                          <div>
                            <p className="text-xs font-semibold text-slate-800">Analisando o escopo do projeto...</p>
                            <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-normal">
                              O Gemini está analisando os requisitos e estruturando o melhor cronograma em fases, além de mapear as melhores ferramentas para desenvolvimento.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Display Roadmap output */}
                      {!isGeneratingRoadmap && selectedProject.aiRoadmap && (
                        <div className="space-y-5 animate-fadeIn">
                          
                          {/* Top Specs badge */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 border border-slate-200/50 rounded-lg p-3">
                              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Dificuldade Estimada</span>
                              <span className="text-xs font-bold text-slate-800">
                                {selectedProject.aiRoadmap.difficulty}
                              </span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200/50 rounded-lg p-3">
                              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Duração Estimada</span>
                              <span className="text-xs font-bold text-slate-800">
                                {selectedProject.aiRoadmap.timeEstimate}
                              </span>
                            </div>
                          </div>

                          {/* Roadmap phases tasks list with importing tool */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-slate-800 font-sans uppercase tracking-wider">Metas Sugeridas pela IA</h4>
                              <button
                                onClick={() => handleImportAiTasks(selectedProject.id)}
                                className="text-[10px] font-semibold text-indigo-700 hover:text-indigo-900 transition-colors bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md"
                              >
                                Importar todas para Checklist
                              </button>
                            </div>

                            <div className="space-y-2.5">
                              {selectedProject.aiRoadmap.tasks.map((task, idx) => (
                                <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-lg p-3 flex gap-3">
                                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <h5 className="text-xs font-bold text-slate-800 leading-normal">{task.title}</h5>
                                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{task.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Suggested Tech tags */}
                          {selectedProject.aiRoadmap.technologies && selectedProject.aiRoadmap.technologies.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-slate-800 font-sans uppercase tracking-wider">Pilhas e Tecnologias Recomendadas</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedProject.aiRoadmap.technologies.map((tech) => (
                                  <span key={tech} className="text-[10px] bg-indigo-50/60 border border-indigo-100/40 text-indigo-700 px-2 py-0.5 rounded font-mono">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Mentor Tips Markdown area */}
                          <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-xl p-4 space-y-2">
                            <h4 className="text-xs font-bold text-indigo-900 font-sans flex items-center gap-1">
                              <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
                              Dicas de Arquitetura do Copiloto
                            </h4>
                            <p className="text-[11px] text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                              {selectedProject.aiRoadmap.copilotTips}
                            </p>
                          </div>

                          {/* Recalculate prompt button */}
                          <div className="pt-2 border-t border-slate-100 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleGenerateRoadmap(selectedProject.id)}
                              disabled={isGeneratingRoadmap}
                              className="text-[10px] text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 font-semibold"
                            >
                              <ArrowLeftRight className="w-3 h-3" />
                              Regerar Roadmap com IA
                            </button>
                          </div>

                        </div>
                      )}

                    </div>
                  )}

                </div>

              </motion.div>
            </div>

          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CONFIGURAÇÕES DO SISTEMA */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto" id="settings-modal">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white border border-slate-100 p-6 shadow-2xl space-y-6 z-10"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 font-sans">
                        Configurações do Sistema
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Personalize suas preferências do Project Hub
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSettingsModalOpen(false)}
                    className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body Form */}
                <div className="space-y-5 text-left">
                  {/* Nome do usuário */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Nome de Usuário (Saudação)
                    </label>
                    <input
                      type="text"
                      value={tempUserName}
                      onChange={(e) => setTempUserName(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-400 shadow-sm transition-colors"
                    />
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Exibido como saudação personalizada no cabeçalho principal do aplicativo.
                    </p>
                  </div>

                  {/* Foco do Mentor Técnico (AI Persona) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Persona do Mentor Técnico IA (Gemini)
                    </label>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {/* Mentor Tradicional */}
                      <button
                        type="button"
                        onClick={() => setTempAiPersona("mentor")}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          tempAiPersona === "mentor"
                            ? "border-slate-900 bg-slate-900/5 ring-1 ring-slate-900"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-[11px] font-bold text-slate-800 block">Tradicional / PM</span>
                        <span className="text-[9px] text-slate-400 leading-normal block mt-0.5">Visão equilibrada de produto e arquitetura técnica.</span>
                      </button>

                      {/* Mentor Lean/Minimalista */}
                      <button
                        type="button"
                        onClick={() => setTempAiPersona("minimalist")}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          tempAiPersona === "minimalist"
                            ? "border-slate-900 bg-slate-900/5 ring-1 ring-slate-900"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-[11px] font-bold text-slate-800 block">Lean / MVP</span>
                        <span className="text-[9px] text-slate-400 leading-normal block mt-0.5">Foco extremo em simplicidade e agilidade, cortando excessos.</span>
                      </button>

                      {/* Scrum Master */}
                      <button
                        type="button"
                        onClick={() => setTempAiPersona("scrum")}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          tempAiPersona === "scrum"
                            ? "border-slate-900 bg-slate-900/5 ring-1 ring-slate-900"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-[11px] font-bold text-slate-800 block">Scrum Master</span>
                        <span className="text-[9px] text-slate-400 leading-normal block mt-0.5">Planejamento focado em sprints rápidas e incrementos.</span>
                      </button>

                      {/* Inovador Criativo */}
                      <button
                        type="button"
                        onClick={() => setTempAiPersona("creative")}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          tempAiPersona === "creative"
                            ? "border-slate-900 bg-slate-900/5 ring-1 ring-slate-900"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-[11px] font-bold text-slate-800 block">Inovação UX</span>
                        <span className="text-[9px] text-slate-400 leading-normal block mt-0.5">Sugere diferenciais competitivos e design de alta qualidade.</span>
                      </button>
                    </div>
                  </div>

                  {/* Visualização padrão inicial */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Visualização Inicial Padrão
                    </label>
                    <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/50">
                      {(["bento", "kanban", "list"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setTempDefaultViewMode(mode)}
                          className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all uppercase tracking-wider ${
                            tempDefaultViewMode === mode
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {mode === "bento" ? "Bento" : mode === "kanban" ? "Kanban" : "Lista"}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      A visualização preferida que será aplicada automaticamente ao carregar o Project Hub.
                    </p>
                  </div>

                  {/* Tema do Sistema */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Tema do Sistema
                    </label>
                    <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/50">
                      {([
                        { value: "light", label: "Claro", icon: Sun },
                        { value: "dark", label: "Escuro", icon: Moon }
                      ] as const).map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setTempTheme(value)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all uppercase tracking-wider ${
                            tempTheme === value
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Escolha entre o visual claro (padrão elegante) ou o modo escuro imersivo para o Project Hub.
                    </p>
                  </div>

                  {/* Seção de perigo/backup adicional */}
                  <div className="pt-4 border-t border-slate-100 space-y-2.5">
                    <label className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-wider block">
                      Gerenciamento de Sistema e Perigo
                    </label>
                    <div className="bg-red-50/40 border border-red-100 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-red-800 block">Zerar Dados de Fábrica</span>
                        <span className="text-[9px] text-red-500/80 leading-normal block mt-0.5">Apaga permanentemente todos os projetos e restaura as configurações originais.</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetSystem}
                        className="bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all shrink-0 uppercase tracking-wider"
                      >
                        Resetar Sistema
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsSettingsModalOpen(false)}
                    className="px-4 py-2 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition-colors uppercase tracking-wider"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveSettings(tempUserName, tempAiPersona, tempDefaultViewMode, tempTheme)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-lg text-xs font-bold shadow-sm transition-all uppercase tracking-wider"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
