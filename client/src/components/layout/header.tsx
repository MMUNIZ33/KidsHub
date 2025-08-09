import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface HeaderProps {
  title: string;
  selectedClass?: string;
  onClassChange?: (classId: string) => void;
}

export default function Header({ title, selectedClass, onClassChange }: HeaderProps) {
  const { data: classes } = useQuery({
    queryKey: ["/api/classes"],
  });

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const currentTime = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className="bg-surface border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          
          {/* Quick filters */}
          {onClassChange && (
            <div className="ml-6 flex items-center space-x-4">
              <Select value={selectedClass || "all"} onValueChange={onClassChange}>
                <SelectTrigger className="w-48 bg-accent border-border">
                  <SelectValue placeholder="Todas as turmas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as turmas</SelectItem>
                  {classes?.map((classItem: any) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              3
            </Badge>
          </Button>
          
          {/* Date/Time */}
          <div className="text-sm text-muted-foreground text-right">
            <div className="font-medium">{currentDate}</div>
            <div className="text-xs">{currentTime}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
