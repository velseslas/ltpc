import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface EchantillonFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  searchPlaceholder?: string;
}

export function EchantillonFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  searchPlaceholder = "Rechercher un échantillon...",
}: EchantillonFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-11 bg-card border-border w-full"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-[180px] h-11 bg-card border-border shrink-0">
          <SelectValue placeholder="Filtrer par statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="a-faire">À faire</SelectItem>
          <SelectItem value="en-cours">En cours</SelectItem>
          <SelectItem value="termine">Terminé</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
