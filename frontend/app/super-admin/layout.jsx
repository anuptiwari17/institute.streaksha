import DashboardLayout from '@/components/layout/DashboardLayout';
export default function SuperAdminLayout({ children }) {
  return <DashboardLayout role="super_admin">{children}</DashboardLayout>;
}