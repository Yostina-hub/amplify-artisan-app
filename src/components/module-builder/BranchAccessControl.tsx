import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { GitBranch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BranchAccessControlProps {
  moduleId: string;
  selectedBranches: string[];
  onToggleBranch: (branchId: string) => void;
}

export function BranchAccessControl({
  moduleId,
  selectedBranches,
  onToggleBranch,
}: BranchAccessControlProps) {
  // Fetch branches
  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('level')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Branch Access Control
        </CardTitle>
        <CardDescription>
          Select which branches can access this module
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading branches...</p>
        ) : branches && branches.length > 0 ? (
          <div className="space-y-3">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  id={`branch-${branch.id}`}
                  checked={selectedBranches.includes(branch.id)}
                  onCheckedChange={() => onToggleBranch(branch.id)}
                />
                <Label
                  htmlFor={`branch-${branch.id}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{branch.name}</span>
                    <Badge variant="outline" className="text-xs">
                      Level {branch.level}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {branch.branch_type}
                    </Badge>
                  </div>
                  {branch.code && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Code: {branch.code}
                    </p>
                  )}
                </Label>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            No branches found. Create branches first to configure access control.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
