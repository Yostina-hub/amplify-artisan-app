import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MoreHorizontal, Search, UserPlus, Mail, KeyRound, Eye, Calendar, Building, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/PaginationControls";

const createUserSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  fullName: z.string().trim().max(100, { message: "Name must be less than 100 characters" }).optional(),
  role: z.enum(['user', 'agent', 'admin']).optional()
});

type UserRole = Database['public']['Enums']['app_role'];

interface Company {
  id: string;
  name: string;
  status: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  company_id: string | null;
  company?: Company;
  roles: UserRole[];
}

interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  created_at: string;
  details: any;
}

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("user");
  const [isRemoveRoleDialogOpen, setIsRemoveRoleDialogOpen] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState<UserRole | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    fullName: '',
    role: 'user' as UserRole,
    companyId: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [userAuditLogs, setUserAuditLogs] = useState<AuditLog[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const pagination = usePagination(25);

  useEffect(() => {
    checkUserRole();
    fetchCompanies();
  }, []);
  
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      pagination.goToPage(1); // Reset to page 1 on search
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);
  
  useEffect(() => {
    fetchUsers();
  }, [pagination.currentPage, pagination.pageSize]);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's company
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      setUserCompanyId(profile?.company_id || null);

      // Check if super admin (admin with no company)
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role, company_id')
        .eq('user_id', user.id);

      const adminRole = roles?.find(r => r.role === 'admin');
      setIsSuperAdmin(!!adminRole && !adminRole.company_id);
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, status')
        .eq('status', 'approved')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get current user info first
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      // Get current user's profile and roles
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', currentUser.id)
        .single();

      const { data: currentUserRoles } = await supabase
        .from('user_roles')
        .select('role, company_id')
        .eq('user_id', currentUser.id);

      const isSuperAdminUser = currentUserRoles?.some(r => r.role === 'admin' && !r.company_id);
      const currentCompanyId = currentProfile?.company_id;

      // Build query - company admins only see their company's users
      let query = supabase
        .from('profiles')
        .select('*, companies(id, name, status)', { count: 'exact' });

      // Filter by company for company admins
      if (!isSuperAdminUser && currentCompanyId) {
        query = query.eq('company_id', currentCompanyId);
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data: profiles, error: profilesError, count } = await query
        .order('created_at', { ascending: false })
        .range(pagination.getRangeStart(), pagination.getRangeEnd());

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles: User[] = (profiles || []).map((profile: any) => {
        const roles = (userRoles || [])
          .filter(role => role.user_id === profile.id)
          .map(role => role.role as UserRole);
        
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name || '',
          created_at: profile.created_at || '',
          company_id: profile.company_id,
          company: profile.companies,
          roles
        };
      });

      setUsers(usersWithRoles);
      pagination.setTotalItems(count || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser) return;

    try {
      // Check if role already exists
      const { data: existing } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', selectedUser.id)
        .eq('role', selectedRole)
        .single();

      if (existing) {
        toast.error('User already has this role');
        return;
      }

      // Prepare role data with company_id if applicable
      const roleData: any = { 
        user_id: selectedUser.id, 
        role: selectedRole 
      };

      // For company admins, associate the role with their company
      if (!isSuperAdmin && userCompanyId) {
        roleData.company_id = userCompanyId;
      }

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert(roleData);

      if (error) throw error;

      toast.success('Role assigned successfully');
      setIsRoleDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error('Failed to assign role');
    }
  };

  const handleRemoveRole = async () => {
    if (!selectedUser || !roleToRemove) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id)
        .eq('role', roleToRemove);

      if (error) throw error;

      toast.success('Role removed successfully');
      setIsRemoveRoleDialogOpen(false);
      setRoleToRemove(null);
      fetchUsers();
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Failed to remove role');
    }
  };

  const handleCreateUser = async () => {
    try {
      const validation = createUserSchema.safeParse(createForm);
      if (!validation.success) {
        toast.error(validation.error.issues[0].message);
        return;
      }

      setIsCreating(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase.functions.invoke('create-user', {
        body: {
          email: createForm.email,
          fullName: createForm.fullName,
          role: createForm.role,
          companyId: createForm.companyId || (isSuperAdmin ? null : userCompanyId)
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) throw error;

      toast.success('User created successfully. Welcome email sent with password setup instructions.');
      setIsCreateDialogOpen(false);
      setCreateForm({ email: '', fullName: '', role: 'user', companyId: '' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.email}?`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId: user.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) throw error;

      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleSendPasswordReset = async (user: User) => {
    try {
      const { error } = await supabase.functions.invoke('send-password-reset-email', {
        body: { 
          email: user.email,
          userId: user.id
        }
      });

      if (error) throw error;

      toast.success(`Password reset email sent to ${user.email}`);
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast.error(error.message || 'Failed to send password reset email');
    }
  };

  const handleViewDetails = async (user: User) => {
    setUserDetails(user);
    setIsDetailsDialogOpen(true);
    setLoadingDetails(true);

    try {
      // Fetch recent audit logs for this user
      const { data: logs, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setUserAuditLogs(logs || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to load user activity');
    } finally {
      setLoadingDetails(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'default';
      case 'UPDATE': return 'secondary';
      case 'DELETE': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                {isSuperAdmin && <TableHead>Company</TableHead>}
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 7 : 6} className="text-center text-muted-foreground">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 7 : 6} className="text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || 'No name'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        {user.company ? (
                          <Badge variant="outline">{user.company.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No company</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <Badge 
                              key={role} 
                              variant="default"
                              className="cursor-pointer hover:bg-destructive"
                              onClick={() => {
                                setSelectedUser(user);
                                setRoleToRemove(role);
                                setIsRemoveRoleDialogOpen(true);
                              }}
                              title="Click to remove this role"
                            >
                              {role} ×
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary">Pending Approval</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.roles.length > 0 ? "default" : "secondary"}>
                        {user.roles.length > 0 ? "Active" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleViewDetails(user)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedUser(user);
                              setIsRoleDialogOpen(true);
                            }}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Assign Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleSendPasswordReset(user)}
                          >
                            <KeyRound className="mr-2 h-4 w-4" />
                            Send Password Reset
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteUser(user)}
                          >
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <PaginationControls
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            onPageChange={pagination.goToPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </CardContent>
      </Card>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              Assign a new role to {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedUser && selectedUser.roles.length > 0 && (
              <div>
                <Label className="text-sm text-muted-foreground">Current Roles:</Label>
                <div className="flex gap-2 mt-2">
                  {selectedUser.roles.map((role) => (
                    <Badge key={role} variant="outline">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label>New Role</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignRole}>
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRemoveRoleDialogOpen} onOpenChange={setIsRemoveRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the "{roleToRemove}" role from {selectedUser?.email}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRemoveRoleDialogOpen(false);
                setRoleToRemove(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveRole}>
              Remove Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              User will receive an email with instructions to set up their password
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="user@example.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-name">Full Name</Label>
              <Input
                id="create-name"
                type="text"
                placeholder="John Doe"
                value={createForm.fullName}
                onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                disabled={isCreating}
              />
            </div>
            {isSuperAdmin && (
              <div className="space-y-2">
                <Label htmlFor="create-company">Company *</Label>
                <Select 
                  value={createForm.companyId} 
                  onValueChange={(value) => setCreateForm({ ...createForm, companyId: value })}
                  disabled={isCreating}
                >
                  <SelectTrigger id="create-company">
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="create-role">Role</Label>
              <Select
                value={createForm.role} 
                onValueChange={(value) => setCreateForm({ ...createForm, role: value as UserRole })}
                disabled={isCreating}
              >
                <SelectTrigger id="create-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information and activity for {userDetails?.email}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[600px] pr-4">
            {userDetails && (
              <div className="space-y-6">
                {/* Profile Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Profile Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Full Name</Label>
                      <p className="text-sm font-medium mt-1">
                        {userDetails.full_name || 'No name provided'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Email Address</Label>
                      <p className="text-sm font-medium mt-1">{userDetails.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">User ID</Label>
                      <p className="text-sm font-mono text-xs mt-1">{userDetails.id}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Account Created</Label>
                      <p className="text-sm font-medium mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(userDetails.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Company Information */}
                {userDetails.company && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Company Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground text-xs">Company Name</Label>
                          <p className="text-sm font-medium mt-1">{userDetails.company.name}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Status</Label>
                          <div className="mt-1">
                            <Badge variant={userDetails.company.status === 'approved' ? 'default' : 'secondary'}>
                              {userDetails.company.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Roles & Permissions */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Roles & Permissions
                  </h3>
                  {userDetails.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userDetails.roles.map((role) => (
                        <Badge key={role} variant="default" className="text-sm">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No roles assigned</p>
                  )}
                </div>

                <Separator />

                {/* Recent Activity */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Recent Activity (Last 10 Actions)</h3>
                  {loadingDetails ? (
                    <p className="text-sm text-muted-foreground">Loading activity...</p>
                  ) : userAuditLogs.length > 0 ? (
                    <div className="space-y-2">
                      {userAuditLogs.map((log) => (
                        <div 
                          key={log.id} 
                          className="border rounded-lg p-3 space-y-1 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant={getActionBadgeColor(log.action) as any}>
                                {log.action}
                              </Badge>
                              <span className="text-sm font-medium">{log.table_name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          {log.details && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                View details
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
