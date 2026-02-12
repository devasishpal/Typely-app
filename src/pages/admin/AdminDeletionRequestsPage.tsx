import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Eye, RefreshCw, Search, Trash2 } from 'lucide-react';
import type { AccountDeletionRequest, DeletionRequestStatus, Profile } from '@/types';

export default function AdminDeletionRequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingRequestId, setSavingRequestId] = useState<string | null>(null);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [requests, setRequests] = useState<AccountDeletionRequest[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loadError, setLoadError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DeletionRequestStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [clearingAll, setClearingAll] = useState(false);

  const usersById = useMemo(
    () => new Map(users.map((u) => [u.id, u])),
    [users]
  );

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin_Dev', { replace: true });
      return;
    }
    void loadData();
  }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [requestData, userData] = await Promise.all([
        adminApi.getDeletionRequests(),
        adminApi.getAllUsers(),
      ]);
      setRequests(requestData);
      setUsers(userData);
    } catch (error: any) {
      const message = error?.message || 'Failed to load deletion requests.';
      setLoadError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    let result = [...requests];
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((r) => {
        const requestUser = usersById.get(r.user_id);
        const username = requestUser?.username?.toLowerCase() || '';
        const email = requestUser?.email?.toLowerCase() || '';
        const fullName = requestUser?.full_name?.toLowerCase() || '';
        return (
          r.user_id.toLowerCase().includes(q) ||
          username.includes(q) ||
          email.includes(q) ||
          fullName.includes(q) ||
          r.status.toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [requests, usersById, statusFilter, searchQuery]);

  const getStatusVariant = (
    status: DeletionRequestStatus
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (status === 'completed') return 'default';
    if (status === 'failed') return 'destructive';
    if (status === 'processing') return 'secondary';
    return 'outline';
  };

  const updateRequestStatus = async (requestId: string, status: DeletionRequestStatus) => {
    setSavingRequestId(requestId);
    try {
      await adminApi.updateDeletionRequestStatus(requestId, status);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status,
                processed_at:
                  status === 'completed' || status === 'failed' || status === 'cancelled'
                    ? new Date().toISOString()
                    : null,
                updated_at: new Date().toISOString(),
              }
            : r
        )
      );
      toast({
        title: 'Updated',
        description: `Request marked as ${status}.`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update request status.',
        variant: 'destructive',
      });
    } finally {
      setSavingRequestId(null);
    }
  };

  const handleDeleteUserAccount = async (request: AccountDeletionRequest) => {
    const shouldDelete = window.confirm(
      'This will permanently delete the user account and related data. Continue?'
    );
    if (!shouldDelete) return;

    setDeletingRequestId(request.id);
    try {
      await adminApi.updateDeletionRequestStatus(request.id, 'processing');
      const deleteMessage = await adminApi.deleteUser(request.user_id);
      await adminApi.updateDeletionRequestStatus(request.id, 'completed');

      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? {
                ...r,
                status: 'completed',
                processed_at: new Date().toISOString(),
                error_message: null,
                updated_at: new Date().toISOString(),
              }
            : r
        )
      );

      toast({
        title: 'User deleted',
        description: deleteMessage || 'The account has been deleted successfully.',
      });
      await loadData();
    } catch (error: any) {
      const message = error?.message || 'Failed to delete user account.';
      try {
        await adminApi.updateDeletionRequestStatus(request.id, 'failed', message);
      } catch {
        // Keep original failure as the primary signal for admin.
      }

      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? {
                ...r,
                status: 'failed',
                processed_at: new Date().toISOString(),
                error_message: message,
                updated_at: new Date().toISOString(),
              }
            : r
        )
      );

      toast({
        title: 'Delete failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDeletingRequestId(null);
    }
  };

  const handleClearAllRequests = async () => {
    if (requests.length === 0) return;

    const shouldClear = window.confirm(
      'This will permanently remove all deletion requests from this page. Continue?'
    );
    if (!shouldClear) return;

    setClearingAll(true);
    try {
      await adminApi.clearAllDeletionRequests();
      setRequests([]);
      toast({
        title: 'Cleared',
        description: 'All deletion requests have been cleared.',
      });
    } catch (error: any) {
      const message = error?.message || 'Failed to clear deletion requests.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setClearingAll(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Deletion Requests</h1>
          <p className="text-muted-foreground">Review and manage account deletion requests from users.</p>
        </div>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Search by user ID, username, email, or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | DeletionRequestStatus)}>
                <SelectTrigger className="w-full md:w-56">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadData} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Requests ({filteredRequests.length})</CardTitle>
            <Button
              variant="destructive"
              onClick={handleClearAllRequests}
              disabled={clearingAll || loading || requests.length === 0}
            >
              {clearingAll ? 'Clearing...' : 'Clear All Requests'}
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center">Loading requests...</div>
            ) : loadError ? (
              <div className="py-10 text-center text-destructive">
                {loadError}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">No deletion requests found.</div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((request) => {
                  const requestUser = usersById.get(request.user_id);
                  const displayName =
                    requestUser?.username ||
                    requestUser?.full_name ||
                    requestUser?.email ||
                    request.user_id.slice(0, 8);
                  return (
                    <div
                      key={request.id}
                      className="rounded-lg border border-border/60 bg-muted/20 p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {displayName}
                          </span>
                          <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                          <div>
                            Username: <span className="font-medium text-foreground">{requestUser?.username || '-'}</span>
                          </div>
                          <div>
                            Email: <span className="font-medium text-foreground">{requestUser?.email || '-'}</span>
                          </div>
                          <div>
                            Full Name: <span className="font-medium text-foreground">{requestUser?.full_name || '-'}</span>
                          </div>
                          <div>
                            Role: <span className="font-medium text-foreground capitalize">{requestUser?.role || '-'}</span>
                          </div>
                          <div>
                            Joined:{' '}
                            <span className="font-medium text-foreground">
                              {requestUser?.created_at
                                ? new Date(requestUser.created_at).toLocaleDateString()
                                : '-'}
                            </span>
                          </div>
                          <div>
                            User ID:{' '}
                            <span className="font-medium text-foreground break-all">{request.user_id}</span>
                          </div>
                          <div>
                            Source: <span className="font-medium text-foreground">{request.source}</span>
                          </div>
                          <div>
                            Request ID:{' '}
                            <span className="font-medium text-foreground break-all">{request.id}</span>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Requested: {new Date(request.requested_at).toLocaleString()}
                          {request.processed_at
                            ? ` | Processed: ${new Date(request.processed_at).toLocaleString()}`
                            : ''}
                        </div>
                        {request.error_message && (
                          <div className="text-xs text-destructive">Error: {request.error_message}</div>
                        )}
                      </div>

                      <div className="flex w-full lg:w-auto flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/admin_Dev/users/${request.user_id}`)}
                          disabled={!requestUser}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View User
                        </Button>
                        <Select
                          value={request.status}
                          onValueChange={(v) => updateRequestStatus(request.id, v as DeletionRequestStatus)}
                          disabled={savingRequestId === request.id || deletingRequestId === request.id}
                        >
                          <SelectTrigger className="w-full lg:w-48">
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
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteUserAccount(request)}
                          disabled={
                            savingRequestId === request.id ||
                            deletingRequestId === request.id ||
                            request.status === 'completed' ||
                            request.status === 'cancelled'
                          }
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {deletingRequestId === request.id ? 'Deleting...' : 'Delete From Backend'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

