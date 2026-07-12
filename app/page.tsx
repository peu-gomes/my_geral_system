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
  Moon,
  AlertTriangle,
  HelpCircle,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { INITIAL_PROJECTS, Project, Task } from "@/lib/initial-projects";
import { 
  getDbProjects, 
  saveDbProject, 
  deleteDbProject, 
  getDbSettings, 
  saveDbSettings, 
  seedDbProjects 
} from "@/lib/firebase-service";

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
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"bento" | "kanban" | "list">("bento");
  const [mobileTab, setMobileTab] = useState<"projects" | "stats" | "settings">("projects");
  
  // Modals & Drawers
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"general" | "tasks" | "notes" | "ai">("general");

  // New Project Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSource, setNewSource] = useState<"ai_studio" | "external">("external");
  const [newStatus, setNewStatus] = useState<"planning" | "in_progress" | "completed">("planning");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");
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
  const [showSettingsPassword, setShowSettingsPassword] = useState(false);

  // New task input (within details drawer)
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Security / Password Authentication States
  const [accessPassword, setAccessPassword] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [loginPasswordInput, setLoginPasswordInput] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // States for Settings modal password input
  const [isPasswordProtected, setIsPasswordProtected] = useState<boolean>(false);
  const [tempPassword, setTempPassword] = useState<string>("");

  // Firestore specific states
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    onConfirm: () => void | Promise<void>;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: "",
    description: "",
    actionLabel: "",
    onConfirm: () => {},
    isDanger: false,
  });

  // Load projects from Firestore with localStorage fallback
  useEffect(() => {
    async function initData() {
      setIsLoadingDb(true);
      setIsCheckingAuth(true);
      try {
        // 1. Fetch settings from Firestore
        const dbSettings = await getDbSettings();
        let loadedPassword: string | null = null;
        if (dbSettings) {
          if (dbSettings.userName) setUserName(dbSettings.userName);
          if (dbSettings.aiPersona) setAiPersona(dbSettings.aiPersona);
          if (dbSettings.defaultViewMode) {
            setDefaultViewMode(dbSettings.defaultViewMode);
            setViewMode(dbSettings.defaultViewMode);
          }
          if (dbSettings.theme) setTheme(dbSettings.theme);
          if (dbSettings.accessPassword) {
            loadedPassword = dbSettings.accessPassword;
            setAccessPassword(dbSettings.accessPassword);
            setIsPasswordProtected(true);
            setTempPassword(dbSettings.accessPassword);
          }
        } else {
          // Fallback to local storage if no settings in DB
          const savedName = localStorage.getItem("project_hub_username");
          const savedPersona = localStorage.getItem("project_hub_ai_persona");
          const savedView = localStorage.getItem("project_hub_default_view");
          const savedTheme = localStorage.getItem("project_hub_theme");
          const savedPassword = localStorage.getItem("project_hub_password");

          if (savedName) setUserName(savedName);
          if (savedPersona) setAiPersona(savedPersona);
          if (savedView) {
            setDefaultViewMode(savedView as any);
            setViewMode(savedView as any);
          }
          if (savedTheme) setTheme(savedTheme as any);
          if (savedPassword) {
            loadedPassword = savedPassword;
            setAccessPassword(savedPassword);
            setIsPasswordProtected(true);
            setTempPassword(savedPassword);
          }
        }

        // Check authentication status
        const isSessionAuth = typeof window !== "undefined" && (
          sessionStorage.getItem("project_hub_auth") === "true" ||
          localStorage.getItem("project_hub_auth") === "true"
        );

        if (!loadedPassword) {
          setIsAuthenticated(true);
        } else if (isSessionAuth) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }

        // 2. Fetch projects from Firestore
        let dbProjects = await getDbProjects();
        if (dbProjects.length === 0) {
          // No projects in Firestore yet - let's check localStorage
          const savedProjectsStr = localStorage.getItem("project_hub_projects");
          let initialSeed = INITIAL_PROJECTS;
          if (savedProjectsStr) {
            try {
              initialSeed = JSON.parse(savedProjectsStr);
            } catch (e) {
              initialSeed = INITIAL_PROJECTS;
            }
          }
          // Seed the Firestore with initial projects
          await seedDbProjects(initialSeed);
          dbProjects = initialSeed;
        }
        setProjects(dbProjects);
        localStorage.setItem("project_hub_projects", JSON.stringify(dbProjects));
      } catch (err) {
        console.error("Failed to load from Firestore, falling back to local storage:", err);
        // Fallback to local storage
        const saved = localStorage.getItem("project_hub_projects");
        const savedName = localStorage.getItem("project_hub_username");
        const savedPersona = localStorage.getItem("project_hub_ai_persona");
        const savedView = localStorage.getItem("project_hub_default_view");
        const savedTheme = localStorage.getItem("project_hub_theme");

        if (saved) {
          try {
            setProjects(JSON.parse(saved));
          } catch (e) {
            setProjects(INITIAL_PROJECTS);
          }
        } else {
          setProjects(INITIAL_PROJECTS);
        }

        if (savedName) setUserName(savedName);
        if (savedPersona) setAiPersona(savedPersona);
        if (savedView) {
          setDefaultViewMode(savedView as any);
          setViewMode(savedView as any);
        }
        if (savedTheme) setTheme(savedTheme as any);
      } finally {
        setIsLoadingDb(false);
        setIsCheckingAuth(false);
      }
    }

    initData();
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

  // Sync projects to localStorage & Firestore in the background
  const saveProjects = async (updatedProjects: Project[]) => {
    // Optimistic state update & local cache
    setProjects(updatedProjects);
    localStorage.setItem("project_hub_projects", JSON.stringify(updatedProjects));

    // Save each to Firestore in background
    try {
      setIsSyncing(true);
      await Promise.all(updatedProjects.map(p => saveDbProject(p)));
    } catch (err) {
      console.error("Firestore sync error:", err);
    } finally {
      setIsSyncing(false);
    }
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
      priority: newPriority,
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
    setNewPriority("medium");
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

    setConfirmDialog({
      isOpen: true,
      title: "Excluir Projeto",
      description: `Tem certeza de que deseja excluir o projeto "${proj.title}"? Esta ação é permanente e removerá todos os dados do projeto no banco de dados.`,
      actionLabel: "Excluir",
      isDanger: true,
      onConfirm: async () => {
        const updated = projects.filter((p) => p.id !== projectId);
        setProjects(updated);
        localStorage.setItem("project_hub_projects", JSON.stringify(updated));
        setIsDetailsDrawerOpen(false);
        setSelectedProjectId(null);
        showToast(`Projeto "${proj.title}" excluído.`);

        try {
          setIsSyncing(true);
          await deleteDbProject(projectId);
        } catch (err) {
          console.error("Failed to delete project from Firestore:", err);
        } finally {
          setIsSyncing(false);
        }
      }
    });
  };

  // Move Project Status (Kanban actions)
  const handleMoveStatus = (projectId: string, newStatus: Project["status"]) => {
    handleUpdateField(projectId, "status", newStatus);
    showToast(`Status atualizado para: ${getStatusLabel(newStatus)}`, "info");
  };

  // Drag and drop states & handlers for Kanban view
  const [isDraggingOverCol, setIsDraggingOverCol] = useState<Record<string, boolean>>({});

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData("text/plain", projectId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, colStatus: Project["status"]) => {
    e.preventDefault(); // allow drop
    if (!isDraggingOverCol[colStatus]) {
      setIsDraggingOverCol((prev) => ({ ...prev, [colStatus]: true }));
    }
  };

  const handleDragLeave = (colStatus: Project["status"]) => {
    setIsDraggingOverCol((prev) => ({ ...prev, [colStatus]: false }));
  };

  const handleDrop = (e: React.DragEvent, colStatus: Project["status"]) => {
    e.preventDefault();
    setIsDraggingOverCol((prev) => ({ ...prev, [colStatus]: false }));
    const projectId = e.dataTransfer.getData("text/plain");
    if (projectId) {
      handleMoveStatus(projectId, colStatus);
    }
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
  const handleSaveSettings = async (name: string, persona: string, view: "bento" | "kanban" | "list", themeValue: "light" | "dark") => {
    const cleanName = name.trim() || "Desenvolvedor";
    setUserName(cleanName);
    setAiPersona(persona);
    setDefaultViewMode(view);
    setViewMode(view);
    setTheme(themeValue);

    // Save Password settings
    const finalPassword = isPasswordProtected && tempPassword.trim() !== "" ? tempPassword.trim() : null;
    setAccessPassword(finalPassword);
    if (finalPassword) {
      localStorage.setItem("project_hub_password", finalPassword);
      // Since they just created/updated their own password in their session, they are authenticated
      setIsAuthenticated(true);
      sessionStorage.setItem("project_hub_auth", "true");
    } else {
      localStorage.removeItem("project_hub_password");
      localStorage.removeItem("project_hub_auth");
      sessionStorage.removeItem("project_hub_auth");
    }

    localStorage.setItem("project_hub_username", cleanName);
    localStorage.setItem("project_hub_ai_persona", persona);
    localStorage.setItem("project_hub_default_view", view);
    localStorage.setItem("project_hub_theme", themeValue);
    showToast("Configurações do sistema salvas com sucesso!", "success");
    setIsSettingsModalOpen(false);

    try {
      setIsSyncing(true);
      await saveDbSettings({
        userName: cleanName,
        aiPersona: persona,
        defaultViewMode: view,
        theme: themeValue,
        accessPassword: finalPassword
      });
    } catch (err) {
      console.error("Error saving settings to Firestore:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    
    setTimeout(() => {
      if (loginPasswordInput.trim() === accessPassword) {
        setIsAuthenticated(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("project_hub_auth", "true");
          if (rememberMe) {
            localStorage.setItem("project_hub_auth", "true");
          }
        }
        showToast(`Bem-vindo de volta!`, "success");
        setLoginPasswordInput("");
        setLoginError("");
      } else {
        setLoginError("Senha incorreta. Por favor, tente novamente.");
      }
      setIsLoggingIn(false);
    }, 600);
  };

  const handleResetSystem = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Zerar Dados de Fábrica",
      description: "ATENÇÃO: Isso irá apagar permanentemente todos os seus projetos do banco de dados e localmente, redefinindo o Project Hub para as configurações originais de fábrica. Esta ação não pode ser desfeita. Deseja continuar?",
      actionLabel: "Redefinir Tudo",
      isDanger: true,
      onConfirm: async () => {
        localStorage.removeItem("project_hub_projects");
        localStorage.removeItem("project_hub_username");
        localStorage.removeItem("project_hub_ai_persona");
        localStorage.removeItem("project_hub_default_view");
        localStorage.removeItem("project_hub_theme");
        localStorage.removeItem("project_hub_password");
        localStorage.removeItem("project_hub_auth");
        sessionStorage.removeItem("project_hub_auth");
        
        setProjects(INITIAL_PROJECTS);
        setUserName("Desenvolvedor");
        setAiPersona("mentor");
        setViewMode("bento");
        setDefaultViewMode("bento");
        setTheme("light");
        setAccessPassword(null);
        setIsPasswordProtected(false);
        setTempPassword("");
        setIsAuthenticated(true);
        showToast("Sistema redefinido com sucesso!", "info");
        setIsSettingsModalOpen(false);

        try {
          setIsSyncing(true);
          // Clear all projects in database
          for (const p of projects) {
            await deleteDbProject(p.id);
          }
          // Seed default projects to Firestore
          await seedDbProjects(INITIAL_PROJECTS);
          // Reset config in Firestore
          await saveDbSettings({
            userName: "Desenvolvedor",
            aiPersona: "mentor",
            defaultViewMode: "bento",
            theme: "light",
            accessPassword: null
          });
        } catch (err) {
          console.error("Error resetting system in Firestore:", err);
        } finally {
          setIsSyncing(false);
        }
      }
    });
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

  const getPriorityBadge = (priority?: "low" | "medium" | "high") => {
    const p = priority || "medium";
    if (p === "high") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 shadow-2xs">
          <AlertCircle className="w-2.5 h-2.5 text-rose-500" />
          Alta
        </span>
      );
    }
    if (p === "medium") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 shadow-2xs">
          <ArrowUp className="w-2.5 h-2.5 text-amber-500" />
          Média
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200/60 shadow-2xs">
        <ArrowDown className="w-2.5 h-2.5 text-slate-400" />
        Baixa
      </span>
    );
  };

  const formatLastUpdated = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      
      const today = new Date();
      const isToday = date.getDate() === today.getDate() &&
                      date.getMonth() === today.getMonth() &&
                      date.getFullYear() === today.getFullYear();
      
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      if (isToday) {
        return `Ativo hoje às ${hours}:${minutes}`;
      } else {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `Ativo em ${day}/${month} às ${hours}:${minutes}`;
      }
    } catch (e) {
      return "";
    }
  };

  // Filter & Search computation with updatedAt descending sorting
  const filteredProjects = projects
    .filter((p) => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" ? true : p.status === statusFilter;
      const matchesSource = sourceFilter === "all" ? true : p.source === sourceFilter;
      const matchesPriority = priorityFilter === "all" ? true : (p.priority || "medium") === priorityFilter;
      const matchesTag = selectedTag ? p.tags.includes(selectedTag) : true;

      return matchesSearch && matchesStatus && matchesSource && matchesPriority && matchesTag;
    })
    .sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
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

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white mx-auto shadow-md animate-bounce">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-800">Conectando ao Project Hub...</h2>
            <p className="text-[10px] text-slate-400 font-mono animate-pulse">Autenticando sessão segura...</p>
          </div>
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans relative overflow-hidden">
        {/* Subtle background decorative shapes */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-slate-900/5 blur-3xl -z-10" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-slate-200/40 blur-3xl -z-10" />

        <div className="w-full max-w-md bg-white border border-slate-200/50 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
          {/* Logo */}
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white mx-auto shadow-lg relative">
              <Layers className="w-6 h-6 animate-pulse" />
              <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-[9px] font-mono font-bold text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                <Lock className="w-2.5 h-2.5" />
                <span>Lock</span>
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
              Project Hub
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Painel de Projetos Minimalista & Integrado
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left text-pretty">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 font-sans mb-1 uppercase tracking-wide">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              Espaço Privado e Protegido
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
              Este dashboard contém informações, planos e metas de desenvolvimento confidenciais do proprietário. Insira a senha de acesso para continuar.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Senha de Acesso
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  value={loginPasswordInput}
                  onChange={(e) => {
                    setLoginPasswordInput(e.target.value);
                    if (loginError) setLoginError("");
                  }}
                  placeholder="Insira a senha secreta"
                  required
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-3.5 pr-12 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 shadow-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 flex items-center justify-center transition-colors"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="bg-red-50 text-red-700 text-xs px-3.5 py-2.5 rounded-lg border border-red-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="font-medium leading-tight">{loginError}</span>
              </div>
            )}

            {/* Remember me toggle */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-3.5 w-3.5 cursor-pointer accent-slate-900"
                />
                <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-wider select-none">
                  Lembrar neste dispositivo
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || !loginPasswordInput.trim()}
              className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-55 text-white py-3 rounded-xl text-xs font-bold shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Entrar no Painel</span>
                </>
              )}
            </button>
          </form>

          {/* Help footer */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[9px] text-slate-400 leading-normal">
              Está com dificuldades? Se você é o dono deste aplicativo e esqueceu a senha, remova o campo <code className="bg-slate-50 px-1 py-0.5 rounded text-[8px] font-mono text-slate-500">accessPassword</code> do documento <code className="bg-slate-50 px-1 py-0.5 rounded text-[8px] font-mono text-slate-500">settings/user_config</code> na sua console Firebase.
            </p>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Mobile-Only Header */}
      <header className="md:hidden border-b border-slate-100 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900">
              {mobileTab === "projects" ? "Projetos" : mobileTab === "stats" ? "Estatísticas" : "Ajustes"}
            </h1>
            <p className="text-[9px] text-slate-400 font-mono">
              Project Hub • {userName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Theme button */}
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-all border border-slate-200/50 flex items-center justify-center"
            title="Alternar Tema"
          >
            {theme === "light" ? <Moon className="w-3.5 h-3.5 text-slate-700" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
          </button>

          {/* Locked auth lock */}
          {accessPassword && (
            <button
              onClick={() => {
                setIsAuthenticated(false);
                sessionStorage.removeItem("project_hub_auth");
                localStorage.removeItem("project_hub_auth");
                showToast("Sessão bloqueada com segurança!", "info");
              }}
              className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all border border-slate-200/50 flex items-center justify-center"
              title="Bloquear"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Header (Desktop Only) */}
      <header className="hidden md:flex border-b border-slate-100 bg-white/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4 items-center justify-between gap-4">
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
              <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full ${
                isLoadingDb 
                  ? "bg-amber-50 text-amber-600 border border-amber-100" 
                  : isSyncing 
                  ? "bg-blue-50 text-blue-600 border border-blue-100" 
                  : "bg-emerald-50 text-emerald-600 border border-emerald-100"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isLoadingDb ? "bg-amber-400 animate-pulse" : isSyncing ? "bg-blue-400 animate-pulse" : "bg-emerald-400"
                }`} />
                {isLoadingDb ? "Nuvem: Conectando..." : isSyncing ? "Sincronizando..." : "Nuvem Ativa"}
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
              setIsPasswordProtected(!!accessPassword);
              setTempPassword(accessPassword || "");
              setIsSettingsModalOpen(true);
            }}
            title="Configurações do Sistema"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-all border border-slate-200/60 flex items-center gap-1.5 text-xs font-medium"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Configurar</span>
          </button>

          {accessPassword && (
            <button
              onClick={() => {
                setIsAuthenticated(false);
                sessionStorage.removeItem("project_hub_auth");
                localStorage.removeItem("project_hub_auth");
                showToast("Sessão bloqueada com segurança!", "info");
              }}
              title="Bloquear Acesso"
              className="p-2 hover:bg-slate-100 hover:bg-red-50/50 rounded-lg text-slate-500 hover:text-red-600 transition-all border border-slate-200/60 flex items-center gap-1.5 text-xs font-medium shadow-sm"
            >
              <Lock className="w-4 h-4 text-slate-400 hover:text-red-500" />
              <span className="hidden sm:inline">Bloquear</span>
            </button>
          )}

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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6 pb-28 md:pb-6">
        
        {/* Banner de aviso sobre segurança */}
        {!accessPassword && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50/70 border border-amber-200/60 text-amber-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <Lock className="w-4 h-4 animate-pulse" />
              </div>
              <div className="space-y-0.5 text-left">
                <h4 className="text-xs font-bold font-sans flex items-center gap-1.5">
                  Proteja seus Dados e Projetos!
                </h4>
                <p className="text-[10px] text-amber-600/90 font-mono leading-relaxed">
                  A tela de login está desativada porque nenhuma senha de acesso foi definida. Defina uma senha rápida nas Configurações para ocultar seus dados de visitantes e curiosos.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setTempUserName(userName);
                setTempAiPersona(aiPersona);
                setTempDefaultViewMode(defaultViewMode);
                setTempTheme(theme);
                setIsPasswordProtected(false);
                setTempPassword("");
                setIsSettingsModalOpen(true);
              }}
              className="bg-amber-800 hover:bg-amber-900 active:scale-95 text-white text-[10px] font-bold px-3.5 py-1.5 rounded-lg font-mono uppercase tracking-wider transition-all self-stretch sm:self-auto text-center cursor-pointer"
            >
              Ativar Login / Senha
            </button>
          </motion.div>
        )}
        
        {/* Statistics & Overview Dashboard Widget */}
        <section className={`${mobileTab === "stats" ? "grid" : "hidden"} md:grid grid-cols-2 md:grid-cols-5 gap-4`}>
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
        <section className={`${mobileTab === "projects" ? "flex" : "hidden"} md:flex bg-white border border-slate-100 shadow-sm rounded-xl p-4 flex-col gap-4`}>
          
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

              {/* Priority filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-2.5 rounded-lg text-xs focus:outline-none focus:border-slate-400"
              >
                <option value="all">Todas Prioridades</option>
                <option value="high">Alta Prioridade</option>
                <option value="medium">Média Prioridade</option>
                <option value="low">Baixa Prioridade</option>
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
        <section className={`${mobileTab === "projects" ? "block" : "hidden"} md:block flex-1`}>
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {getSourceBadge(p.source)}
                                {getPriorityBadge(p.priority)}
                              </div>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${getStatusColor(p.status)}`}>
                                {getStatusLabel(p.status)}
                              </span>
                            </div>

                            {p.updatedAt && (
                              <div className="text-[10px] text-slate-400 font-mono mb-2">
                                {formatLastUpdated(p.updatedAt)}
                              </div>
                            )}

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
                <div className="flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 gap-6 items-start snap-x snap-mandatory scroll-smooth -mx-4 px-4 md:mx-0 md:px-0">
                  
                  {/* Status Column generator */}
                  {(["planning", "in_progress", "completed"] as Project["status"][]).map((colStatus) => {
                    const colProjects = filteredProjects.filter((p) => p.status === colStatus);
                    const isOver = isDraggingOverCol[colStatus];
                    
                    return (
                      <div 
                        key={colStatus} 
                        onDragOver={(e) => handleDragOver(e, colStatus)}
                        onDragLeave={() => handleDragLeave(colStatus)}
                        onDrop={(e) => handleDrop(e, colStatus)}
                        className={`w-[85vw] shrink-0 md:w-auto snap-center border rounded-xl p-4 flex flex-col gap-4 min-h-[500px] transition-all duration-200 ${
                          isOver 
                            ? "bg-slate-100/80 border-slate-400/80 shadow-xs scale-[1.01]" 
                            : "bg-slate-50 border-slate-200/50"
                        }`}
                      >
                        
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
                            colProjects.map((p) => {
                            const progress = getProjectProgress(p);
                            return (
                              <div
                                key={p.id}
                                id={`kanban-card-${p.id}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, p.id)}
                                className="bg-white border border-slate-200/50 hover:border-slate-300 rounded-xl shadow-xs hover:shadow-sm transition-all duration-150 flex flex-col h-full group cursor-grab active:cursor-grabbing select-none hover:scale-[0.99]"
                              >
                                {/* Card Body */}
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-center justify-between gap-2 mb-2.5">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <div className="text-slate-300 hover:text-slate-500 cursor-grab flex flex-col gap-[2px] mr-0.5 shrink-0" title="Arraste para mover">
                                          <div className="flex gap-[2px]">
                                            <span className="w-1 h-1 rounded-full bg-current"></span>
                                            <span className="w-1 h-1 rounded-full bg-current"></span>
                                          </div>
                                          <div className="flex gap-[2px]">
                                            <span className="w-1 h-1 rounded-full bg-current"></span>
                                            <span className="w-1 h-1 rounded-full bg-current"></span>
                                          </div>
                                          <div className="flex gap-[2px]">
                                            <span className="w-1 h-1 rounded-full bg-current"></span>
                                            <span className="w-1 h-1 rounded-full bg-current"></span>
                                          </div>
                                        </div>
                                        {getSourceBadge(p.source)}
                                        {getPriorityBadge(p.priority)}
                                      </div>
                                      
                                      {/* Quick Arrow Movers to easily shift status */}
                                      <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                                        {colStatus !== "planning" && (
                                          <button
                                            onClick={() => {
                                              const prevs: Project["status"][] = ["planning", "in_progress", "completed"];
                                              const currIdx = prevs.indexOf(colStatus);
                                              handleMoveStatus(p.id, prevs[currIdx - 1]);
                                            }}
                                            title="Mover para esquerda"
                                            className="p-1 bg-slate-50 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 border border-slate-200 cursor-pointer"
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
                                            className="p-1 bg-slate-50 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 border border-slate-200 cursor-pointer"
                                          >
                                            <ChevronRight className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {p.updatedAt && (
                                      <div className="text-[10px] text-slate-400 font-mono mb-2">
                                        {formatLastUpdated(p.updatedAt)}
                                      </div>
                                    )}

                                    <button
                                      onClick={() => {
                                        setSelectedProjectId(p.id);
                                        setDrawerTab("general");
                                        setIsDetailsDrawerOpen(true);
                                      }}
                                      className="text-left block w-full cursor-pointer"
                                    >
                                      <h4 className="font-semibold text-slate-800 hover:text-slate-950 text-sm leading-tight group-hover:translate-x-0.5 transition-transform duration-200 flex items-center gap-1">
                                        {p.title}
                                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 shrink-0" />
                                      </h4>
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
                                          className="text-slate-600 hover:underline flex items-center gap-0.5 font-sans cursor-pointer"
                                        >
                                          + Criar metas
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Card Footer Actions */}
                                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 flex items-center justify-between rounded-b-xl text-slate-400">
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
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {p.aiRoadmap && (
                                      <span className="flex items-center gap-0.5 text-[9px] text-indigo-600 font-mono bg-indigo-50/70 border border-indigo-100/60 px-1 py-0.5 rounded shrink-0">
                                        <Sparkle className="w-2 h-2" />
                                        IA Mentor
                                      </span>
                                    )}
                                    
                                    <button
                                      onClick={() => {
                                        setSelectedProjectId(p.id);
                                        setDrawerTab("general");
                                        setIsDetailsDrawerOpen(true);
                                      }}
                                      className="text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
                                    >
                                      Ver Detalhes
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
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
                                {getPriorityBadge(p.priority)}
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
                              {p.updatedAt && (
                                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                                  {formatLastUpdated(p.updatedAt)}
                                </span>
                              )}
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

        {/* MOBILE-ONLY EXTENDED STATISTICS VIEW */}
        {mobileTab === "stats" && (
          <div className="md:hidden space-y-6">
            {/* AI Mentor Insight Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100/50 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse animate-duration-1000" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800 font-mono">
                  Conselho do Mentor IA ({aiPersona === "mentor" ? "Tradicional / PM" : aiPersona === "creative" ? "Criativo" : aiPersona === "scrum" ? "Scrum Master" : "Minimalista"})
                </h4>
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                {aiPersona === "mentor" 
                  ? `Você tem ${inProgressCount} projetos ativos no radar. Foque em concluir tarefas de maior prioridade antes de expandir o escopo. Lembre-se: "Feito é melhor que perfeito!"`
                  : aiPersona === "creative" 
                  ? `Idéias fluindo! Você tem ${planningCount} projetos em planejamento. Que tal rascunhar as tarefas iniciais de um deles usando o Assistente IA?`
                  : aiPersona === "scrum" 
                  ? `O progresso geral do seu espaço de trabalho é de ${globalProgressPercent}%. Continue focado nos cartões em desenvolvimento e evite acumular impedimentos.`
                  : `Mantenha a simplicidade. ${totalProjectsCount} projetos são suficientes para focar no que realmente importa hoje. Elimine o excesso.`}
              </p>
            </div>

            {/* Completed Tasks Log List */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">Tarefas Concluídas</h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full">
                  {completedTasks} concluídas
                </span>
              </div>

              {projects.flatMap(p => p.tasks).filter(t => t.completed).length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 font-mono">
                  Nenhuma tarefa concluída ainda. Comece marcando as caixas de tarefas nos detalhes do projeto!
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {projects.flatMap(p => p.tasks.map(t => ({ ...t, projectName: p.title }))).filter(t => t.completed).slice(0, 15).map((task) => (
                    <div key={task.id} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-700 truncate">{task.title}</p>
                        <p className="text-[9px] text-slate-400 truncate">Projeto: {task.projectName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MOBILE-ONLY SYSTEM SETTINGS VIEW */}
        {mobileTab === "settings" && (
          <div className="md:hidden space-y-6">
            <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5 space-y-4">
              {/* Profile Header */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-800 truncate">Olá, {userName}!</h4>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    Preferências do Project Hub
                  </p>
                </div>
              </div>

              {/* Settings Form Body */}
              <div className="space-y-4">
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Nome de Usuário
                  </label>
                  <input
                    type="text"
                    value={tempUserName}
                    onChange={(e) => setTempUserName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-400 transition-colors"
                  />
                </div>

                {/* AI Persona */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Persona do Mentor IA
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "mentor", label: "Tradicional", desc: "Equilíbrio técnico" },
                      { id: "scrum", label: "Scrum Master", desc: "Agilidade e prazos" },
                      { id: "creative", label: "Criativo", desc: "Fora da caixa" },
                      { id: "minimalist", label: "Minimalista", desc: "Foco no essencial" }
                    ].map((persona) => (
                      <button
                        key={persona.id}
                        type="button"
                        onClick={() => setTempAiPersona(persona.id)}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          tempAiPersona === persona.id
                            ? "border-slate-900 bg-slate-900/5 ring-1 ring-slate-900"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-[11px] font-bold text-slate-800 block">{persona.label}</span>
                        <span className="text-[9px] text-slate-400 leading-tight block mt-0.5">{persona.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default View Mode */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Visualização de Entrada
                  </label>
                  <select
                    value={tempDefaultViewMode}
                    onChange={(e) => setTempDefaultViewMode(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                  >
                    <option value="bento">Bento Grid (Painel)</option>
                    <option value="kanban">Quadro Kanban</option>
                    <option value="list">Lista Compacta</option>
                  </select>
                </div>

                {/* Password Lock protection */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        Senha de Acesso
                      </span>
                      <span className="text-[9px] text-slate-400 leading-none">Proteger hub com senha</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPasswordProtected}
                        onChange={(e) => setIsPasswordProtected(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-slate-900"></div>
                    </label>
                  </div>

                  {isPasswordProtected && (
                    <div className="space-y-1">
                      <input
                        type="password"
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        placeholder="Insira a nova senha secreta"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                      />
                    </div>
                  )}
                </div>

                {/* Save button */}
                <button
                  onClick={() => handleSaveSettings(tempUserName, tempAiPersona, tempDefaultViewMode, tempTheme)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Salvar Preferências
                </button>
              </div>
            </div>

            {/* Backup & System operations */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Importar & Exportar Backup
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Exporte todos os projetos em um arquivo local ou restaure backups JSON salvos anteriormente.
              </p>
              
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleExportBackup}
                  className="bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg p-2.5 text-center flex flex-col items-center justify-center gap-1.5 text-slate-700 transition-all text-xs font-medium cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Exportar JSON</span>
                </button>

                <label className="bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg p-2.5 text-center flex flex-col items-center justify-center gap-1.5 text-slate-700 transition-all text-xs font-medium cursor-pointer">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Importar JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Dangerous action */}
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-600 font-mono">
                Ações Irreversíveis
              </h4>
              
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: "Zerar todos os projetos?",
                    description: "Essa ação removerá permanentemente todos os projetos e tarefas criadas localmente e na nuvem.",
                    actionLabel: "Zerar Dados",
                    isDanger: true,
                    onConfirm: async () => {
                      setProjects([]);
                      localStorage.removeItem("project_hub_projects");
                      showToast("Hub reinicializado com sucesso!", "success");
                    }
                  });
                }}
                className="w-full border border-red-200 bg-white hover:bg-red-50 text-red-700 py-2 rounded-lg text-xs font-bold transition-all"
              >
                Limpar Todos os Projetos
              </button>
            </div>
          </div>
        )}

      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/90 backdrop-blur-md border-t border-slate-200/50 flex justify-around items-center py-2 px-4 shadow-lg pb-safe">
        <button
          onClick={() => setMobileTab("projects")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            mobileTab === "projects" 
              ? "text-slate-900 font-semibold scale-105" 
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <FolderDot className="w-5 h-5" />
          <span className="text-[10px] font-medium font-sans">Projetos</span>
        </button>

        <button
          onClick={() => setMobileTab("stats")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            mobileTab === "stats" 
              ? "text-slate-900 font-semibold scale-105" 
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="text-[10px] font-medium font-sans">Métricas</span>
        </button>

        <button
          onClick={() => {
            setTempUserName(userName);
            setTempAiPersona(aiPersona);
            setTempDefaultViewMode(defaultViewMode);
            setTempTheme(theme);
            setIsPasswordProtected(!!accessPassword);
            setTempPassword(accessPassword || "");
            setMobileTab("settings");
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            mobileTab === "settings" 
              ? "text-slate-900 font-semibold scale-105" 
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Sliders className="w-5 h-5" />
          <span className="text-[10px] font-medium font-sans">Ajustes</span>
        </button>
      </div>

      {/* MOBILE FLOATING ACTION BUTTON (FAB) */}
      {mobileTab === "projects" && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsNewProjectModalOpen(true)}
          className="fixed bottom-20 right-5 z-40 md:hidden w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg active:bg-slate-800 transition-colors cursor-pointer"
          title="Novo Projeto"
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
      )}



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

                  {/* Source, Status and Priority selectors (Flex box) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                        <option value="ai_studio">AI Studio</option>
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
                        <option value="planning">Planejamento</option>
                        <option value="in_progress">Desenvolvimento</option>
                        <option value="completed">Concluído</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Prioridade
                      </label>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-slate-400"
                      >
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
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
          <div className="fixed inset-0 z-50 overflow-hidden">
            
            {/* Drawer Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsDrawerOpen(false)}
              className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs transition-opacity"
            />

            {/* Slide over layout panel */}
            <div className="absolute inset-y-0 right-0 max-w-full pl-0 md:pl-10 flex">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-screen max-w-full md:max-w-xl bg-white border-l border-slate-200/80 shadow-2xl flex flex-col h-full"
              >
                
                {/* Header detail */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {getSourceBadge(selectedProject.source)}
                      {getPriorityBadge(selectedProject.priority)}
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                          <div>
                            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                              Prioridade
                            </label>
                            <select
                              value={selectedProject.priority || "medium"}
                              onChange={(e) => handleUpdateField(selectedProject.id, "priority", e.target.value as any)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
                            >
                              <option value="low">Baixa</option>
                              <option value="medium">Média</option>
                              <option value="high">Alta</option>
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

                  {/* Segurança e Controle de Acesso */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Segurança e Controle de Acesso
                    </label>
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-slate-800 block">Proteger com Senha</span>
                          <span className="text-[9px] text-slate-400 leading-normal block">Exige senha de acesso ao entrar no Project Hub.</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isPasswordProtected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setIsPasswordProtected(checked);
                              if (!checked) setTempPassword("");
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                        </label>
                      </div>

                      {isPasswordProtected && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-100/50">
                          <label className="text-[10px] font-mono text-slate-400 block">Definir Senha de Acesso</label>
                          <div className="relative">
                            <input
                              type={showSettingsPassword ? "text" : "password"}
                              value={tempPassword}
                              onChange={(e) => setTempPassword(e.target.value)}
                              placeholder="Digite uma senha segura"
                              className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-10 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400 transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSettingsPassword(!showSettingsPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 flex items-center justify-center"
                            >
                              {showSettingsPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <p className="text-[9px] text-amber-600 leading-normal">
                            Importante: Guarde essa senha com cuidado. Se esquecer, precisará alterá-la diretamente no console do Firestore.
                          </p>
                        </div>
                      )}
                    </div>
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

      {/* MODAL: CONFIRMAÇÃO CUSTOMIZADA */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-[100] overflow-y-auto" id="custom-confirm-modal">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white border border-slate-100 p-6 shadow-2xl space-y-4 z-10"
              >
                {/* Header / Title */}
                <div className="flex items-start gap-3 text-left">
                  <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${
                    confirmDialog.isDanger ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                  }`}>
                    {confirmDialog.isDanger ? <AlertTriangle className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 font-sans">
                      {confirmDialog.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {confirmDialog.description}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100/50">
                  <button
                    onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors font-sans"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                      await confirmDialog.onConfirm();
                    }}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white shadow-sm transition-all font-sans ${
                      confirmDialog.isDanger 
                        ? "bg-red-600 hover:bg-red-700 active:bg-red-800" 
                        : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                    }`}
                  >
                    {confirmDialog.actionLabel}
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
