import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ChildForm from "@/components/child-form";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  MessageCircle,
  UserPlus,
  Calendar
} from "lucide-react";
import { getInitials, calculateAge, formatDate } from "@/lib/utils";
import type { Child } from "@shared/schema";

export default function Children() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [showChildForm, setShowChildForm] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

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

  const { data: children, isLoading: childrenLoading } = useQuery({
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

  const deleteChildMutation = useMutation({
    mutationFn: async (childId: string) => {
      await apiRequest("DELETE", `/api/children/${childId}`);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Criança removida com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao remover criança",
        variant: "destructive",
      });
    },
  });

  const filteredChildren = children?.filter((child: Child) => {
    const matchesSearch = child.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !selectedClass || child.classId === selectedClass;
    return matchesSearch && matchesClass;
  });

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    setShowChildForm(true);
  };

  const handleDelete = (childId: string) => {
    if (window.confirm('Tem certeza que deseja remover esta criança?')) {
      deleteChildMutation.mutate(childId);
    }
  };

  const handleFormClose = () => {
    setShowChildForm(false);
    setEditingChild(null);
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          title="Crianças" 
          selectedClass={selectedClass}
          onClassChange={setSelectedClass}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar crianças..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
            
            <Dialog open={showChildForm} onOpenChange={setShowChildForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Criança
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingChild ? 'Editar Criança' : 'Nova Criança'}
                  </DialogTitle>
                </DialogHeader>
                <ChildForm 
                  child={editingChild}
                  onSuccess={handleFormClose}
                  onCancel={handleFormClose}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-foreground">
                      {children?.length || 0}
                    </p>
                  </div>
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Presentes Hoje</p>
                    <p className="text-2xl font-bold text-foreground">0</p>
                  </div>
                  <Calendar className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ausentes</p>
                    <p className="text-2xl font-bold text-foreground">0</p>
                  </div>
                  <Calendar className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Aniversariantes</p>
                    <p className="text-2xl font-bold text-foreground">0</p>
                  </div>
                  <Calendar className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Children Grid */}
          {childrenLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-surface border-border animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-muted rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredChildren?.length === 0 ? (
            <Card className="bg-surface border-border">
              <CardContent className="p-12 text-center">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhuma criança encontrada
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedClass 
                    ? "Tente ajustar os filtros ou busca"
                    : "Comece adicionando a primeira criança"
                  }
                </p>
                <Button onClick={() => setShowChildForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Criança
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChildren?.map((child: Child) => {
                const childClass = classes?.find((c: any) => c.id === child.classId);
                
                return (
                  <Card key={child.id} className="bg-surface border-border hover:border-primary/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {getInitials(child.fullName)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {child.fullName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {child.birthDate ? `${calculateAge(child.birthDate)} anos` : ''}
                            </p>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(child)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Enviar Mensagem
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(child.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="space-y-2">
                        {childClass && (
                          <Badge variant="secondary" className="text-xs">
                            {childClass.name}
                          </Badge>
                        )}
                        
                        {child.birthDate && (
                          <p className="text-xs text-muted-foreground">
                            Nascimento: {formatDate(child.birthDate)}
                          </p>
                        )}
                        
                        {child.allergies && (
                          <p className="text-xs text-warning">
                            Alergias: {child.allergies}
                          </p>
                        )}
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
