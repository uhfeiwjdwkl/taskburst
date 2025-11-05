import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronRight, Star, Edit, Trash2, Archive as ArchiveIcon } from 'lucide-react';
import { Project } from '@/types/project';
import { Task } from '@/types/task';
import { ExportImportButton } from '@/components/ExportImportButton';
import { AddProjectDialog } from '@/components/AddProjectDialog';
import { EditProjectDialog } from '@/components/EditProjectDialog';
import { ExportProjectButton } from '@/components/ExportProjectButton';
import { ImportProjectButton } from '@/components/ImportProjectButton';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTimeToDDMMYYYY } from '@/lib/dateFormat';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
    loadTasks();
  }, []);

  const loadProjects = () => {
    const saved = localStorage.getItem('projects');
    if (saved) {
      const parsed = JSON.parse(saved) as Project[];
      setProjects(parsed.filter(p => !p.deletedAt && !p.archivedAt).sort((a, b) => a.order - b.order));
    }
  };

  const loadTasks = () => {
    const saved = localStorage.getItem('tasks');
    const archived = localStorage.getItem('archivedTasks');
    if (saved) {
      const parsed = JSON.parse(saved) as Task[];
      const archivedParsed = archived ? JSON.parse(archived) as Task[] : [];
      setAllTasks([...parsed, ...archivedParsed].filter(t => !t.deletedAt));
    }
  };

  const saveProjects = (updated: Project[]) => {
    const allProjects = [...updated].map((p, index) => ({ ...p, order: index }));
    localStorage.setItem('projects', JSON.stringify(allProjects));
    loadProjects();
  };

  const handleAddProject = (newProject: Omit<Project, 'id' | 'createdAt' | 'order'>) => {
    const project: Project = {
      ...newProject,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      order: projects.length,
    };
    saveProjects([...projects, project]);
    toast.success('Project created!');
  };

  const handleEditProject = (updatedProject: Project) => {
    const updated = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
    saveProjects(updated);
    toast.success('Project updated!');
  };

  const handleDeleteProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const deletedProject = { ...project, deletedAt: new Date().toISOString() };
      const allProjects = JSON.parse(localStorage.getItem('projects') || '[]');
      const updated = allProjects.map((p: Project) => p.id === projectId ? deletedProject : p);
      localStorage.setItem('projects', JSON.stringify(updated));
      loadProjects();
      toast.success('Project moved to recently deleted');
    }
  };

  const handleArchiveProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const archivedProject = { ...project, archivedAt: new Date().toISOString() };
      const allProjects = JSON.parse(localStorage.getItem('projects') || '[]');
      const updated = allProjects.map((p: Project) => p.id === projectId ? archivedProject : p);
      localStorage.setItem('projects', JSON.stringify(updated));
      loadProjects();
      toast.success('Project archived!');
    }
  };

  const handleToggleFavorite = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const updated = projects.map(p => 
        p.id === projectId ? { ...p, favorite: !p.favorite } : p
      );
      saveProjects(updated);
    }
  };

  const toggleExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const getProjectTasks = (project: Project): Task[] => {
    return allTasks.filter(t => project.taskIds.includes(t.id));
  };

  const calculateProjectStats = (project: Project) => {
    const projectTasks = getProjectTasks(project);
    const totalEstimated = projectTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
    const totalSpent = projectTasks.reduce((sum, t) => sum + t.spentMinutes, 0);
    const completedCount = projectTasks.filter(t => t.completed).length;
    return { totalEstimated, totalSpent, completedCount, totalTasks: projectTasks.length };
  };

  const handleImportProjects = (importedData: any) => {
    if (Array.isArray(importedData) && importedData.every(item => item.taskIds && item.title)) {
      const allProjects = [...projects, ...importedData];
      saveProjects(allProjects);
    } else {
      toast.error('Invalid projects file');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Organize tasks into projects</p>
        </div>
        <div className="flex gap-2">
          <ExportImportButton
            data={projects}
            filename={`projects-${new Date().toISOString().split('T')[0]}.json`}
            onImport={handleImportProjects}
            storageKey="projects"
            label="Projects"
          />
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No projects yet</p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const stats = calculateProjectStats(project);
            const projectTasks = getProjectTasks(project);
            const isExpanded = expandedProjects.has(project.id);

            return (
              <Card key={project.id}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(project.id)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleExpanded(project.id)}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle>{project.title}</CardTitle>
                            {project.favorite && <Star className="h-4 w-4 fill-primary text-primary" />}
                          </div>
                          {project.description && (
                            <CardDescription>{project.description}</CardDescription>
                          )}
                          <div className="text-sm text-muted-foreground mt-2">
                            {stats.completedCount}/{stats.totalTasks} tasks • {stats.totalSpent}/{stats.totalEstimated} min
                          </div>
                          {project.dueDateTime && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Due: {formatDateTimeToDDMMYYYY(project.dueDateTime)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFavorite(project.id)}
                        >
                          <Star className={`h-4 w-4 ${project.favorite ? 'fill-primary text-primary' : ''}`} />
                        </Button>
                        <ExportProjectButton project={project} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProject(project);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchiveProject(project.id)}
                        >
                          <ArchiveIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent>
                      {projectTasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No tasks in this project</p>
                      ) : (
                        <div className="space-y-2">
                          {projectTasks.map((task) => (
                            <div
                              key={task.id}
                              className="p-3 border rounded-md"
                            >
                              <div className="flex justify-between items-start">
                                <div className={task.completed ? 'line-through opacity-70' : ''}>
                                  <div className="font-medium">{task.name}</div>
                                  <div className="text-sm text-muted-foreground">{task.description}</div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {task.spentMinutes}/{task.estimatedMinutes} min
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      <AddProjectDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSave={handleAddProject}
        tasks={allTasks.filter(t => !t.completed)}
      />

      <EditProjectDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleEditProject}
        project={selectedProject}
        tasks={allTasks}
      />
    </div>
  );
};

export default Projects;
