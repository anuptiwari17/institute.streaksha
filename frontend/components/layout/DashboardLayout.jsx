import Sidebar from './Sidebar';

export default function DashboardLayout({ children, role }) {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex">
      <Sidebar role={role}/>
      <main className="flex-1 ml-60 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}