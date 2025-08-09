import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertChildSchema, type Child, type InsertChild } from "@shared/schema";

interface ChildFormProps {
  child?: Child | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ChildForm({ child, onSuccess, onCancel }: ChildFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: classes } = useQuery({
    queryKey: ["/api/classes"],
  });

  const form = useForm<InsertChild>({
    resolver: zodResolver(insertChildSchema),
    defaultValues: {
      fullName: child?.fullName || "",
      birthDate: child?.birthDate || "",
      classId: child?.classId || "",
      photoUrl: child?.photoUrl || "",
      allergies: child?.allergies || "",
      observations: child?.observations || "",
    },
  });

  const createChildMutation = useMutation({
    mutationFn: async (data: InsertChild) => {
      if (child) {
        await apiRequest("PUT", `/api/children/${child.id}`, data);
      } else {
        await apiRequest("POST", "/api/children", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: child ? "Criança atualizada com sucesso" : "Criança criada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao salvar criança",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertChild) => {
    createChildMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo da criança" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Nascimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="classId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Turma</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Sem turma</SelectItem>
                    {classes?.map((classItem: any) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="photoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Foto (Opcional)</FormLabel>
              <FormControl>
                <Input 
                  type="url" 
                  placeholder="https://..." 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="allergies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alergias (Opcional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Descreva alergias conhecidas..." 
                  {...field} 
                />
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
                  placeholder="Informações adicionais sobre a criança..."
                  className="min-h-20"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createChildMutation.isPending}>
            {createChildMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
