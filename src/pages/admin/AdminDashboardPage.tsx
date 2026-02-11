import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  UserCheck,
  FileText, 
  TrendingUp,
  Target,
  UserPlus,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { adminApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    totalTests: 0,
    avgWPM: 0,
    avgAccuracy: 0,
    newUsersWeek: 0,
  });

  // Mock data for charts
  const wpmTrendData = [
    { month: 'Jan', avgWPM: 35 },
    { month: 'Feb', avgWPM: 38 },
    { month: 'Mar', avgWPM: 42 },
    { month: 'Apr', avgWPM: 45 },
    { month: 'May', avgWPM: 48 },
    { month: 'Jun', avgWPM: 52 },
  ];

  const userGrowthData = [
    { week: 'Week 1', users: 12 },
    { week: 'Week 2', users: 19 },
    { week: 'Week 3', users: 25 },
    { week: 'Week 4', users: 32 },
  ];

  useEffect(() => {
    // Check if user is admin
    if (!user) {
      navigate('/admin/login', { replace: true });
      return;
    }

    if (user.role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'You do not have admin privileges.',
        variant: 'destructive',
      });
      navigate('/', { replace: true });
      return;
    }

    loadStats();
  }, [user, navigate, toast]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [users, sessions] = await Promise.all([
        adminApi.getAllUsers(),
        adminApi.getAllSessions(),
      ]);

      // Calculate statistics
      const totalUsers = users.length;
      const totalTests = sessions.length;
      
      // Calculate average WPM
      const avgWPM = sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.wpm || 0), 0) / sessions.length)
        : 0;

      // Calculate average accuracy
      const avgAccuracy = sessions.length > 0
        ? Math.round((sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / sessions.length) * 100) / 100
        : 0;

      // Calculate new users this week (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const newUsersWeek = users.filter(u => new Date(u.created_at) > weekAgo).length;

      // Calculate active users today (users with sessions today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeToday = sessions.filter(s => new Date(s.created_at) >= today).length;

      setStats({
        totalUsers,
        activeToday,
        totalTests,
        avgWPM,
        avgAccuracy,
        newUsersWeek,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with TYPELY today.
          </p>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-gradient-card shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registered Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+{stats.newUsersWeek}</span> this week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users Today</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.activeToday}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Users with activity today
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Typing Tests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalTests}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Tests completed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Typing Speed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.avgWPM} WPM</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+5.2%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.avgAccuracy}%</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+2.1%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Users This Week</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.newUsersWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Registered in last 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>WPM Growth Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={wpmTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgWPM" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>User Growth (Last 4 Weeks)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="users" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <button
                onClick={() => navigate('/admin/users')}
                className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
              >
                <Users className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold">Manage Users</h3>
                <p className="text-sm text-muted-foreground">View and manage all users</p>
              </button>
              <button
                onClick={() => navigate('/admin/tests')}
                className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
              >
                <FileText className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold">View Tests</h3>
                <p className="text-sm text-muted-foreground">See all typing tests</p>
              </button>
              <button
                onClick={() => navigate('/admin/analytics')}
                className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
              >
                <TrendingUp className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold">Analytics</h3>
                <p className="text-sm text-muted-foreground">View detailed analytics</p>
              </button>
              <button
                onClick={() => navigate('/admin/reports')}
                className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
              >
                <FileText className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold">Reports</h3>
                <p className="text-sm text-muted-foreground">Generate reports</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
