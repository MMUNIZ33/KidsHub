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
  BookOpen, 
  Search, 
  Trophy,
  Clock,
  XCircle,
  MessageCircle,
  Lightbulb
} from "lucide-react";
import { getInitials } from "@/lib/utils";

export default function Verses() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedVerse, setSelectedVerse] = useState("");
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

  const { data: verses } = useQuery({
    queryKey: ["/api/verses"],
    enabled: isAuthenticated,
  });

  const { data: memorizations } = useQuery({
    queryKey: ["/api/verses/memorizations"],
    enabled: isAuthenticated,
  });

  const updateMemorizationMutation = useMutation({
    mutationFn: async ({ childId, bibleVerseId, status, observation }: { 
      childId: string; 
      bibleVerseId: string;
      status: string; 
      observation?: string;
    }) => {
      await apiRequest("POST", "/api/verses/memorizations", {
        childId,
        bibleVerseId,
        status,
        observation,
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Status da memorização atualizado",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/verses/memorizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar status da memorização",
        variant: "destructive",
      });
    },
  });

  const filteredChildren = children?.filter((child: any) => {
    const matchesSearch = child.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !selectedClass || child.classId === selectedClass;
    return matchesSearch && matchesClass;
  });

  const getMemorizationStatus = (childId: string, verseId: string) => {
    const memorization = memorizations?.find((m: any) => 
      m.childId === childId && m.bibleVerseId === verseId
    );
    return memorization?.status || 'nao_memorizou';
  };

  const getStatusStats = () => {
    if (!filteredChildren || !verses || !memorizations) {
      return { memorizou: 0, em_andamento: 0, nao_memorizou: 0 };
    }
    
    const stats = { memorizou: 0, em_andamento: 0, nao_memorizou: 0 };
    
    filteredChildren.forEach((child: any) => {
      verses.forEach((verse: any) => {
        const status = getMemorizationStatus(child.id, verse.id);
        if (status in stats) {
          stats[status as keyof typeof stats]++;
        } else {
          stats.nao_memorizou++;
        }
      });
    });
    
    return stats;
  };

  const handleStatusChange = (childId: string, verseId: string, status: string) => {
    updateMemorizationMutation.mutate({ 
      childId, 
      bibleVerseId: verseId, 
      status 
    });
  };

  const handleBulkStatusChange = (status: string) => {
    if (!filteredChildren || !selectedVerse) {
      toast({
        title: "Seleção necessária",
        description: "Selecione um versículo para atualização em lote",
        variant: "destructive",
      });
      return;
    }
    
    const childrenToUpdate = filteredChildren.filter((child: any) => {
      const currentStatus = getMemorizationStatus(child.id, selectedVerse);
      return currentStatus !== status;
    });

    if (childrenToUpdate.length === 0) {
      toast({
        title: "Nenhuma alteração",
        description: "Todas as crianças já possuem este status para este versículo",
      });
      return;
    }

    if (window.confirm(`Atualizar status para "${status}" para ${childrenToUpdate.length} criança(s)?`)) {
      childrenToUpdate.forEach((child: any) => {
        updateMemorizationMutation.mutate({ 
          childId: child.id, 
          bibleVerseId: selectedVerse, 
          status 
        });
      });
    }
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const stats = getStatusStats();
  const currentVerse = verses?.find((v: any) => v.id === selectedVerse);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          title="Versículos" 
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
              
              <Select value={selectedVerse} onValueChange={setSelectedVerse}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Selecionar versículo" />
                </SelectTrigger>
                <SelectContent>
                  {verses?.map((verse: any) => (
                    <SelectItem key={verse.id} value={verse.id}>
                      {verse.reference}
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
                  <SelectItem value="memorizou">Memorizou</SelectItem>
                  <SelectItem value="em_andamento">Em andamento</SelectItem>
                  <SelectItem value="nao_memorizou">Não memorizou</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkStatusChange('memorizou')}
                className="bg-success/10 text-success hover:bg-success/20"
                disabled={!selectedVerse}
              >
                Marcar Todos Memorizaram
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-primary/10 text-primary hover:bg-primary/20"
                disabled={!selectedVerse}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Enviar Incentivos
              </Button>
            </div>
          </div>

          {/* Current Verse Info */}
          {currentVerse && (
            <Card className="bg-surface border-border mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-primary" />
                  {currentVerse.reference}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <blockquote className="text-foreground italic border-l-4 border-primary pl-4">
                    "{currentVerse.text}"
                  </blockquote>
                  {currentVerse.weekReference && (
                    <p className="text-sm text-muted-foreground">
                      Semana: {currentVerse.weekReference}
                    </p>
                  )}
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
                    <p className="text-sm font-medium text-muted-foreground">Memorizaram</p>
                    <p className="text-2xl font-bold text-foreground">{stats.memorizou}</p>
                  </div>
                  <Trophy className="h-8 w-8 text-success" />
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
                    <p className="text-sm font-medium text-muted-foreground">Não Memorizaram</p>
                    <p className="text-2xl font-bold text-foreground">{stats.nao_memorizou}</p>
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
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Verses List */}
          {!selectedVerse ? (
            <Card className="bg-surface border-border">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Selecione um versículo
                </h3>
                <p className="text-muted-foreground mb-4">
                  Escolha um versículo acima para ver o progresso das crianças
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  {verses?.slice(0, 6).map((verse: any) => (
                    <Card key={verse.id} className="bg-accent border-border cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedVerse(verse.id)}>
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-foreground mb-2">{verse.reference}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          "{verse.text}"
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : !filteredChildren || filteredChildren.length === 0 ? (
            <Card className="bg-surface border-border">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
                  return getMemorizationStatus(child.id, selectedVerse) === statusFilter;
                })
                .map((child: any) => {
                  const status = getMemorizationStatus(child.id, selectedVerse);
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
                              status === 'memorizou' ? 'default' :
                              status === 'em_andamento' ? 'secondary' : 'destructive'
                            }
                            className={
                              status === 'memorizou' ? 'bg-success text-white' :
                              status === 'em_andamento' ? 'bg-warning text-white' :
                              'bg-error text-white'
                            }
                          >
                            {status === 'memorizou' ? 'Memorizou' :
                             status === 'em_andamento' ? 'Em andamento' : 'Não memorizou'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={status === 'memorizou' ? 'default' : 'outline'}
                              onClick={() => handleStatusChange(child.id, selectedVerse, 'memorizou')}
                              className={status === 'memorizou' ? 
                                'bg-success text-white hover:bg-success/80 flex-1' : 
                                'hover:bg-success/10 hover:text-success flex-1'
                              }
                              disabled={updateMemorizationMutation.isPending}
                            >
                              <Trophy className="h-4 w-4 mr-1" />
                              Memorizou
                            </Button>
                            <Button
                              size="sm"
                              variant={status === 'em_andamento' ? 'default' : 'outline'}
                              onClick={() => handleStatusChange(child.id, selectedVerse, 'em_andamento')}
                              className={status === 'em_andamento' ? 
                                'bg-warning text-white hover:bg-warning/80 flex-1' : 
                                'hover:bg-warning/10 hover:text-warning flex-1'
                              }
                              disabled={updateMemorizationMutation.isPending}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Em Andamento
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant={status === 'nao_memorizou' ? 'default' : 'outline'}
                            onClick={() => handleStatusChange(child.id, selectedVerse, 'nao_memorizou')}
                            className={status === 'nao_memorizou' ? 
                              'bg-error text-white hover:bg-error/80 w-full' : 
                              'hover:bg-error/10 hover:text-error w-full'
                            }
                            disabled={updateMemorizationMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Não Memorizou
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
