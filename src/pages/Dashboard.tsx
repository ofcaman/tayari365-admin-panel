import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Images, BookOpen, ClipboardList, MessageSquare, FileText, GraduationCap, Users } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Dashboard() {
  const [stats, setStats] = useState([
    { icon: GraduationCap, label: 'Total Classes', value: '0', color: 'text-indigo-500', collection: 'classes' },
    { icon: Users, label: 'Total Users', value: '0', color: 'text-cyan-500', collection: 'users' },
    { icon: BookOpen, label: 'Subjects', value: '0', color: 'text-green-500', collection: 'subjects' },
    { icon: ClipboardList, label: 'MCQs', value: '0', color: 'text-purple-500', collection: 'mcqs' },
    { icon: Images, label: 'Slider Images', value: '0', color: 'text-blue-500', collection: 'sliderImages' },
    { icon: MessageSquare, label: 'Notices', value: '0', color: 'text-orange-500', collection: 'notices' },
    { icon: FileText, label: 'Syllabi', value: '0', color: 'text-red-500', collection: 'syllabus' },
  ]);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    const updatedStats = await Promise.all(
      stats.map(async (stat) => {
        try {
          const snapshot = await getDocs(collection(db, stat.collection));
          return { ...stat, value: snapshot.size.toString() };
        } catch (error) {
          console.error(`Error fetching ${stat.collection}:`, error);
          return stat;
        }
      })
    );
    setStats(updatedStats);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your Tayari365 content</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
