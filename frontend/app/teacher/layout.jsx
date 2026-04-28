import DashboardLayout from '@/components/layout/DashboardLayout';
export default function TeacherLayout({ children }) {
  return <DashboardLayout role="teacher">{children}</DashboardLayout>;
}