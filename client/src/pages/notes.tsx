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
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { 
  StickyNote, 
  Search, 
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
  Heart,
  Users,
  Stethoscope,
  Home,
  Calendar
} from "lucide-react";
import { getInitials, formatDateTime } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNoteSchema, type Note, type InsertNote } from "@shared/schema";

const tagOptions = [
  { value: "comportamento", label: "Comportamento", icon: Users, color: "bg-blue-500" },
  { value: "saude", label: "Saúde", icon: Stethoscope, color: "bg-red-500" },
  { value: "familia", label: "Família", icon: Home, color: "bg-green-500" },
  { value: "espiritual", label: "Espiritual", icon: Heart, color: "bg-purple-500" },
  { value: "elogio", label: "Elogio", icon: Heart, color: "bg-yellow-500" },
];

const attentionLevels = [
  { value: "baixa", label: "Baixa", color: "bg-green-500" },
  { value: "media", label: "Média", color: "bg-yellow-500" },
  { value: "alta", label: "Alta", color: "bg-red-500" },
];

export default function Notes() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChild, setSelectedChild] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [attentionFilter, setAttentionFilter] = useState("all");
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

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

  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ["/api/notes"],
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

  const { data: classes } = useQuery({
    queryKey: ["/api/classes"],
    enabled: isAuthenticated,
  });

  const form = useForm<InsertNote>({
    resolver: zodResolver(insertNoteSchema.extend({
      reminderDate: insertNoteSchema.shape.reminderDate.optional().nullable(),
      tags: insertNoteSchema.shape.tags.default([]),
    })),
    defaultValues: {
      childId: "",
      title: "",
      content: "",
      tags: [],
      attentionLevel: "baixa",
      reminderDate: null,
      isSensitive: false,
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: InsertNote) => {
      if (editingNote) {
        await apiRequest("PUT", `/api/notes/${editingNote.id}`, data);
      } else {
        await apiRequest("POST", "/api/notes", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: editingNote ? "Anotação atualizada com sucesso" : "Anotação criada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setShowNoteForm(false);
      setEditingNote(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao salvar anotação",
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await apiRequest("DELETE", `/api/notes/${noteId}`);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Anotação removida com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao remover anotação",
        variant: "destructive",
      });
    },
  });

  const filteredNotes = notes?.filter((note: Note) => {
    const child = children?.find((c: any) => c.id === note.childId);
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (child?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesChild = !selectedChild || note.childId === selectedChild;
    
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => note.tags?.includes(tag));
    
    const matchesAttention = attentionFilter === "all" || note.attentionLevel === attentionFilter;
    
    return matchesSearch && matchesChild && matchesTags && matchesAttention;
  });

  const getChildInfo = (childId: string) => {
    const child = children?.find((c: any) => c.id === childId);
    const classItem = classes?.find((c: any) => c.id === child?.classId);
    return { child, classItem };
  };

  const getTagInfo = (tagValue: string) => {
    return tagOptions.find(option => option.value === tagValue);
  };

  const getAttentionInfo = (level: string) => {
    return attentionLevels.find(l => l.value === level);
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    form.reset({
      childId: note.childId,
      title: note.title,
      content: note.content,
      tags: note.tags || [],
      attentionLevel: note.attentionLevel,
      reminderDate: note.reminderDate,
      isSensitive: note.isSensitive || false,
    });
    setShowNoteForm(true);
  };

  const handleDelete = (noteId: string) => {
    if (window.confirm('Tem certeza que deseja remover esta anotação?')) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const onSubmit = (data: InsertNote) => {
    createNoteMutation.mutate(data);
  };

  const handleFormClose = () => {
    setShowNoteForm(false);
    setEditingNote(null);
    form.reset();
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Anotações" />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Filters and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar anotações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filtrar por criança" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as crianças</SelectItem>
                  {children?.map((child: any) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={attentionFilter} onValueChange={setAttentionFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Nível de atenção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os níveis</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={showNoteForm} onOpenChange={setShowNoteForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Anotação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingNote ? 'Editar Anotação' : 'Nova Anotação'}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="childId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Criança</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma criança" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {children?.map((child: any) => (
                                <SelectItem key={child.id} value={child.id}>
                                  {child.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input placeholder="Título da anotação" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conteúdo</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva a observação..."
                              className="min-h-24"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <div className="flex flex-wrap gap-2">
                              {tagOptions.map((tag) => {
                                const Icon = tag.icon;
                                const isSelected = field.value?.includes(tag.value);
                                
                                return (
                                  <Button
                                    key={tag.value}
                                    type="button"
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                      const currentTags = field.value || [];
                                      const newTags = isSelected
                                        ? currentTags.filter(t => t !== tag.value)
                                        : [...currentTags, tag.value];
                                      field.onChange(newTags);
                                    }}
                                    className={isSelected ? `${tag.color} text-white hover:opacity-80` : ''}
                                  >
                                    <Icon className="mr-1 h-3 w-3" />
                                    {tag.label}
                                  </Button>
                                );
                              })}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="attentionLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nível de Atenção</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {attentionLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full ${level.color} mr-2`} />
                                    {level.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reminderDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Lembrete (Opcional)</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isSensitive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Anotação sensível
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Visível apenas para administradores e líderes
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={handleFormClose}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createNoteMutation.isPending}>
                        {createNoteMutation.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tag Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tagOptions.map((tag) => {
              const Icon = tag.icon;
              const isSelected = selectedTags.includes(tag.value);
              
              return (
                <Button
                  key={tag.value}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTag(tag.value)}
                  className={isSelected ? `${tag.color} text-white hover:opacity-80` : ''}
                >
                  <Icon className="mr-1 h-3 w-3" />
                  {tag.label}
                </Button>
              );
            })}
          </div>

          {/* Notes Grid */}
          {notesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-surface border-border animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !filteredNotes || filteredNotes.length === 0 ? (
            <Card className="bg-surface border-border">
              <CardContent className="p-12 text-center">
                <StickyNote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhuma anotação encontrada
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedChild || selectedTags.length > 0 || attentionFilter !== "all"
                    ? "Tente ajustar os filtros"
                    : "Comece criando a primeira anotação"
                  }
                </p>
                <Button onClick={() => setShowNoteForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Anotação
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotes.map((note: Note) => {
                const { child, classItem } = getChildInfo(note.childId);
                const attentionInfo = getAttentionInfo(note.attentionLevel);
                
                return (
                  <Card key={note.id} className="bg-surface border-border hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
                          {note.title}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          {child && (
                            <div className="flex items-center space-x-1">
                              <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-medium">
                                  {getInitials(child.fullName)}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {child.fullName}
                              </span>
                            </div>
                          )}
                          {classItem && (
                            <Badge variant="outline" className="text-xs">
                              {classItem.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {note.isSensitive && (
                          <AlertTriangle className="h-4 w-4 text-warning" title="Anotação sensível" />
                        )}
                        {attentionInfo && (
                          <div 
                            className={`w-3 h-3 rounded-full ${attentionInfo.color}`}
                            title={`Atenção: ${attentionInfo.label}`}
                          />
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(note)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(note.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                        {note.content}
                      </p>
                      
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {note.tags.map((tag) => {
                            const tagInfo = getTagInfo(tag);
                            if (!tagInfo) return null;
                            
                            const Icon = tagInfo.icon;
                            return (
                              <Badge 
                                key={tag} 
                                variant="secondary" 
                                className={`text-xs ${tagInfo.color} text-white`}
                              >
                                <Icon className="mr-1 h-3 w-3" />
                                {tagInfo.label}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDateTime(note.createdAt!)}</span>
                        {note.reminderDate && (
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            Lembrete: {new Date(note.reminderDate).toLocaleDateString('pt-BR')}
                          </div>
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
