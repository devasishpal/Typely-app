import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Download, 
  MoreVertical, 
  Eye, 
  Edit, 
  Ban, 
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { adminApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/layouts/AdminLayout';
import type { AccountDeletionRequest, DeletionRequestStatus, Profile } from '@/types';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<Profile | null>(null);
  const [roleValue, setRoleValue] = useState<'user' | 'admin'>('user');
  const [roleSaving, setRoleSaving] = useState(false);
  const [deletionRequests, setDeletionRequests] = useState<AccountDeletionRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestSavingId, setRequestSavingId] = useState<string | null>(null);
  const usersPerPage = 10;

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login', { replace: true });
      return;
    }
    loadAdminData();
  }, [user, navigate]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter]);

  const loadAdminData = async () => {
    setLoading(true);
    setRequestsLoading(true);
    try {
      const [usersData, requestsData] = await Promise.all([
        adminApi.getAllUsers(),
        adminApi.getDeletionRequests(),
      ]);
      setUsers(usersData);
      setDeletionRequests(requestsData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load admin data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRequestsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(u =>
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const headers = ['Username', 'Email', 'Full Name', 'Role', 'Created At'];
    const csvData = filteredUsers.map(u => [
      u.username,
      u.email || '',
      u.full_name || '',
      u.role,
      new Date(u.created_at).toLocaleDateString()
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typely-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Successful',
      description: 'Users data has been exported to CSV.',
    });
  };

  const handleOpenRoleDialog = (target: Profile) => {
    setRoleTarget(target);
    setRoleValue((target.role as 'user' | 'admin') || 'user');
    setRoleDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!roleTarget) return;
    setRoleSaving(true);
    try {
      await adminApi.updateUserRole(roleTarget.id, roleValue);
      toast({
        title: 'Role Updated',
        description: `${roleTarget.username || roleTarget.email || 'User'} is now ${roleValue}.`,
      });
      setRoleDialogOpen(false);
      loadAdminData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role.',
        variant: 'destructive',
      });
    } finally {
      setRoleSaving(false);
    }
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const getDeletionStatusVariant = (status: DeletionRequestStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (status === 'completed') return 'default';
    if (status === 'failed') return 'destructive';
    if (status === 'processing') return 'secondary';
    return 'outline';
  };

  const handleUpdateDeletionStatus = async (requestId: string, status: DeletionRequestStatus) => {
    setRequestSavingId(requestId);
    try {
      await adminApi.updateDeletionRequestStatus(requestId, status);
      toast({
        title: 'Request updated',
        description: `Deletion request marked as ${status}.`,
      });
      const data = await adminApi.getDeletionRequests();
      setDeletionRequests(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update request status.',
        variant: 'destructive',
      });
    } finally {
      setRequestSavingId(null);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text">Users Management</h1>
            <p className="text-muted-foreground">
              View and manage all registered users
            </p>
          </div>
          <Button onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by username, email, or name..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>
              All Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : currentUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            ) : (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {u.username?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{u.username}</div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {u.id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{u.email || '-'}</TableCell>
                          <TableCell>{u.full_name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(u.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate(`/admin/users/${u.id}`)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenRoleDialog(u)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Change Role
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Ban className="w-4 h-4 mr-2" />
                                  Suspend User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <div className="text-sm">
                        Page {currentPage} of {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Account Deletion Requests ({deletionRequests.length})</CardTitle>
            <Button variant="outline" size="sm" onClick={loadAdminData} disabled={requestsLoading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="text-center py-8">Loading deletion requests...</div>
            ) : deletionRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No deletion requests found</div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Processed</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletionRequests.map((request) => {
                      const requestUser = users.find((u) => u.id === request.user_id);
                      return (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {requestUser?.username || requestUser?.email || request.user_id.slice(0, 8)}
                              </span>
                              <span className="text-xs text-muted-foreground">ID: {request.user_id.slice(0, 8)}...</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getDeletionStatusVariant(request.status)}>{request.status}</Badge>
                          </TableCell>
                          <TableCell>{new Date(request.requested_at).toLocaleString()}</TableCell>
                          <TableCell>{request.processed_at ? new Date(request.processed_at).toLocaleString() : '-'}</TableCell>
                          <TableCell>{request.source}</TableCell>
                          <TableCell className="text-right">
                            <Select
                              value={request.status}
                              onValueChange={(value) =>
                                handleUpdateDeletionStatus(request.id, value as DeletionRequestStatus)
                              }
                              disabled={requestSavingId === request.id}
                            >
                              <SelectTrigger className="w-[170px] ml-auto">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {roleTarget?.username || roleTarget?.email || 'this user'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Select value={roleValue} onValueChange={(v) => setRoleValue(v as 'user' | 'admin')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)} disabled={roleSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={roleSaving}>
              {roleSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
