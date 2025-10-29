import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Star, Trash2, Home, Edit, Eye, ChevronDown, FileDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CreateTimetableDialog } from "@/components/CreateTimetableDialog";
import { TimetableGrid } from "@/components/TimetableGrid";
import { ColorKeyEditor } from "@/components/ColorKeyEditor";
import { TimetableRowColEditor } from "@/components/TimetableRowColEditor";
import { Timetable as TimetableType, TimeSlot } from "@/types/timetable";
import { toast } from "sonner";
import { exportToPDF, exportToExcel } from "@/lib/exportTimetable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const Timetable = () => {
  const navigate = useNavigate();
  const [timetables, setTimetables] = useState<TimetableType[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<TimetableType | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [timetableToDelete, setTimetableToDelete] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState<1 | 2>(1); // for fortnightly view
  const [isEditing, setIsEditing] = useState(false);
  const [editingTimetableId, setEditingTimetableId] = useState<string | null>(null);
  const [editingTimetableSnapshot, setEditingTimetableSnapshot] = useState<TimetableType | null>(null);
  const [focusedColor, setFocusedColor] = useState<string | undefined>(undefined);
  const [collapsedTimetables, setCollapsedTimetables] = useState<Set<string>>(new Set());
  const [expandedEditSections, setExpandedEditSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem('timetables');
    if (saved) {
      const parsed = JSON.parse(saved) as TimetableType[];
      const active = parsed.filter(t => !t.deletedAt);
      setTimetables(active.sort((a, b) => 
        b.favorite === a.favorite ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : b.favorite ? 1 : -1
      ));
      if (active.length > 0 && !selectedTimetable) {
        setSelectedTimetable(active[0]);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedTimetable && selectedTimetable.type === 'fortnightly' && selectedTimetable.fortnightStartDate) {
      // Calculate which week we're in
      const startDate = new Date(selectedTimetable.fortnightStartDate);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const weeksDiff = Math.floor(daysDiff / 7);
      const calculatedWeek = (weeksDiff % 2) === 0 ? 1 : 2;
      setCurrentWeek(calculatedWeek as 1 | 2);
    }
  }, [selectedTimetable]);

  const saveTimetables = (updatedTimetables: TimetableType[]) => {
    localStorage.setItem('timetables', JSON.stringify(updatedTimetables));
    setTimetables(updatedTimetables.sort((a, b) => 
      b.favorite === a.favorite ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : b.favorite ? 1 : -1
    ));
  };

  const handleCreateTimetable = (timetable: TimetableType) => {
    const updated = [...timetables, timetable];
    saveTimetables(updated);
    setSelectedTimetable(timetable);
    toast.success("Timetable created");
  };

  const handleUpdateTimetable = (updated: TimetableType) => {
    const saved = localStorage.getItem('timetables');
    if (saved) {
      const allTimetables = JSON.parse(saved) as TimetableType[];
      const newTimetables = allTimetables.map(t => t.id === updated.id ? updated : t);
      localStorage.setItem('timetables', JSON.stringify(newTimetables));
      saveTimetables(newTimetables.filter(t => !t.deletedAt));
      setSelectedTimetable(updated);
    }
  };

  const handleToggleFavorite = (id: string) => {
    const updated = timetables.map(t => 
      t.id === id ? { ...t, favorite: !t.favorite } : t
    );
    saveTimetables(updated);
    if (selectedTimetable?.id === id) {
      setSelectedTimetable({ ...selectedTimetable, favorite: !selectedTimetable.favorite });
    }
  };

  const handleDeleteClick = (id: string) => {
    setTimetableToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (timetableToDelete) {
      const saved = localStorage.getItem('timetables');
      if (saved) {
        const allTimetables = JSON.parse(saved) as TimetableType[];
        const updated = allTimetables.map(t => 
          t.id === timetableToDelete ? { ...t, deletedAt: new Date().toISOString() } : t
        );
        localStorage.setItem('timetables', JSON.stringify(updated));
        const activeTimetables = updated.filter(t => !t.deletedAt);
        setTimetables(activeTimetables.sort((a, b) => 
          b.favorite === a.favorite ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : b.favorite ? 1 : -1
        ));
        if (selectedTimetable?.id === timetableToDelete) {
          setSelectedTimetable(activeTimetables.length > 0 ? activeTimetables[0] : null);
        }
        toast.success("Timetable moved to recently deleted");
      }
    }
    setDeleteDialogOpen(false);
    setTimetableToDelete(null);
  };

  const handleStartEditing = (timetable: TimetableType) => {
    setIsEditing(true);
    setEditingTimetableId(timetable.id);
    setEditingTimetableSnapshot(JSON.parse(JSON.stringify(timetable)));
    setSelectedTimetable(timetable);
  };

  const handleSaveChanges = () => {
    if (editingTimetableId && selectedTimetable) {
      handleUpdateTimetable(selectedTimetable);
      setIsEditing(false);
      setEditingTimetableId(null);
      setEditingTimetableSnapshot(null);
      toast.success('Changes saved');
    }
  };

  const handleCancelEditing = () => {
    if (editingTimetableSnapshot) {
      setSelectedTimetable(editingTimetableSnapshot);
      const saved = localStorage.getItem('timetables');
      if (saved) {
        const allTimetables = JSON.parse(saved) as TimetableType[];
        const newTimetables = allTimetables.map(t => 
          t.id === editingTimetableSnapshot.id ? editingTimetableSnapshot : t
        );
        saveTimetables(newTimetables.filter(t => !t.deletedAt));
      }
    }
    setIsEditing(false);
    setEditingTimetableId(null);
    setEditingTimetableSnapshot(null);
  };

  const handleUpdateColorKey = (colorKey: Record<string, string>) => {
    if (selectedTimetable) {
      setSelectedTimetable({ ...selectedTimetable, colorKey });
    }
  };

  const handleUpdateRows = (rows: TimeSlot[]) => {
    if (selectedTimetable) {
      setSelectedTimetable({ ...selectedTimetable, rows });
    }
  };

  const handleUpdateColumns = (columns: string[]) => {
    if (selectedTimetable) {
      setSelectedTimetable({ ...selectedTimetable, columns });
    }
  };

  const toggleEditSection = (section: string) => {
    setExpandedEditSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <Home className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Timetables</h1>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Timetable
          </Button>
        </div>

        {timetables.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No timetables yet</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Create Your First Timetable
            </Button>
          </div>
        ) : (
          <div className="space-y-2 max-w-4xl mx-auto">
            {timetables.map((timetable) => (
              <Collapsible
                key={timetable.id}
                open={!collapsedTimetables.has(timetable.id)}
                onOpenChange={(open) => {
                  setCollapsedTimetables(prev => {
                    const newSet = new Set(prev);
                    if (open) {
                      newSet.delete(timetable.id);
                    } else {
                      newSet.add(timetable.id);
                    }
                    return newSet;
                  });
                }}
              >
                <div className="rounded-lg border transition-colors">
                  <CollapsibleTrigger asChild>
                    <div className="p-3 flex items-start justify-between gap-2 cursor-pointer hover:bg-accent/50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{timetable.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {timetable.type === 'weekly' ? 'Weekly' : 'Fortnightly'}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(timetable.id);
                          }}
                        >
                          <Star
                            className={`h-3 w-3 ${
                              timetable.favorite ? 'fill-yellow-400 text-yellow-400' : ''
                            }`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(timetable.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditing(timetable);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            collapsedTimetables.has(timetable.id) ? '-rotate-90' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 space-y-4 border-t">
                      {isEditing && selectedTimetable?.id === timetable.id && (
                        <div className="space-y-4">
                          {selectedTimetable.type === 'fortnightly' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentWeek(currentWeek === 1 ? 2 : 1)}
                            >
                              Switch to Week {currentWeek === 1 ? 2 : 1}
                            </Button>
                          )}

                          <div className="space-y-2">
                            <Collapsible
                              open={expandedEditSections.has('rows-cols')}
                              onOpenChange={() => toggleEditSection('rows-cols')}
                            >
                              <CollapsibleTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full justify-between">
                                  Edit Time Slots & Days
                                  <ChevronDown className={`h-4 w-4 transition-transform ${expandedEditSections.has('rows-cols') ? '' : '-rotate-90'}`} />
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pt-2">
                                <TimetableRowColEditor
                                  rows={selectedTimetable.rows}
                                  columns={selectedTimetable.columns}
                                  onUpdateRows={handleUpdateRows}
                                  onUpdateColumns={handleUpdateColumns}
                                />
                              </CollapsibleContent>
                            </Collapsible>

                            <Collapsible
                              open={expandedEditSections.has('colors')}
                              onOpenChange={() => toggleEditSection('colors')}
                            >
                              <CollapsibleTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full justify-between">
                                  Edit Color Key
                                  <ChevronDown className={`h-4 w-4 transition-transform ${expandedEditSections.has('colors') ? '' : '-rotate-90'}`} />
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pt-2">
                                <ColorKeyEditor
                                  colorKey={selectedTimetable.colorKey}
                                  onUpdate={handleUpdateColorKey}
                                  customColors={selectedTimetable.customColors}
                                />
                              </CollapsibleContent>
                            </Collapsible>
                          </div>

                          <div className="flex gap-2 border-t pt-4">
                            <Button onClick={handleSaveChanges} className="flex-1">
                              Save Changes
                            </Button>
                            <Button onClick={handleCancelEditing} variant="outline" className="flex-1">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center justify-between">
                          {timetable.type === 'fortnightly' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentWeek(currentWeek === 1 ? 2 : 1)}
                            >
                              Switch to Week {currentWeek === 1 ? 2 : 1}
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className={timetable.type !== 'fortnightly' ? 'ml-auto' : ''}>
                                <FileDown className="h-4 w-4 mr-2" />
                                Export
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-background z-50">
                              <DropdownMenuItem onClick={() => exportToPDF(timetable, currentWeek)}>
                                Export as PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => exportToExcel(timetable, currentWeek)}>
                                Export as Excel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}

                      {!isEditing && Object.keys(timetable.colorKey).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant={!focusedColor ? "default" : "outline"}
                            onClick={() => setFocusedColor(undefined)}
                          >
                            All
                          </Button>
                          {Object.entries(timetable.colorKey).map(([color, label]) => (
                            <Button
                              key={color}
                              size="sm"
                              variant={focusedColor === color ? "default" : "outline"}
                              onClick={() => setFocusedColor(color === focusedColor ? undefined : color)}
                              className="gap-2"
                            >
                              <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: color }}
                              />
                              {label}
                            </Button>
                          ))}
                        </div>
                      )}

                      {timetable.type === 'fortnightly' && (
                        <div className="text-center py-2 bg-muted rounded font-semibold">
                          Week {currentWeek}
                        </div>
                      )}

                      <TimetableGrid
                        timetable={isEditing && selectedTimetable?.id === timetable.id ? selectedTimetable : timetable}
                        currentWeek={currentWeek}
                        onUpdate={(updated) => {
                          if (isEditing && selectedTimetable?.id === timetable.id) {
                            setSelectedTimetable(updated);
                          } else {
                            handleUpdateTimetable(updated);
                          }
                        }}
                        isEditing={isEditing && selectedTimetable?.id === timetable.id}
                        focusedColor={focusedColor}
                      />
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )}

        <CreateTimetableDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onCreate={handleCreateTimetable}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Timetable</AlertDialogTitle>
              <AlertDialogDescription>
                This timetable will be moved to recently deleted. It will be permanently removed after 30 days.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Timetable;
