import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { toast } from 'sonner';
import { Upload, FileText } from 'lucide-react';

interface SyllabusData {
  class: string;
  title: string;
  pdfUrl?: string;
  updatedAt?: any;
}

interface Class {
  id: string;
  name: string;
}

export default function Syllabus() {
  const [syllabi, setSyllabi] = useState<SyllabusData[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (classes.length > 0) {
      fetchSyllabi();
    }
  }, [classes]);

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

  const fetchSyllabi = async () => {
    const data: SyllabusData[] = [];
    for (const cls of classes) {
      const docRef = doc(db, 'syllabus', cls.name);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        data.push({ 
          class: cls.name, 
          title: docSnap.data().title || `${cls.name} Syllabus`,
          pdfUrl: docSnap.data().pdfUrl,
          updatedAt: docSnap.data().updatedAt
        });
      }
    }
    setSyllabi(data);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setUploading(true);
    try {
      let pdfUrl = '';
      
      if (file) {
        const storageRef = ref(storage, `syllabus/${selectedClass}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        pdfUrl = await getDownloadURL(storageRef);
      }

      await setDoc(doc(db, 'syllabus', selectedClass), {
        title: title.trim(),
        ...(pdfUrl && { pdfUrl }),
        updatedAt: new Date()
      });
      
      toast.success('Syllabus saved successfully');
      setOpen(false);
      setTitle('');
      setFile(null);
      fetchSyllabi();
    } catch (error) {
      toast.error('Failed to save syllabus');
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Syllabus Manager</h1>
            <p className="text-muted-foreground">Upload and manage class syllabi</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Add Syllabus
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Syllabus</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
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
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Mathematics Syllabus"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">PDF File (optional)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    You can add a title without uploading a PDF
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={uploading}>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Saving...' : 'Save Syllabus'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {syllabi.map((syllabus) => (
            <Card key={syllabus.class}>
              <CardHeader>
                <CardTitle>{syllabus.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{syllabus.class}</p>
                {syllabus.updatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Updated: {new Date(syllabus.updatedAt.toDate()).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {syllabus.pdfUrl ? (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={syllabus.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" />
                      View Syllabus PDF
                    </a>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No PDF uploaded yet
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
