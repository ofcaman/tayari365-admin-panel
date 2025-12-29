import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  class: string;
}

interface Class {
  id: string;
  name: string;
}

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchSubjects();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    const snapshot = await getDocs(collection(db, 'classes'));
    const data = snapshot.docs
      .map(doc => ({ id: doc.id, name: doc.data().name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    setClasses(data);
    if (data.length > 0 && !selectedClass) {
      setSelectedClass(data[0].name);
    }
  };

  const fetchSubjects = async () => {
    if (!selectedClass) return;
    const snapshot = await getDocs(collection(db, 'subjects'));
    const data = snapshot.docs
      .map(doc => ({ 
        id: doc.id, 
        ...doc.data()
      } as Subject))
      .filter(subject => subject.class === selectedClass)
      .sort((a, b) => a.name.localeCompare(b.name));
    setSubjects(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;

    setAdding(true);
    try {
      await addDoc(collection(db, 'subjects'), {
        name: subjectName.trim(),
        class: selectedClass,
        createdAt: new Date()
      });
      
      toast.success('Subject added successfully');
      setOpen(false);
      setSubjectName('');
      fetchSubjects();
    } catch (error) {
      toast.error('Failed to add subject');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'subjects', id));
      toast.success('Subject deleted successfully');
      fetchSubjects();
    } catch (error) {
      toast.error('Failed to delete subject');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Subjects Manager</h1>
            <p className="text-muted-foreground">Add and manage subjects for each class</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.name}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subjectName">Subject Name</Label>
                  <Input
                    id="subjectName"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="e.g., Physics, Chemistry"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={adding}>
                  {adding ? 'Adding...' : 'Add Subject'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.name}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <Card key={subject.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg">{subject.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(subject.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
              </Card>
            ))}
          </div>

          {subjects.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No subjects added yet. Click "Add Subject" to get started.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
