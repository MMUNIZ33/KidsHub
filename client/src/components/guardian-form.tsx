import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { insertGuardianSchema, type Guardian, type InsertGuardian } from "@shared/schema";

interface GuardianFormProps {
  guardian?: Guardian | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const relationshipOptions = [
  { value: "mae", label: "Mãe" },
  { value: "pai", label: "Pai" },
  { value: "avo", label: "Avô" },
  { value: "ava", label: "Avó" },
  { value: "tio", label: "Tio" },
  { value: "tia", label: "Tia" },
  { value: "responsavel", label: "Responsável Legal" },
  { value: "outro", label: "Outro" },
];

export default function GuardianForm({ guardian, onSuccess, onCancel }: GuardianFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertGuardian>({
    resolver: zodResolver(insertGuardianSchema),
    defaultValues: {
      fullName: guardian?.fullName || "",
      relationship: guardian?.relationship || "",
      phoneWhatsApp: guardian?.phoneWhatsApp || "",
      email: guardian?.email || "",
      contactAuthorization: guardian?.contactAuthorization ?? true,
    },
  });

  const createGuardianMutation = useMutation({
    mutationFn: async (data: InsertGuardian) => {
      if (guardian) {
        await apiRequest("PUT", `/api/guardians/${guardian.id}`, data);
      } else {
        await apiRequest("POST", "/api/guardians", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: guardian ? "Responsável atualizado com sucesso" : "Responsável criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/guardians"] });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao salvar responsável",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertGuardian) => {
    createGuardianMutation.mutate(data);
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format as (XX) XXXXX-XXXX
    if (cleaned.length >= 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    } else if (cleaned.length >= 6) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length >= 2) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    }
    return cleaned;
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
                <Input placeholder="Nome completo do responsável" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="relationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parentesco</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o parentesco" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {relationshipOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
            name="phoneWhatsApp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="(92) 99999-9999"
                    {...field}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      field.onChange(formatted);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Opcional)</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="email@exemplo.com" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="contactAuthorization"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Autorização para contato
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  Autorizo o contato via WhatsApp e email para assuntos relacionados ao ministério infantil
                </p>
              </div>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createGuardianMutation.isPending}>
            {createGuardianMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
