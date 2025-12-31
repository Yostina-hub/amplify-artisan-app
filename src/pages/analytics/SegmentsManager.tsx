import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Target, Plus, Search, Filter, Users, TrendingUp, 
  MoreVertical, Edit, Trash2, Eye, Download, ArrowLeft
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function SegmentsManager() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: '',
    description: '',
    segment_type: 'rule_based'
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: segments, isLoading } = useQuery({
    queryKey: ['analytics-segments-all', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_segments')
        .select('*')
        .eq('company_id', profile?.company_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const filteredSegments = segments?.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleCreate = async () => {
    if (!newSegment.name.trim()) {
      toast.error('Segment name is required');
      return;
    }

    const { error } = await supabase
      .from('analytics_segments')
      .insert({
        company_id: profile?.company_id,
        name: newSegment.name,
        description: newSegment.description,
        segment_type: newSegment.segment_type,
        created_by: user?.id,
        rules: []
      });

    if (error) {
      toast.error('Failed to create segment');
      return;
    }

    toast.success('Segment created successfully');
    setCreateOpen(false);
    setNewSegment({ name: '', description: '', segment_type: 'rule_based' });
    queryClient.invalidateQueries({ queryKey: ['analytics-segments-all'] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('analytics_segments')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete segment');
      return;
    }

    toast.success('Segment deleted');
    queryClient.invalidateQueries({ queryKey: ['analytics-segments-all'] });
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('analytics_segments')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update segment');
      return;
    }

    toast.success(`Segment ${!currentStatus ? 'activated' : 'deactivated'}`);
    queryClient.invalidateQueries({ queryKey: ['analytics-segments-all'] });
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-in fade-in-50 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/analytics')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Segments</h1>
          <p className="text-muted-foreground">Create and manage audience segments</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Segment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Segment</DialogTitle>
              <DialogDescription>
                Define a new audience segment based on rules or behavior
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Segment Name</Label>
                <Input 
                  placeholder="e.g., High-Value Customers"
                  value={newSegment.name}
                  onChange={(e) => setNewSegment(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Describe this segment..."
                  value={newSegment.description}
                  onChange={(e) => setNewSegment(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Segment Type</Label>
                <Select 
                  value={newSegment.segment_type} 
                  onValueChange={(v) => setNewSegment(prev => ({ ...prev, segment_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rule_based">Rule-Based</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="predictive">Predictive (ML)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Segment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search segments..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Segments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            All Segments
          </CardTitle>
          <CardDescription>
            {filteredSegments.length} segment{filteredSegments.length !== 1 ? 's' : ''} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSegments.map((segment) => (
                <TableRow key={segment.id} className="cursor-pointer hover:bg-accent/5">
                  <TableCell>
                    <div>
                      <div className="font-medium">{segment.name}</div>
                      {segment.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {segment.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {segment.segment_type === 'rule_based' ? 'Rules' : 
                       segment.segment_type === 'behavioral' ? 'Behavioral' : 'ML'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {segment.member_count?.toLocaleString() || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={segment.is_active ? 'default' : 'secondary'}>
                      {segment.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(segment.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/analytics/segments/${segment.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Rules
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(segment.id, segment.is_active)}>
                          {segment.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Export Members
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(segment.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSegments.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No segments found</p>
                    <p className="text-sm">Create your first segment to get started</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
