import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Undo2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Timetable } from "@/types/timetable";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";

const TimetableRecentlyDeleted = () => {
  const navigate = useNavigate();
  const [deletedTimetables, setDeletedTimetables] = useState<Timetable[]>([]);
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState<Timetable | null>(null);

  useEffect(() => {
    loadDeletedTimetables();
  }, []);

  const loadDeletedTimetables = () => {
    const saved = localStorage.getItem('timetables');
    if (saved) {
      const allTimetables = JSON.parse(saved) as Timetable[];
      const deleted = allTimetables
        .filter(t => t.deletedAt)
        .filter(t => {
          const deletedDate = new Date(t.deletedAt!);
          const daysSinceDeleted = Math.floor((Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysSinceDeleted < 30;
        })
        .sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());
      setDeletedTimetables(deleted);

      // Auto-purge old items
      if (deleted.length < allTimetables.filter(t => t.deletedAt).length) {
        const retained = allTimetables.filter(t => {
          if (!t.deletedAt) return true;
          const deletedDate = new Date(t.deletedAt);
          const daysSinceDeleted = Math.floor((Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysSinceDeleted < 30;
        });
        localStorage.setItem('timetables', JSON.stringify(retained));
      }
    }
  };

  const saveAllTimetables = (timetables: Timetable[]) => {
    localStorage.setItem('timetables', JSON.stringify(timetables));
    loadDeletedTimetables();
  };

  const handleRestore = (timetable: Timetable) => {
    const saved = localStorage.getItem('timetables');
    if (saved) {
      const allTimetables = JSON.parse(saved) as Timetable[];
      const updated = allTimetables.map(t =>
        t.id === timetable.id ? { ...t, deletedAt: undefined } : t
      );
      saveAllTimetables(updated);
      toast.success("Timetable restored");
    }
  };

  const handlePermanentDeleteClick = (timetable: Timetable) => {
    setSelectedTimetable(timetable);
    setPermanentDeleteDialogOpen(true);
  };

  const handlePermanentDeleteConfirm = () => {
    if (selectedTimetable) {
      const saved = localStorage.getItem('timetables');
      if (saved) {
        const allTimetables = JSON.parse(saved) as Timetable[];
        const updated = allTimetables.filter(t => t.id !== selectedTimetable.id);
        saveAllTimetables(updated);
        toast.success("Timetable permanently deleted");
      }
    }
    setPermanentDeleteDialogOpen(false);
    setSelectedTimetable(null);
  };

  const getDaysRemaining = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const daysSinceDeleted = Math.floor((Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
    return 30 - daysSinceDeleted;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/timetable')}>
              <Home className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Recently Deleted Timetables</h1>
          </div>
        </div>

        {deletedTimetables.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No recently deleted timetables</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Timetables are automatically deleted after 30 days
            </p>
            {deletedTimetables.map((timetable) => (
              <Card key={timetable.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{timetable.name}</CardTitle>
                      <CardDescription>
                        {timetable.type === 'weekly' ? 'Weekly' : 'Fortnightly'} • 
                        Deleted {formatDistanceToNow(new Date(timetable.deletedAt!))} ago • 
                        {getDaysRemaining(timetable.deletedAt!)} days remaining
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(timetable)}
                      >
                        <Undo2 className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handlePermanentDeleteClick(timetable)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Forever
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {timetable.rows.length} time slots • {timetable.columns.join(', ')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={permanentDeleteDialogOpen} onOpenChange={setPermanentDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Permanently Delete Timetable</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{selectedTimetable?.name}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handlePermanentDeleteConfirm}>Delete Forever</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default TimetableRecentlyDeleted;
