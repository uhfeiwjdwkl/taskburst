import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, FolderOpen, Download, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TaskCard from '@/components/TaskCard';
import TaskDetailsDialog from '@/components/TaskDetailsDialog';
import TaskDetailsViewDialog from '@/components/TaskDetailsViewDialog';
import { ExportImportButton } from '@/components/ExportImportButton';
import { toast } from 'sonner';
import { exportData } from '@/lib/exportImport';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Subcategory {
  name: string;
  parentCategory: string;
}

const Categories = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [addingSubcategoryFor, setAddingSubcategoryFor] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
    
    const savedSubcategories = localStorage.getItem('subcategories');
    if (savedSubcategories) {
      setSubcategories(JSON.parse(savedSubcategories));
    }
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    } else {
      localStorage.setItem('tasks', JSON.stringify([]));
    }
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('subcategories', JSON.stringify(subcategories));
  }, [subcategories]);

  const handleUpdateTask = (updatedTask: Task) => {
    const updatedTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    toast.success('Task updated!');
  };

  const handleStartFocus = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    toast.success(`Starting focus session for: ${task?.name}`);
    navigate('/');
  };

  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const completedTask = { ...task, completed: true };
      
      const archived = JSON.parse(localStorage.getItem('archivedTasks') || '[]');
      localStorage.setItem('archivedTasks', JSON.stringify([...archived, completedTask]));
      
      const updatedTasks = tasks.filter(t => t.id !== taskId);
      setTasks(updatedTasks);
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
      toast.success('Task completed and archived! 🎉');
    }
  };

  const handleShowDetails = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setDetailsDialogOpen(true);
    }
  };

  const handleEdit = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setEditDialogOpen(true);
    }
  };

  const getCategoryGroups = () => {
    const groups: { [key: string]: Task[] } = {};
    
    // Add tasks to their categories
    tasks.forEach(task => {
      const category = task.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(task);
    });

    return groups;
  };

  const categoryGroups = getCategoryGroups();
  const categories = Object.keys(categoryGroups).sort();

  // Get subcategories for a category
  const getSubcategoriesFor = (category: string) => {
    return subcategories.filter(s => s.parentCategory === category);
  };

  // Get tasks for a subcategory
  const getTasksForSubcategory = (subcategoryName: string) => {
    return tasks.filter(t => t.subcategory === subcategoryName);
  };

  const selectedCategoryTasks = selectedCategory 
    ? categoryGroups[selectedCategory]?.sort((a, b) => b.importance - a.importance) || []
    : [];

  const handleExportCategory = (category: string) => {
    const categoryTasks = categoryGroups[category] || [];
    exportData(categoryTasks, `category-${category}-${new Date().toISOString().split('T')[0]}.json`);
    toast.success(`Exported ${categoryTasks.length} tasks from "${category}"`);
  };

  const handleAddSubcategory = (parentCategory: string) => {
    if (newSubcategoryName.trim()) {
      const newSubcategory: Subcategory = {
        name: newSubcategoryName.trim(),
        parentCategory
      };
      setSubcategories([...subcategories, newSubcategory]);
      setNewSubcategoryName('');
      setAddingSubcategoryFor(null);
      toast.success('Subcategory added');
    }
  };

  const toggleCategoryExpand = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Handle drag and drop between categories
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const droppableId = destination.droppableId;
    
    // Find the task
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;
    
    // Determine if dropping on a category or subcategory
    if (droppableId.startsWith('subcategory-')) {
      const subcategoryName = droppableId.replace('subcategory-', '');
      const updatedTask = { ...task, subcategory: subcategoryName };
      handleUpdateTask(updatedTask);
    } else if (droppableId.startsWith('category-')) {
      const categoryName = droppableId.replace('category-', '');
      const updatedTask = { ...task, category: categoryName, subcategory: undefined };
      handleUpdateTask(updatedTask);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Categories
              </h1>
              <p className="text-muted-foreground mt-1">
                Browse tasks by category - drag tasks between categories
              </p>
            </div>
          </div>
          <ExportImportButton
            data={tasks}
            filename={`tasks-${new Date().toISOString().split('T')[0]}.json`}
            onImport={(data) => {
              setTasks(data);
              toast.success('Tasks imported successfully!');
            }}
            storageKey="tasks"
            label="All Tasks"
          />
        </header>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Categories List */}
            <Card className="p-6 md:col-span-1 h-fit">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                All Categories
              </h2>
              {categories.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No categories yet. Add tasks with categories to see them here.
                </p>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => {
                    const categorySubcategories = getSubcategoriesFor(category);
                    const isExpanded = expandedCategories.has(category);
                    
                    return (
                      <div key={category}>
                        <Droppable droppableId={`category-${category}`}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`p-3 rounded-lg transition-colors ${
                                selectedCategory === category
                                  ? 'bg-primary text-primary-foreground'
                                  : snapshot.isDraggingOver
                                  ? 'bg-primary/20'
                                  : 'bg-secondary hover:bg-secondary/80'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  {categorySubcategories.length > 0 && (
                                    <button
                                      onClick={() => toggleCategoryExpand(category)}
                                      className="p-0.5"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setSelectedCategory(category)}
                                    className="flex-1 text-left font-medium"
                                  >
                                    {category}
                                  </button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={selectedCategory === category ? "secondary" : "outline"}>
                                    {categoryGroups[category].length}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAddingSubcategoryFor(addingSubcategoryFor === category ? null : category);
                                    }}
                                    title="Add subcategory"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExportCategory(category);
                                    }}
                                    title={`Export ${category}`}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        {/* Add Subcategory Input */}
                        {addingSubcategoryFor === category && (
                          <div className="ml-6 mt-2 flex gap-2">
                            <Input
                              placeholder="Subcategory name"
                              value={newSubcategoryName}
                              onChange={(e) => setNewSubcategoryName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddSubcategory(category)}
                              className="h-8 text-sm"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAddSubcategory(category)}
                            >
                              Add
                            </Button>
                          </div>
                        )}

                        {/* Subcategories */}
                        {isExpanded && categorySubcategories.map((sub) => (
                          <Droppable key={sub.name} droppableId={`subcategory-${sub.name}`}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`ml-6 mt-1 p-2 rounded-md text-sm ${
                                  snapshot.isDraggingOver
                                    ? 'bg-primary/20'
                                    : 'bg-muted'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{sub.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {getTasksForSubcategory(sub.name).length}
                                  </Badge>
                                </div>
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Tasks in Selected Category */}
            <div className="md:col-span-2">
              {!selectedCategory ? (
                <Card className="p-12 text-center">
                  <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Select a Category</h3>
                  <p className="text-muted-foreground">
                    Choose a category from the list to view its tasks
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  <Card className="p-4">
                    <h2 className="text-2xl font-semibold mb-1">{selectedCategory}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedCategoryTasks.length} {selectedCategoryTasks.length === 1 ? 'task' : 'tasks'}
                    </p>
                  </Card>

                  {selectedCategoryTasks.length === 0 ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">
                        No tasks in this category
                      </p>
                    </Card>
                  ) : (
                    <Droppable droppableId={`category-${selectedCategory}`}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="space-y-4"
                        >
                          {selectedCategoryTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={snapshot.isDragging ? 'opacity-80' : ''}
                                >
                                  <TaskCard
                                    task={task}
                                    onStartFocus={handleStartFocus}
                                    onShowDetails={handleShowDetails}
                                    onEdit={handleEdit}
                                    onComplete={handleCompleteTask}
                                    onDelete={(taskId) => {
                                      const task = tasks.find(t => t.id === taskId);
                                      if (task) {
                                        const deletedTask = { ...task, deletedAt: new Date().toISOString() };
                                        const deleted = JSON.parse(localStorage.getItem('deletedTasks') || '[]');
                                        localStorage.setItem('deletedTasks', JSON.stringify([...deleted, deletedTask]));
                                        setTasks(tasks.filter(t => t.id !== taskId));
                                        toast.success('Task moved to recently deleted');
                                      }
                                    }}
                                    onUpdateTask={handleUpdateTask}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  )}
                </div>
              )}
            </div>
          </div>
        </DragDropContext>

        {/* Dialogs */}
        <TaskDetailsDialog
          task={selectedTask}
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSave={handleUpdateTask}
        />

        <TaskDetailsViewDialog
          task={selectedTask}
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          onUpdateTask={handleUpdateTask}
          onEdit={handleEdit}
        />
      </div>
    </div>
  );
};

export default Categories;