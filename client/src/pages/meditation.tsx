import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { 
  Heart, 
  Search, 
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  Calendar,
  MessageCircle
} from "lucide-react";
import { getInitials, getCurrentWeekReference } from "@/lib/utils";

export default function Meditation() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekReference());
  const [statusFilter, setStatusFilter] = useState("all");

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

  const { data: children } = useQuery({
    queryKey: ["/api/children"],
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

  const { data: classes } = useQuery({
    queryKey: ["/api/classes"],
    enabled: isAuthenticated,
  });

  const { data: meditationWeeks } = useQuery({
    queryKey: ["/api/meditations/weeks"],
    enabled: isAuthenticated,
  });

  const { data: meditations } = useQuery({
    queryKey: ["/api/meditations/current"],
    enabled: isAuthenticated,
  });

  const updateMeditationMutation = useMutation({
    mutationFn: async ({ childId, status, observation }: { childId: string; status: string; observation?: string }) => {
      await apiRequest("POST", "/api/meditations/status", {
        childId,
        meditationWeekId: selectedWeek,
        status,
        observation,
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Status da meditação atualizado",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meditations/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar status da meditação",
        variant: "destructive",
      });
    },
  });

  const filteredChildren = children?.filter((child: any) => {
    const matchesSearch = child.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !selectedClass || child.classId === selectedClass;
    return matchesSearch && matchesClass;
  });

  const getMeditationStatus = (childId: string) => {
    const meditation = meditations?.find((m: any) => m.childId === childId);
    return meditation?.status || 'nao_entregou';
  };

  const getStatusStats = () => {
    if (!filteredChildren || !meditations) return { entregou: 0, em_andamento: 0, nao_entregou: 0 };
    
    const stats = { entregou: 0, em_andamento: 0, nao_entregou: 0 };
    
    filteredChildren.forEach((child: any) => {
      const status = getMeditationStatus(child.id);
      if (status in stats) {
        stats[status as keyof typeof stats]++;
      } else {
        stats.nao_entregou++;
      }
    });
    
    return stats;
  };

  const handleStatusChange = (childId: string, status: string) => {
    updateMeditationMutation.mutate({ childId, status });
  };

  const handleBulkStatusChange = (status: string) => {
    if (!filteredChildren) return;
    
    const childrenToUpdate = filteredChildren.filter((child: any) => {
      const currentStatus = getMeditationStatus(child.id);
      return currentStatus !== status;
    });

    if (childrenToUpdate.length === 0) {
      toast({
        title: "Nenhuma alteração",
        description: "Todas as crianças já possuem este status",
      });
      return;
    }

    if (window.confirm(`Atualizar status para "${status}" para ${childrenToUpdate.length} criança(s)?`)) {
      childrenToUpdate.forEach((child: any) => {
        updateMeditationMutation.mutate({ childId: child.id, status });
      });
    }
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const stats = getStatusStats();
  const currentWeek = meditationWeeks?.find((w: any) => w.weekReference === selectedWeek);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          title="Meditação" 
          selectedClass={selectedClass}
          onClassChange={setSelectedClass}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Filters and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar crianças..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecionar semana" />
                </SelectTrigger>
                <SelectContent>
                  {meditationWeeks?.map((week: any) => (
                    <SelectItem key={week.id} value={week.weekReference}>
                      {week.weekReference} - {week.theme}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="entregou">Entregou</SelectItem>
                  <SelectItem value="em_andamento">Em andamento</SelectItem>
                  <SelectItem value="nao_entregou">Não entregou</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkStatusChange('entregou')}
                className="bg-success/10 text-success hover:bg-success/20"
              >
                Marcar Todas Entregues
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkStatusChange('nao_entregou')}
                className="bg-error/10 text-error hover:bg-error/20"
              >
                Marcar Todas Pendentes
              </Button>
            </div>
          </div>

          {/* Current Week Info */}
          {currentWeek && (
            <Card className="bg-surface border-border mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="mr-2 h-5 w-5 text-primary" />
                  {currentWeek.theme} - {selectedWeek}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    {currentWeek.materialLink && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Material: <a href={currentWeek.materialLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {currentWeek.materialLink}
                        </a>
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Anexos permitidos: {currentWeek.allowsAttachments ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Enviar Lembretes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Entregaram</p>
                    <p className="text-2xl font-bold text-foreground">{stats.entregou}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                    <p className="text-2xl font-bold text-foreground">{stats.em_andamento}</p>
                  </div>
                  <Clock className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Não Entregaram</p>
                    <p className="text-2xl font-bold text-foreground">{stats.nao_entregou}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-error" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-foreground">{filteredChildren?.length || 0}</p>
                  </div>
                  <Heart className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Children Grid */}
          {!filteredChildren || filteredChildren.length === 0 ? (
            <Card className="bg-surface border-border">
              <CardContent className="p-12 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhuma criança encontrada
                </h3>
                <p className="text-muted-foreground">
                  Tente ajustar os filtros de busca
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChildren
                .filter((child: any) => {
                  if (statusFilter === 'all') return true;
                  return getMeditationStatus(child.id) === statusFilter;
                })
                .map((child: any) => {
                  const status = getMeditationStatus(child.id);
                  const classItem = classes?.find((c: any) => c.id === child.classId);
                  
                  return (
                    <Card key={child.id} className="bg-surface border-border">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {getInitials(child.fullName)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{child.fullName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {classItem?.name}
                            </p>
                          </div>
                          <Badge 
                            variant={
                              status === 'entregou' ? 'default' :
                              status === 'em_andamento' ? 'secondary' : 'destructive'
                            }
                            className={
                              status === 'entregou' ? 'bg-success text-white' :
                              status === 'em_andamento' ? 'bg-warning text-white' :
                              'bg-error text-white'
                            }
                          >
                            {status === 'entregou' ? 'Entregou' :
                             status === 'em_andamento' ? 'Em andamento' : 'Não entregou'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={status === 'entregou' ? 'default' : 'outline'}
                              onClick={() => handleStatusChange(child.id, 'entregou')}
                              className={status === 'entregou' ? 
                                'bg-success text-white hover:bg-success/80 flex-1' : 
                                'hover:bg-success/10 hover:text-success flex-1'
                              }
                              disabled={updateMeditationMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Entregou
                            </Button>
                            <Button
                              size="sm"
                              variant={status === 'em_andamento' ? 'default' : 'outline'}
                              onClick={() => handleStatusChange(child.id, 'em_andamento')}
                              className={status === 'em_andamento' ? 
                                'bg-warning text-white hover:bg-warning/80 flex-1' : 
                                'hover:bg-warning/10 hover:text-warning flex-1'
                              }
                              disabled={updateMeditationMutation.isPending}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Em Andamento
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant={status === 'nao_entregou' ? 'default' : 'outline'}
                            onClick={() => handleStatusChange(child.id, 'nao_entregou')}
                            className={status === 'nao_entregou' ? 
                              'bg-error text-white hover:bg-error/80 w-full' : 
                              'hover:bg-error/10 hover:text-error w-full'
                            }
                            disabled={updateMeditationMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Não Entregou
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
