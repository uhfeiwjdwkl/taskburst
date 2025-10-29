import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Star, Trash2, ChevronLeft, Home, Edit, Eye, Clock, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CreateTimetableDialog } from "@/components/CreateTimetableDialog";
import { TimetableGrid } from "@/components/TimetableGrid";
import { ColorKeyEditor } from "@/components/ColorKeyEditor";
import { Timetable as TimetableType } from "@/types/timetable";
import { toast } from "sonner";
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
  const [focusedColor, setFocusedColor] = useState<string | undefined>(undefined);
  const [collapsedTimetables, setCollapsedTimetables] = useState<Set<string>>(new Set());

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
        saveTimetables(activeTimetables);
        if (selectedTimetable?.id === timetableToDelete) {
          setSelectedTimetable(activeTimetables.length > 0 ? activeTimetables[0] : null);
        }
        toast.success("Timetable moved to recently deleted");
      }
    }
    setDeleteDialogOpen(false);
    setTimetableToDelete(null);
  };

  const handleUpdateColorKey = (colorKey: Record<string, string>) => {
    if (selectedTimetable) {
      handleUpdateTimetable({ ...selectedTimetable, colorKey });
    }
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/timetable/recently-deleted')}>
              <Clock className="h-4 w-4 mr-2" />
              Recently Deleted
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Timetable
            </Button>
          </div>
        </div>

        {timetables.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No timetables yet</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Create Your First Timetable
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[250px_1fr] gap-6">
            {/* Sidebar */}
            <div className="space-y-2">
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
                  <div
                    className={`rounded-lg border transition-colors ${
                      selectedTimetable?.id === timetable.id
                        ? 'bg-accent border-primary'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="p-3 flex items-start justify-between gap-2">
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setSelectedTimetable(timetable)}
                      >
                        <p className="font-medium truncate">{timetable.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {timetable.type === 'weekly' ? 'Weekly' : 'Fortnightly'}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ChevronDown
                              className={`h-3 w-3 transition-transform ${
                                collapsedTimetables.has(timetable.id) ? '-rotate-90' : ''
                              }`}
                            />
                          </Button>
                        </CollapsibleTrigger>
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
                      </div>
                    </div>
                    <CollapsibleContent>
                      <div className="px-3 pb-3 text-xs text-muted-foreground border-t pt-2 mt-2">
                        <div className="space-y-1">
                          <div>Periods: {timetable.rows.length}</div>
                          <div>Days: {timetable.columns.join(', ')}</div>
                          {Object.keys(timetable.colorKey).length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {Object.entries(timetable.colorKey).map(([color, label]) => (
                                <div key={color} className="flex items-center gap-1">
                                  <div
                                    className="w-2 h-2 rounded"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="text-[10px]">{label}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>

            {/* Main Content */}
            {selectedTimetable && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">{selectedTimetable.name}</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          View Mode
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {selectedTimetable.type === 'fortnightly' && (
                  <div className="flex items-center justify-between">
                    <div />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentWeek(currentWeek === 1 ? 2 : 1)}
                    >
                      Switch to Week {currentWeek === 1 ? 2 : 1}
                    </Button>
                  </div>
                )}

                {isEditing && (
                  <ColorKeyEditor
                    colorKey={selectedTimetable.colorKey}
                    onUpdate={handleUpdateColorKey}
                  />
                )}

                {Object.keys(selectedTimetable.colorKey).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={!focusedColor ? "default" : "outline"}
                      onClick={() => setFocusedColor(undefined)}
                    >
                      All
                    </Button>
                    {Object.entries(selectedTimetable.colorKey).map(([color, label]) => (
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

                <TimetableGrid
                  timetable={selectedTimetable}
                  currentWeek={currentWeek}
                  onUpdate={handleUpdateTimetable}
                  isEditing={isEditing}
                  focusedColor={focusedColor}
                />
              </div>
            )}
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
