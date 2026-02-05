import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, FolderOpen, Download, Plus, ChevronRight, ChevronDown, Trash2, Edit2, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TaskCard from '@/components/TaskCard';
import TaskDetailsDialog from '@/components/TaskDetailsDialog';
import TaskDetailsViewDialog from '@/components/TaskDetailsViewDialog';
import { ExportImportButton } from '@/components/ExportImportButton';
import { toast } from 'sonner';
import { exportData } from '@/lib/exportImport';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Subcategory {
  name: string;
  parentCategory: string;
}

const Categories = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [addingSubcategoryFor, setAddingSubcategoryFor] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // New state for management
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingSubcategory, setEditingSubcategory] = useState<string | null>(null);
  const [editingSubcategoryName, setEditingSubcategoryName] = useState('');
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ type: 'category' | 'subcategory'; name: string } | null>(null);

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
    localStorage.setItem('tasks', JSON.stringify(tasks));
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

  const getSubcategoriesFor = (category: string) => {
    return subcategories.filter(s => s.parentCategory === category);
  };

  const getTasksForSubcategory = (subcategoryName: string) => {
    return tasks.filter(t => t.subcategory === subcategoryName);
  };

  // Get display tasks based on selection
  const getDisplayTasks = () => {
    if (selectedSubcategory) {
      return getTasksForSubcategory(selectedSubcategory).sort((a, b) => b.importance - a.importance);
    }
    if (selectedCategory) {
      // Show ALL tasks in the category, including those in subcategories
      return (categoryGroups[selectedCategory] || [])
        .sort((a, b) => {
          // Sort by subcategory first (tasks without subcategory come first), then by importance
          if (!a.subcategory && b.subcategory) return -1;
          if (a.subcategory && !b.subcategory) return 1;
          if (a.subcategory && b.subcategory && a.subcategory !== b.subcategory) {
            return a.subcategory.localeCompare(b.subcategory);
          }
          return b.importance - a.importance;
        });
    }
    return [];
  };

  const displayTasks = getDisplayTasks();

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

  // Category management functions
  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      // Categories are inferred from tasks, so we need to save it differently
      const savedCategories = JSON.parse(localStorage.getItem('taskCategories') || '[]');
      if (!savedCategories.includes(newCategoryName.trim())) {
        savedCategories.push(newCategoryName.trim());
        localStorage.setItem('taskCategories', JSON.stringify(savedCategories));
        toast.success('Category added');
      }
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName.trim()) {
      setEditingCategory(null);
      return;
    }
    
    // Update all tasks with this category
    const updatedTasks = tasks.map(t => 
      t.category === oldName ? { ...t, category: newName.trim() } : t
    );
    setTasks(updatedTasks);
    
    // Update subcategories parent
    const updatedSubcategories = subcategories.map(s =>
      s.parentCategory === oldName ? { ...s, parentCategory: newName.trim() } : s
    );
    setSubcategories(updatedSubcategories);
    
    // Update saved categories
    const savedCategories = JSON.parse(localStorage.getItem('taskCategories') || '[]');
    const newCategories = savedCategories.map((c: string) => c === oldName ? newName.trim() : c);
    localStorage.setItem('taskCategories', JSON.stringify(newCategories));
    
    if (selectedCategory === oldName) {
      setSelectedCategory(newName.trim());
    }
    
    setEditingCategory(null);
    toast.success('Category renamed');
  };

  const handleDeleteCategory = (categoryName: string) => {
    // Move all tasks to Uncategorized
    const updatedTasks = tasks.map(t =>
      t.category === categoryName ? { ...t, category: undefined, subcategory: undefined } : t
    );
    setTasks(updatedTasks);
    
    // Remove subcategories under this category
    const updatedSubcategories = subcategories.filter(s => s.parentCategory !== categoryName);
    setSubcategories(updatedSubcategories);
    
    // Remove from saved categories
    const savedCategories = JSON.parse(localStorage.getItem('taskCategories') || '[]');
    const newCategories = savedCategories.filter((c: string) => c !== categoryName);
    localStorage.setItem('taskCategories', JSON.stringify(newCategories));
    
    if (selectedCategory === categoryName) {
      setSelectedCategory(null);
    }
    
    setDeleteConfirmDialog(null);
    toast.success('Category deleted');
  };

  const handleRenameSubcategory = (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName.trim()) {
      setEditingSubcategory(null);
      return;
    }
    
    // Update subcategory
    const updatedSubcategories = subcategories.map(s =>
      s.name === oldName ? { ...s, name: newName.trim() } : s
    );
    setSubcategories(updatedSubcategories);
    
    // Update tasks with this subcategory
    const updatedTasks = tasks.map(t =>
      t.subcategory === oldName ? { ...t, subcategory: newName.trim() } : t
    );
    setTasks(updatedTasks);
    
    if (selectedSubcategory === oldName) {
      setSelectedSubcategory(newName.trim());
    }
    
    setEditingSubcategory(null);
    toast.success('Subcategory renamed');
  };

  const handleDeleteSubcategory = (subcategoryName: string) => {
    // Remove subcategory from tasks
    const updatedTasks = tasks.map(t =>
      t.subcategory === subcategoryName ? { ...t, subcategory: undefined } : t
    );
    setTasks(updatedTasks);
    
    // Remove subcategory
    const updatedSubcategories = subcategories.filter(s => s.name !== subcategoryName);
    setSubcategories(updatedSubcategories);
    
    if (selectedSubcategory === subcategoryName) {
      setSelectedSubcategory(null);
    }
    
    setDeleteConfirmDialog(null);
    toast.success('Subcategory deleted');
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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const droppableId = destination.droppableId;
    
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;
    
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  All Categories
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddCategory(!showAddCategory)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Add Category Input */}
              {showAddCategory && (
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="New category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    className="h-8 text-sm"
                  />
                  <Button size="sm" onClick={handleAddCategory}>
                    Add
                  </Button>
                </div>
              )}

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
                                selectedCategory === category && !selectedSubcategory
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
                                  
                                  {editingCategory === category ? (
                                    <div className="flex items-center gap-1 flex-1">
                                      <Input
                                        value={editingCategoryName}
                                        onChange={(e) => setEditingCategoryName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleRenameCategory(category, editingCategoryName);
                                          if (e.key === 'Escape') setEditingCategory(null);
                                        }}
                                        className="h-6 text-sm px-1"
                                        autoFocus
                                      />
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleRenameCategory(category, editingCategoryName)}>
                                        <Check className="h-3 w-3" />
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingCategory(null)}>
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => { setSelectedCategory(category); setSelectedSubcategory(null); }}
                                      className="flex-1 text-left font-medium"
                                    >
                                      {category}
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Badge variant={selectedCategory === category ? "secondary" : "outline"} className="text-xs">
                                    {categoryGroups[category].length}
                                  </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-background">
                                      <DropdownMenuItem onClick={() => { setEditingCategory(category); setEditingCategoryName(category); }}>
                                        <Edit2 className="h-3 w-3 mr-2" /> Rename
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => setAddingSubcategoryFor(addingSubcategoryFor === category ? null : category)}>
                                        <Plus className="h-3 w-3 mr-2" /> Add Subcategory
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleExportCategory(category)}>
                                        <Download className="h-3 w-3 mr-2" /> Export
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        className="text-destructive"
                                        onClick={() => setDeleteConfirmDialog({ type: 'category', name: category })}
                                      >
                                        <Trash2 className="h-3 w-3 mr-2" /> Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
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
                                className={`ml-6 mt-1 p-2 rounded-md text-sm cursor-pointer ${
                                  selectedSubcategory === sub.name
                                    ? 'bg-primary/80 text-primary-foreground'
                                    : snapshot.isDraggingOver
                                    ? 'bg-primary/20'
                                    : 'bg-muted hover:bg-muted/80'
                                }`}
                                onClick={() => { setSelectedCategory(sub.parentCategory); setSelectedSubcategory(sub.name); }}
                              >
                                <div className="flex items-center justify-between">
                                  {editingSubcategory === sub.name ? (
                                    <div className="flex items-center gap-1 flex-1">
                                      <Input
                                        value={editingSubcategoryName}
                                        onChange={(e) => setEditingSubcategoryName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleRenameSubcategory(sub.name, editingSubcategoryName);
                                          if (e.key === 'Escape') setEditingSubcategory(null);
                                        }}
                                        className="h-5 text-xs px-1"
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); handleRenameSubcategory(sub.name, editingSubcategoryName); }}>
                                        <Check className="h-3 w-3" />
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); setEditingSubcategory(null); }}>
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <span>{sub.name}</span>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Badge variant="outline" className="text-xs">
                                      {getTasksForSubcategory(sub.name).length}
                                    </Badge>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-5 w-5 p-0"
                                      onClick={(e) => { e.stopPropagation(); setEditingSubcategory(sub.name); setEditingSubcategoryName(sub.name); }}
                                    >
                                      <Edit2 className="h-2 w-2" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmDialog({ type: 'subcategory', name: sub.name }); }}
                                    >
                                      <Trash2 className="h-2 w-2" />
                                    </Button>
                                  </div>
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

            {/* Tasks in Selected Category/Subcategory */}
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
                    <h2 className="text-2xl font-semibold mb-1">
                      {selectedSubcategory ? `${selectedCategory} › ${selectedSubcategory}` : selectedCategory}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {displayTasks.length} {displayTasks.length === 1 ? 'task' : 'tasks'}
                      {selectedSubcategory && (
                        <Button 
                          variant="link" 
                          className="ml-2 h-auto p-0 text-xs"
                          onClick={() => setSelectedSubcategory(null)}
                        >
                          ← Back to {selectedCategory}
                        </Button>
                      )}
                    </p>
                  </Card>

                  {displayTasks.length === 0 ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">
                        No tasks in this {selectedSubcategory ? 'subcategory' : 'category'}
                      </p>
                    </Card>
                  ) : (
                    <Droppable droppableId={selectedSubcategory ? `subcategory-${selectedSubcategory}` : `category-${selectedCategory}`}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="space-y-4"
                        >
                          {displayTasks.map((task, index) => (
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmDialog !== null} onOpenChange={() => setDeleteConfirmDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {deleteConfirmDialog?.type}?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteConfirmDialog?.type === 'category' 
                  ? `All tasks in "${deleteConfirmDialog.name}" will be moved to Uncategorized. This cannot be undone.`
                  : `Tasks in "${deleteConfirmDialog?.name}" will no longer have this subcategory. This cannot be undone.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (deleteConfirmDialog?.type === 'category') {
                    handleDeleteCategory(deleteConfirmDialog.name);
                  } else if (deleteConfirmDialog?.type === 'subcategory') {
                    handleDeleteSubcategory(deleteConfirmDialog.name);
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Categories;
