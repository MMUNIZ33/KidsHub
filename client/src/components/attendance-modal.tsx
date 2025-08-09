import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getInitials, calculateAge } from "@/lib/utils";
import { UserCheck, UserX } from "lucide-react";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId?: string;
}

export default function AttendanceModal({ isOpen, onClose, classId }: AttendanceModalProps) {
  const [attendance, setAttendance] = useState<Record<string, 'presente' | 'ausente'>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: children } = useQuery({
    queryKey: ["/api/children", { classId }],
    enabled: isOpen && !!classId,
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: async (attendanceData: Record<string, 'presente' | 'ausente'>) => {
      // This would save attendance for the current date
      const today = new Date().toISOString().split('T')[0];
      
      for (const [childId, status] of Object.entries(attendanceData)) {
        await apiRequest("POST", "/api/attendance/class", {
          classMeetingId: "current", // This should be created/found based on today's date
          childId,
          status,
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Chamada salva com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onClose();
      setAttendance({});
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao salvar a chamada",
        variant: "destructive",
      });
    },
  });

  const handleAttendanceChange = (childId: string, status: 'presente' | 'ausente') => {
    setAttendance(prev => ({
      ...prev,
      [childId]: status
    }));
  };

  const handleSave = () => {
    saveAttendanceMutation.mutate(attendance);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Chamada - Turma Kids (6-8 anos)
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-96">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children?.map((child: any) => (
              <div key={child.id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-medium text-sm">
                      {getInitials(child.fullName)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{child.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {child.birthDate ? `${calculateAge(child.birthDate)} anos` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant={attendance[child.id] === 'presente' ? "default" : "outline"}
                    onClick={() => handleAttendanceChange(child.id, 'presente')}
                    className={attendance[child.id] === 'presente' ? 
                      "bg-success text-white hover:bg-success/80" : 
                      "hover:bg-success/10 hover:text-success"
                    }
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Presente
                  </Button>
                  <Button
                    size="sm"
                    variant={attendance[child.id] === 'ausente' ? "default" : "outline"}
                    onClick={() => handleAttendanceChange(child.id, 'ausente')}
                    className={attendance[child.id] === 'ausente' ? 
                      "bg-error text-white hover:bg-error/80" : 
                      "hover:bg-error/10 hover:text-error"
                    }
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Ausente
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saveAttendanceMutation.isPending || Object.keys(attendance).length === 0}
          >
            {saveAttendanceMutation.isPending ? "Salvando..." : "Salvar e Sugerir Mensagens"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
