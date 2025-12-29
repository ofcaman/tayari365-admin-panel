import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Images, 
  BookOpen, 
  MessageSquare, 
  FileText, 
  ClipboardList,
  GraduationCap,
  FolderTree,
  Calendar,
  Users,
  MapPin
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Images, label: 'Image Slider', path: '/dashboard/slider' },
  { icon: MapPin, label: 'Location Management', path: '/dashboard/locations' },
  { icon: FolderTree, label: 'Subjects Manager', path: '/dashboard/subjects-manager' },
  { icon: BookOpen, label: 'Subjects & Chapters', path: '/dashboard/subjects' },
  { icon: Calendar, label: 'Daily MCQs', path: '/dashboard/daily-mcqs' },
  { icon: GraduationCap, label: 'Test Preparation', path: '/dashboard/test-preparation' },
  { icon: ClipboardList, label: 'Subject Test MCQs', path: '/dashboard/mcqs' },
  { icon: MessageSquare, label: 'Notices', path: '/dashboard/notices' },
  { icon: FileText, label: 'Syllabus', path: '/dashboard/syllabus' },
  { icon: Users, label: 'User Management', path: '/dashboard/user-management' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-card border-r min-h-screen">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Tayari365</h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </div>
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
