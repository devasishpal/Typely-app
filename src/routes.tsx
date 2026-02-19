import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import GuidePage from './pages/GuidePage';
import LessonsPage from './pages/LessonsPage';
import LessonPracticePage from './pages/LessonPracticePage';
import LessonCompletionPage from './pages/LessonCompletionPage';
import PracticePage from './pages/PracticePage';
import TypingTestPage from './pages/TypingTestPage';
import GamesPage from './pages/GamesPage';
import StatisticsPage from './pages/StatisticsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AchievementsPage from './pages/AchievementsPage';
import ProfilePage from './pages/ProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DeleteAccountPage from './pages/DeleteAccountPage';
import CheckEmail from './pages/CheckEmail';
import AuthCallback from './pages/AuthCallback';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import AdminLessonsPage from './pages/admin/AdminLessonsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminTestsPage from './pages/admin/AdminTestsPage';
import AdminPracticePage from './pages/admin/AdminPracticePage';
import AdminCertificatesPage from './pages/admin/AdminCertificatesPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminDeletionRequestsPage from './pages/admin/AdminDeletionRequestsPage';
import FooterContentPage from './pages/FooterContentPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import VerifyCertificatePage from './pages/VerifyCertificatePage';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Landing',
    path: '/',
    element: <LandingPage />,
  },
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
  },
  {
    name: 'Signup',
    path: '/signup',
    element: <SignupPage />,
  },
  {
    name: 'Forgot Password',
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    element: <DashboardPage />,
  },
  {
    name: 'Guide',
    path: '/guide',
    element: <GuidePage />,
  },
  {
    name: 'Lessons',
    path: '/lessons',
    element: <LessonsPage />,
  },
  {
    name: 'Practice',
    path: '/practice',
    element: <PracticePage />,
  },
  {
    name: 'Lesson Practice',
    path: '/lesson/:lessonRef',
    element: <LessonPracticePage />,
  },
  {
    name: 'Lesson Completion',
    path: '/lesson/:lessonRef/complete',
    element: <LessonCompletionPage />,
  },
  {
    name: 'Typing Test',
    path: '/typing-test',
    element: <TypingTestPage />,
  },
  {
    name: 'Games',
    path: '/games',
    element: <GamesPage />,
  },
  {
    name: 'Statistics',
    path: '/statistics',
    element: <StatisticsPage />,
  },
  {
    name: 'Leaderboard',
    path: '/leaderboard',
    element: <LeaderboardPage />,
  },
  {
    name: 'Achievements',
    path: '/achievements',
    element: <AchievementsPage />,
  },
  {
    name: 'Profile',
    path: '/profile',
    element: <ProfilePage />,
  },
  {
    name: 'Reset Password',
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    name: 'Delete Account',
    path: '/delete-account',
    element: <DeleteAccountPage />,
  },
  {
    name: 'Check Email',
    path: '/check-email',
    element: <CheckEmail />,
  },
  {
    name: 'Auth Callback',
    path: '/auth/callback',
    element: <AuthCallback />,
  },
  {
    name: 'Support',
    path: '/support',
    element: <FooterContentPage title="Support Center" field="support_center" />,
  },
  {
    name: 'FAQ',
    path: '/faq',
    element: <FooterContentPage title="Frequently Asked Questions" field="faq" />,
  },
  {
    name: 'Contact',
    path: '/contact',
    element: <FooterContentPage title="Contact Us" field="contact_us" />,
  },
  {
    name: 'About',
    path: '/about',
    element: <FooterContentPage title="About" field="about" />,
  },
  {
    name: 'Blog',
    path: '/blog',
    element: <BlogPage />,
  },
  {
    name: 'Blog Detail',
    path: '/blog/:slug',
    element: <BlogPostPage />,
  },
  {
    name: 'Certificate Verification',
    path: '/verify-certificate/:certificateCode',
    element: <VerifyCertificatePage />,
  },
  {
    name: 'Careers',
    path: '/careers',
    element: <FooterContentPage title="Careers" field="careers" />,
  },
  {
    name: 'Privacy',
    path: '/privacy',
    element: <FooterContentPage title="Privacy Policy" field="privacy_policy" />,
  },
  {
    name: 'Terms',
    path: '/terms',
    element: <FooterContentPage title="Terms of Service" field="terms_of_service" />,
  },
  {
    name: 'Admin Login',
    path: '/admin_Dev',
    element: <AdminLoginPage />,
  },
  {
    name: 'Admin Dashboard',
    path: '/admin_Dev/dashboard',
    element: <AdminDashboardPage />,
  },
  {
    name: 'Admin Users',
    path: '/admin_Dev/users',
    element: <AdminUsersPage />,
  },
  {
    name: 'Admin User Detail',
    path: '/admin_Dev/users/:userId',
    element: <AdminUserDetailPage />,
  },
  {
    name: 'Admin Tests',
    path: '/admin_Dev/tests',
    element: <AdminTestsPage />,
  },
  {
    name: 'Admin Practice',
    path: '/admin_Dev/practice',
    element: <AdminPracticePage />,
  },
  {
    name: 'Admin Lessons',
    path: '/admin_Dev/lessons',
    element: <AdminLessonsPage />,
  },
  {
    name: 'Admin Certificates',
    path: '/admin_Dev/certificates',
    element: <AdminCertificatesPage />,
  },
  {
    name: 'Admin Payments',
    path: '/admin_Dev/payments',
    element: <AdminPaymentsPage />,
  },
  {
    name: 'Admin Deletion Requests',
    path: '/admin_Dev/deletion-requests',
    element: <AdminDeletionRequestsPage />,
  },
  {
    name: 'Admin Categories',
    path: '/admin_Dev/categories',
    element: <AdminCategoriesPage />,
  },
  {
    name: 'Admin Settings',
    path: '/admin_Dev/settings',
    element: <AdminSettingsPage />,
  },
];

export default routes;

