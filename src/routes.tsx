import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import LessonsPage from './pages/LessonsPage';
import LessonPracticePage from './pages/LessonPracticePage';
import PracticePage from './pages/PracticePage';
import TypingTestPage from './pages/TypingTestPage';
import StatisticsPage from './pages/StatisticsPage';
import AchievementsPage from './pages/AchievementsPage';
import ProfilePage from './pages/ProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DeleteAccountPage from './pages/DeleteAccountPage';
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
import FooterContentPage from './pages/FooterContentPage';
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
    name: 'Dashboard',
    path: '/dashboard',
    element: <DashboardPage />,
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
    path: '/lesson/:lessonId',
    element: <LessonPracticePage />,
  },
  {
    name: 'Typing Test',
    path: '/typing-test',
    element: <TypingTestPage />,
  },
  {
    name: 'Statistics',
    path: '/statistics',
    element: <StatisticsPage />,
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
    element: <FooterContentPage title="Blog" field="blog" />,
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
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    name: 'Admin Dashboard',
    path: '/admin/dashboard',
    element: <AdminDashboardPage />,
  },
  {
    name: 'Admin Users',
    path: '/admin/users',
    element: <AdminUsersPage />,
  },
  {
    name: 'Admin User Detail',
    path: '/admin/users/:userId',
    element: <AdminUserDetailPage />,
  },
  {
    name: 'Admin Tests',
    path: '/admin/tests',
    element: <AdminTestsPage />,
  },
  {
    name: 'Admin Practice',
    path: '/admin/practice',
    element: <AdminPracticePage />,
  },
  {
    name: 'Admin Lessons',
    path: '/admin/lessons',
    element: <AdminLessonsPage />,
  },
  {
    name: 'Admin Certificates',
    path: '/admin/certificates',
    element: <AdminCertificatesPage />,
  },
  {
    name: 'Admin Payments',
    path: '/admin/payments',
    element: <AdminPaymentsPage />,
  },
  {
    name: 'Admin Categories',
    path: '/admin/categories',
    element: <AdminCategoriesPage />,
  },
  {
    name: 'Admin Settings',
    path: '/admin/settings',
    element: <AdminSettingsPage />,
  },
  {
    name: 'Admin',
    path: '/admin',
    element: <AdminLoginPage />,
  },
];

export default routes;
