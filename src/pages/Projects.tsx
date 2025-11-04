import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Project } from '@/types/project';
import { Task } from '@/types/task';
import { ExportImportButton } from '@/components/ExportImportButton';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTimeToDDMMYYYY } from '@/lib/dateFormat';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

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
    if (saved) {
      const parsed = JSON.parse(saved) as Task[];
      setTasks(parsed.filter(t => !t.deletedAt && !t.completed));
    }
  };

  const saveProjects = (updated: Project[]) => {
    localStorage.setItem('projects', JSON.stringify(updated));
    loadProjects();
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
    return tasks.filter(t => project.taskIds.includes(t.id));
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
          />
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No projects yet</p>
            <Button>
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
                  <CardHeader className="cursor-pointer" onClick={() => toggleExpanded(project.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        <div>
                          <CardTitle>{project.title}</CardTitle>
                          {project.description && (
                            <CardDescription>{project.description}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {stats.completedCount}/{stats.totalTasks} tasks • {stats.totalSpent}/{stats.totalEstimated} min
                      </div>
                    </div>
                    {project.dueDateTime && (
                      <div className="text-sm text-muted-foreground mt-2">
                        Due: {formatDateTimeToDDMMYYYY(project.dueDateTime)}
                      </div>
                    )}
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
                              className={`p-3 border rounded-md ${task.completed ? 'opacity-50 line-through' : ''}`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
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
    </div>
  );
};

export default Projects;
