import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  UserCheck,
  FileText, 
  Gauge,
  Target,
  UserPlus,
  ArrowUp,
  BookOpen,
  Settings,
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

type WpmTrendPoint = {
  month: string;
  avgWPM: number;
};

type UserGrowthPoint = {
  week: string;
  users: number;
};

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    totalSessions: 0,
    avgWPM: 0,
    avgAccuracy: 0,
    newUsersWeek: 0,
  });
  const [wpmTrendData, setWpmTrendData] = useState<WpmTrendPoint[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthPoint[]>([]);

  useEffect(() => {
    // Check if user is admin
    if (!user) {
      navigate('/admin_Dev', { replace: true });
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
      const totalSessions = sessions.length;
      
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

      // Calculate active users today (unique users with sessions today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeToday = new Set(
        sessions
          .filter((session) => new Date(session.created_at) >= today)
          .map((session) => session.user_id)
      ).size;

      // Build WPM trend for last 6 months from real session data.
      const now = new Date();
      const monthlyData: WpmTrendPoint[] = [];
      for (let i = 5; i >= 0; i -= 1) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const monthSessions = sessions.filter((session) => {
          const createdAt = new Date(session.created_at);
          return createdAt >= monthStart && createdAt < monthEnd;
        });

        const avgMonthWpm = monthSessions.length > 0
          ? Math.round(
              monthSessions.reduce((sum, session) => sum + (session.wpm || 0), 0) /
                monthSessions.length
            )
          : 0;

        monthlyData.push({
          month: monthStart.toLocaleString('en-US', { month: 'short' }),
          avgWPM: avgMonthWpm,
        });
      }

      // Build user growth for last 4 weeks from real signup data.
      const weeklyData: UserGrowthPoint[] = [];
      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - 27);

      for (let i = 0; i < 4; i += 1) {
        const start = new Date(weekStart);
        start.setDate(weekStart.getDate() + i * 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);

        const usersInWeek = users.filter((profile) => {
          const createdAt = new Date(profile.created_at);
          return createdAt >= start && createdAt < end;
        }).length;

        weeklyData.push({
          week: `Week ${i + 1}`,
          users: usersInWeek,
        });
      }

      setStats({
        totalUsers,
        activeToday,
        totalSessions,
        avgWPM,
        avgAccuracy,
        newUsersWeek,
      });
      setWpmTrendData(monthlyData);
      setUserGrowthData(weeklyData);
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
              <CardTitle className="text-sm font-medium">Total Typing Sessions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Recorded sessions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Typing Speed</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.avgWPM} WPM</div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on all recorded sessions
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
              <p className="text-xs text-muted-foreground mt-1">
                Based on all recorded sessions
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
                onClick={() => navigate('/admin_Dev/users')}
                className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
              >
                <Users className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold">Manage Users</h3>
                <p className="text-sm text-muted-foreground">View and manage all users</p>
              </button>
              <button
                onClick={() => navigate('/admin_Dev/tests')}
                className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
              >
                <FileText className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold">Manage Tests</h3>
                <p className="text-sm text-muted-foreground">Update typing test content</p>
              </button>
              <button
                onClick={() => navigate('/admin_Dev/practice')}
                className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
              >
                <BookOpen className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold">Manage Practice</h3>
                <p className="text-sm text-muted-foreground">Update practice categories and sets</p>
              </button>
              <button
                onClick={() => navigate('/admin_Dev/settings')}
                className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
              >
                <Settings className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold">Settings</h3>
                <p className="text-sm text-muted-foreground">Configure platform options</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

