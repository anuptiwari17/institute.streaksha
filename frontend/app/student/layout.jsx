import DashboardLayout from '@/components/layout/DashboardLayout';
export default function StudentLayout({ children }) {
  return <DashboardLayout role="student">{children}</DashboardLayout>;
}