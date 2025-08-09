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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Users,
  CheckSquare,
  BookOpen
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClassSchema, type Class, type InsertClass } from "@shared/schema";

export default function Classes() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showClassForm, setShowClassForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

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

  const { data: classes, isLoading: classesLoading } = useQuery({
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

  const form = useForm<InsertClass>({
    resolver: zodResolver(insertClassSchema),
    defaultValues: {
      name: "",
      room: "",
      observations: "",
    },
  });

  const createClassMutation = useMutation({
    mutationFn: async (data: InsertClass) => {
      if (editingClass) {
        await apiRequest("PUT", `/api/classes/${editingClass.id}`, data);
      } else {
        await apiRequest("POST", "/api/classes", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: editingClass ? "Turma atualizada com sucesso" : "Turma criada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setShowClassForm(false);
      setEditingClass(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao salvar turma",
        variant: "destructive",
      });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (classId: string) => {
      await apiRequest("DELETE", `/api/classes/${classId}`);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Turma removida com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao remover turma",
        variant: "destructive",
      });
    },
  });

  const filteredClasses = classes?.filter((classItem: Class) => {
    return classItem.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getChildrenCount = (classId: string) => {
    return children?.filter((child: any) => child.classId === classId).length || 0;
  };

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    form.reset({
      name: classItem.name,
      room: classItem.room || "",
      observations: classItem.observations || "",
    });
    setShowClassForm(true);
  };

  const handleDelete = (classId: string) => {
    const childrenCount = getChildrenCount(classId);
    if (childrenCount > 0) {
      toast({
        title: "Não é possível remover",
        description: `Esta turma possui ${childrenCount} criança(s) cadastrada(s)`,
        variant: "destructive",
      });
      return;
    }
    
    if (window.confirm('Tem certeza que deseja remover esta turma?')) {
      deleteClassMutation.mutate(classId);
    }
  };

  const onSubmit = (data: InsertClass) => {
    createClassMutation.mutate(data);
  };

  const handleFormClose = () => {
    setShowClassForm(false);
    setEditingClass(null);
    form.reset();
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Turmas" />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar turmas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            
            <Dialog open={showClassForm} onOpenChange={setShowClassForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Turma
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingClass ? 'Editar Turma' : 'Nova Turma'}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Turma</FormLabel>
                          <FormControl>
                            <Input placeholder="ex: Infantil (3-5 anos)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="room"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sala (Opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="ex: Sala 2" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="observations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações (Opcional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Informações adicionais sobre a turma..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={handleFormClose}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createClassMutation.isPending}>
                        {createClassMutation.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Classes Grid */}
          {classesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-surface border-border animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredClasses?.length === 0 ? (
            <Card className="bg-surface border-border">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhuma turma encontrada
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? "Tente ajustar o termo de busca"
                    : "Comece criando a primeira turma"
                  }
                </p>
                <Button onClick={() => setShowClassForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Turma
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses?.map((classItem: Class) => {
                const childrenCount = getChildrenCount(classItem.id);
                
                return (
                  <Card key={classItem.id} className="bg-surface border-border hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground">
                          {classItem.name}
                        </CardTitle>
                        {classItem.room && (
                          <p className="text-sm text-muted-foreground">
                            {classItem.room}
                          </p>
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <CheckSquare className="mr-2 h-4 w-4" />
                            Fazer Chamada
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(classItem)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(classItem.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">
                            {childrenCount} criança{childrenCount !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        
                        {classItem.observations && (
                          <p className="text-sm text-muted-foreground">
                            {classItem.observations}
                          </p>
                        )}
                        
                        <div className="flex space-x-2 pt-4">
                          <Button size="sm" className="flex-1">
                            <CheckSquare className="mr-2 h-4 w-4" />
                            Chamada
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <BookOpen className="mr-2 h-4 w-4" />
                            Relatório
                          </Button>
                        </div>
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
