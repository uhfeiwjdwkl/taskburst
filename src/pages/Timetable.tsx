import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Star, Trash2, ChevronLeft, Home } from "lucide-react";
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

const Timetable = () => {
  const navigate = useNavigate();
  const [timetables, setTimetables] = useState<TimetableType[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<TimetableType | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [timetableToDelete, setTimetableToDelete] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState<1 | 2>(1); // for fortnightly view

  useEffect(() => {
    const saved = localStorage.getItem('timetables');
    if (saved) {
      const parsed = JSON.parse(saved) as TimetableType[];
      setTimetables(parsed.sort((a, b) => 
        b.favorite === a.favorite ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : b.favorite ? 1 : -1
      ));
      if (parsed.length > 0 && !selectedTimetable) {
        setSelectedTimetable(parsed[0]);
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
    const newTimetables = timetables.map(t => t.id === updated.id ? updated : t);
    saveTimetables(newTimetables);
    setSelectedTimetable(updated);
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
      const updated = timetables.filter(t => t.id !== timetableToDelete);
      saveTimetables(updated);
      if (selectedTimetable?.id === timetableToDelete) {
        setSelectedTimetable(updated.length > 0 ? updated[0] : null);
      }
      toast.success("Timetable deleted");
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
          <div className="grid lg:grid-cols-[250px_1fr] gap-6">
            {/* Sidebar */}
            <div className="space-y-2">
              {timetables.map((timetable) => (
                <div
                  key={timetable.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTimetable?.id === timetable.id
                      ? 'bg-accent border-primary'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => setSelectedTimetable(timetable)}
                >
                  <div className="flex items-start justify-between gap-2">
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
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Content */}
            {selectedTimetable && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">{selectedTimetable.name}</h2>
                  {selectedTimetable.type === 'fortnightly' && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentWeek(currentWeek === 1 ? 2 : 1)}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Week {currentWeek === 1 ? 2 : 1}
                      </Button>
                      <span className="font-medium">Week {currentWeek}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentWeek(currentWeek === 1 ? 2 : 1)}
                      >
                        Week {currentWeek === 1 ? 2 : 1}
                        <ChevronLeft className="h-4 w-4 ml-1 rotate-180" />
                      </Button>
                    </div>
                  )}
                </div>

                <ColorKeyEditor
                  colorKey={selectedTimetable.colorKey}
                  onUpdate={handleUpdateColorKey}
                />

                <TimetableGrid
                  timetable={selectedTimetable}
                  currentWeek={currentWeek}
                  onUpdate={handleUpdateTimetable}
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
                Are you sure you want to delete this timetable? This action cannot be undone.
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
