import { List } from '@/types/list';
import { Card } from '@/components/ui/card';
import { Star, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ListCardProps {
  list: List;
  onClick: () => void;
  isDragging?: boolean;
}

export const ListCard = ({ list, onClick, isDragging }: ListCardProps) => {
  const completedCount = list.items.filter(item => item.completed).length;
  const totalCount = list.items.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card 
      className={`p-4 cursor-pointer hover:shadow-lg transition-all ${isDragging ? 'opacity-50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg truncate">{list.title}</h3>
            {list.favorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />}
          </div>
          
          {list.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {list.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {totalCount} {totalCount === 1 ? 'item' : 'items'}
            </Badge>
            
            {completedCount > 0 && (
              <Badge variant="outline" className="text-xs gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {completedCount}/{totalCount} done
              </Badge>
            )}
            
            {list.dueDateTime && (
              <Badge variant="outline" className="text-xs">
                Due: {new Date(list.dueDateTime).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="text-2xl font-bold text-primary">
            {Math.round(completionPercentage)}%
          </div>
          <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
