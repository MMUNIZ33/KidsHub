import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AttendanceModal from "@/components/attendance-modal";
import { 
  CalendarIcon, 
  CheckSquare, 
  Church, 
  Users, 
  UserCheck,
  UserX,
  Plus
} from "lucide-react";
import { formatDate, getInitials, calculateAge } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Attendance() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState("");
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceType, setAttendanceType] = useState<'class' | 'worship'>('class');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você não está logado. Redirecionando...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: classes } = useQuery({
    queryKey: ["/api/classes"],
    enabled: isAuthenticated,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi deslogado. Redirecionando...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const { data: children } = useQuery({
    queryKey: ["/api/children"],
    enabled: isAuthenticated,
  });

  const { data: classAttendance } = useQuery({
    queryKey: ["/api/attendance/class", formatDate(selectedDate, 'yyyy-MM-dd')],
    enabled: isAuthenticated,
  });

  const { data: worshipAttendance } = useQuery({
    queryKey: ["/api/attendance/worship", formatDate(selectedDate, 'yyyy-MM-dd')],
    enabled: isAuthenticated,
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async ({ childId, status, type }: { childId: string; status: string; type: 'class' | 'worship' }) => {
      const endpoint = type === 'class' ? '/api/attendance/class' : '/api/attendance/worship';
      const meetingId = type === 'class' ? 'current-meeting' : 'current-worship';
      
      await apiRequest("POST", endpoint, {
        [type === 'class' ? 'classMeetingId' : 'worshipServiceId']: meetingId,
        childId,
        status,
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Presença registrada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao registrar presença",
        variant: "destructive",
      });
    },
  });

  const filteredChildren = children?.filter((child: any) => {
    return !selectedClass || child.classId === selectedClass;
  });

  const getAttendanceStatus = (childId: string, type: 'class' | 'worship') => {
    const attendance = type === 'class' ? classAttendance : worshipAttendance;
    const record = attendance?.find((a: any) => a.childId === childId);
    return record?.status || 'não_registrado';
  };

  const handleQuickAttendance = (childId: string, status: 'presente' | 'ausente', type: 'class' | 'worship') => {
    markAttendanceMutation.mutate({ childId, status, type });
  };

  const getAttendanceStats = (type: 'class' | 'worship') => {
    const attendance = type === 'class' ? classAttendance : worshipAttendance;
    if (!attendance || !filteredChildren) return { present: 0, absent: 0, total: 0 };
    
    const present = attendance.filter((a: any) => a.status === 'presente').length;
    const absent = attendance.filter((a: any) => a.status === 'ausente').length;
    const total = filteredChildren.length;
    
    return { present, absent, total };
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const classStats = getAttendanceStats('class');
  const worshipStats = getAttendanceStats('worship');

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          title="Chamada" 
          selectedClass={selectedClass}
          onClassChange={setSelectedClass}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Date and Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-60 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <Button 
              onClick={() => {
                setAttendanceType('class');
                setShowAttendanceModal(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Fazer Chamada
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Presentes - Aula</p>
                    <p className="text-2xl font-bold text-foreground">{classStats.present}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ausentes - Aula</p>
                    <p className="text-2xl font-bold text-foreground">{classStats.absent}</p>
                  </div>
                  <UserX className="h-8 w-8 text-error" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Presentes - Culto</p>
                    <p className="text-2xl font-bold text-foreground">{worshipStats.present}</p>
                  </div>
                  <Church className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Crianças</p>
                    <p className="text-2xl font-bold text-foreground">{filteredChildren?.length || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Tabs */}
          <Tabs defaultValue="class" className="space-y-6">
            <TabsList>
              <TabsTrigger value="class" className="flex items-center">
                <CheckSquare className="mr-2 h-4 w-4" />
                Chamada de Aula
              </TabsTrigger>
              <TabsTrigger value="worship" className="flex items-center">
                <Church className="mr-2 h-4 w-4" />
                Chamada de Culto
              </TabsTrigger>
            </TabsList>

            <TabsContent value="class" className="space-y-6">
              <Card className="bg-surface border-border">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Chamada de Aula - {format(selectedDate, "dd/MM/yyyy")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!filteredChildren || filteredChildren.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {selectedClass ? "Nenhuma criança encontrada nesta turma" : "Selecione uma turma para ver as crianças"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredChildren.map((child: any) => {
                        const status = getAttendanceStatus(child.id, 'class');
                        const classItem = classes?.find((c: any) => c.id === child.classId);
                        
                        return (
                          <div key={child.id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {getInitials(child.fullName)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{child.fullName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {classItem?.name} • {child.birthDate ? `${calculateAge(child.birthDate)} anos` : ''}
                                </p>
                                {status !== 'não_registrado' && (
                                  <Badge 
                                    variant={status === 'presente' ? 'default' : 'destructive'}
                                    className="text-xs mt-1"
                                  >
                                    {status === 'presente' ? 'Presente' : 'Ausente'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant={status === 'presente' ? 'default' : 'outline'}
                                onClick={() => handleQuickAttendance(child.id, 'presente', 'class')}
                                className={status === 'presente' ? 
                                  'bg-success text-white hover:bg-success/80' : 
                                  'hover:bg-success/10 hover:text-success'
                                }
                                disabled={markAttendanceMutation.isPending}
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={status === 'ausente' ? 'default' : 'outline'}
                                onClick={() => handleQuickAttendance(child.id, 'ausente', 'class')}
                                className={status === 'ausente' ? 
                                  'bg-error text-white hover:bg-error/80' : 
                                  'hover:bg-error/10 hover:text-error'
                                }
                                disabled={markAttendanceMutation.isPending}
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="worship" className="space-y-6">
              <Card className="bg-surface border-border">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Chamada de Culto - {format(selectedDate, "dd/MM/yyyy")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!filteredChildren || filteredChildren.length === 0 ? (
                    <div className="text-center py-8">
                      <Church className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {selectedClass ? "Nenhuma criança encontrada nesta turma" : "Selecione uma turma para ver as crianças"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredChildren.map((child: any) => {
                        const status = getAttendanceStatus(child.id, 'worship');
                        const classItem = classes?.find((c: any) => c.id === child.classId);
                        
                        return (
                          <div key={child.id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {getInitials(child.fullName)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{child.fullName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {classItem?.name} • {child.birthDate ? `${calculateAge(child.birthDate)} anos` : ''}
                                </p>
                                {status !== 'não_registrado' && (
                                  <Badge 
                                    variant={status === 'presente' ? 'default' : 'destructive'}
                                    className="text-xs mt-1"
                                  >
                                    {status === 'presente' ? 'Presente' : 'Ausente'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant={status === 'presente' ? 'default' : 'outline'}
                                onClick={() => handleQuickAttendance(child.id, 'presente', 'worship')}
                                className={status === 'presente' ? 
                                  'bg-success text-white hover:bg-success/80' : 
                                  'hover:bg-success/10 hover:text-success'
                                }
                                disabled={markAttendanceMutation.isPending}
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={status === 'ausente' ? 'default' : 'outline'}
                                onClick={() => handleQuickAttendance(child.id, 'ausente', 'worship')}
                                className={status === 'ausente' ? 
                                  'bg-error text-white hover:bg-error/80' : 
                                  'hover:bg-error/10 hover:text-error'
                                }
                                disabled={markAttendanceMutation.isPending}
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Attendance Modal */}
      <AttendanceModal 
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        classId={selectedClass}
      />
    </div>
  );
}
