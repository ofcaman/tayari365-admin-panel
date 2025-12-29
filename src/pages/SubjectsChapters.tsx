import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { toast } from 'sonner';
import { Plus, Upload, FileText, Settings, Pencil, Trash2, GraduationCap } from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  description?: string;
  pdfUrl: string;
  subject: string;
  class: string;
  faculty?: string;
}

interface Subject {
  id: string;
  name: string;
  class: string;
}

interface Class {
  id: string;
  name: string;
  faculty?: string;
}

interface Faculty {
  id: string;
  name: string;
}

export default function SubjectsChapters() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [open, setOpen] = useState(false);
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [facultyDialogOpen, setFacultyDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [newFacultyName, setNewFacultyName] = useState('');
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [selectedChapterFaculty, setSelectedChapterFaculty] = useState('');

  useEffect(() => {
    fetchClasses();
    fetchFaculties();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchSubjects();
      fetchChapters();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    const snapshot = await getDocs(collection(db, 'classes'));
    const data = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Class))
      .sort((a, b) => a.name.localeCompare(b.name));
    setClasses(data);
    if (data.length > 0 && !selectedClass) {
      setSelectedClass(data[0].name);
    }
  };

  const fetchFaculties = async () => {
    const snapshot = await getDocs(collection(db, 'faculties'));
    const data = snapshot.docs
      .map(doc => ({ id: doc.id, name: doc.data().name } as Faculty))
      .sort((a, b) => a.name.localeCompare(b.name));
    setFaculties(data);
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

  const fetchChapters = async () => {
    const snapshot = await getDocs(collection(db, 'classes', selectedClass, 'chapters'));
    const data = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      class: selectedClass 
    } as Chapter));
    setChapters(data);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0 || !subject) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const storageRef = ref(storage, `chapters/${selectedClass}/${subject}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const pdfUrl = await getDownloadURL(storageRef);

        return addDoc(collection(db, 'classes', selectedClass, 'chapters'), {
          title: files.length === 1 ? title : file.name.replace('.pdf', ''),
          description: files.length === 1 ? description : '',
          subject,
          pdfUrl,
          faculty: selectedChapterFaculty || undefined,
          createdAt: new Date()
        });
      });

      await Promise.all(uploadPromises);
      
      toast.success(`${files.length} chapter(s) added successfully`);
      setOpen(false);
      setTitle('');
      setDescription('');
      setSubject('');
      setSelectedChapterFaculty('');
      setFiles(null);
      fetchChapters();
    } catch (error) {
      toast.error('Failed to add chapters');
    } finally {
      setUploading(false);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      if (editingClass) {
        await updateDoc(doc(db, 'classes', editingClass.id), {
          name: newClassName,
          faculty: selectedFaculty || undefined,
          updatedAt: new Date()
        });
        toast.success('Class updated successfully');
      } else {
        await addDoc(collection(db, 'classes'), {
          name: newClassName,
          faculty: selectedFaculty || undefined,
          createdAt: new Date()
        });
        toast.success('Class added successfully');
      }
      setNewClassName('');
      setSelectedFaculty('');
      setEditingClass(null);
      setClassDialogOpen(false);
      fetchClasses();
    } catch (error) {
      toast.error(editingClass ? 'Failed to update class' : 'Failed to add class');
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class? This will also delete all associated chapters.')) return;

    try {
      await deleteDoc(doc(db, 'classes', classId));
      toast.success('Class deleted successfully');
      fetchClasses();
      if (selectedClass === classes.find(c => c.id === classId)?.name) {
        setSelectedClass('');
      }
    } catch (error) {
      toast.error('Failed to delete class');
    }
  };

  const handleEditClass = (cls: Class) => {
    setEditingClass(cls);
    setNewClassName(cls.name);
    setSelectedFaculty(cls.faculty || '');
    setClassDialogOpen(true);
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacultyName.trim()) return;

    try {
      if (editingFaculty) {
        await updateDoc(doc(db, 'faculties', editingFaculty.id), {
          name: newFacultyName,
          updatedAt: new Date()
        });
        toast.success('Faculty updated successfully');
      } else {
        await addDoc(collection(db, 'faculties'), {
          name: newFacultyName,
          createdAt: new Date()
        });
        toast.success('Faculty added successfully');
      }
      setNewFacultyName('');
      setEditingFaculty(null);
      setFacultyDialogOpen(false);
      fetchFaculties();
    } catch (error) {
      toast.error(editingFaculty ? 'Failed to update faculty' : 'Failed to add faculty');
    }
  };

  const handleDeleteFaculty = async (facultyId: string) => {
    if (!confirm('Are you sure you want to delete this faculty? This may affect associated classes.')) return;

    try {
      await deleteDoc(doc(db, 'faculties', facultyId));
      toast.success('Faculty deleted successfully');
      fetchFaculties();
    } catch (error) {
      toast.error('Failed to delete faculty');
    }
  };

  const handleEditFaculty = (faculty: Faculty) => {
    setEditingFaculty(faculty);
    setNewFacultyName(faculty.name);
    setFacultyDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Subjects & Chapters</h1>
            <p className="text-muted-foreground">Manage educational content</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={facultyDialogOpen} onOpenChange={setFacultyDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Manage Faculties
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingFaculty ? 'Edit Faculty' : 'Manage Faculties'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <form onSubmit={handleAddFaculty} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="facultyName">Faculty Name</Label>
                      <Input
                        id="facultyName"
                        value={newFacultyName}
                        onChange={(e) => setNewFacultyName(e.target.value)}
                        placeholder="e.g., Science, Commerce, Arts"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {editingFaculty ? (
                        <>
                          <Pencil className="w-4 h-4 mr-2" />
                          Update Faculty
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Faculty
                        </>
                      )}
                    </Button>
                    {editingFaculty && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setEditingFaculty(null);
                          setNewFacultyName('');
                        }}
                      >
                        Cancel Edit
                      </Button>
                    )}
                  </form>

                  {faculties.length > 0 && (
                    <div className="space-y-2 pt-4 border-t">
                      <Label>Existing Faculties</Label>
                      <div className="space-y-2">
                        {faculties.map((faculty) => (
                          <div key={faculty.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="font-medium">{faculty.name}</span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditFaculty(faculty)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteFaculty(faculty.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Classes
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingClass ? 'Edit Class' : 'Manage Classes'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <form onSubmit={handleAddClass} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="className">Class Name</Label>
                      <Input
                        id="className"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="e.g., Class 10, Class 11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Faculty (Optional)</Label>
                      <Select value={selectedFaculty || "none"} onValueChange={(val) => setSelectedFaculty(val === "none" ? "" : val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select faculty (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {faculties.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              No faculties available
                            </div>
                          ) : (
                            <>
                              <SelectItem value="none">None</SelectItem>
                              {faculties.map((faculty) => (
                                <SelectItem key={faculty.id} value={faculty.name}>
                                  {faculty.name}
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full">
                      {editingClass ? (
                        <>
                          <Pencil className="w-4 h-4 mr-2" />
                          Update Class
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Class
                        </>
                      )}
                    </Button>
                    {editingClass && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setEditingClass(null);
                          setNewClassName('');
                        }}
                      >
                        Cancel Edit
                      </Button>
                    )}
                  </form>

                  {classes.length > 0 && (
                    <div className="space-y-2 pt-4 border-t">
                      <Label>Existing Classes</Label>
                      <div className="space-y-2">
                        {classes.map((cls) => (
                          <div key={cls.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <span className="font-medium">{cls.name}</span>
                              {cls.faculty && (
                                <p className="text-sm text-muted-foreground">Faculty: {cls.faculty}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditClass(cls)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteClass(cls.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Chapter(s)
                </Button>
              </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Chapter(s)</DialogTitle>
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
                  <Label>Subject</Label>
                  <Select value={subject} onValueChange={setSubject} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subj) => (
                        <SelectItem key={subj.id} value={subj.name}>
                          {subj.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Faculty (Optional)</Label>
                  <Select value={selectedChapterFaculty || "none"} onValueChange={(val) => setSelectedChapterFaculty(val === "none" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select faculty (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {faculties.map((faculty) => (
                        <SelectItem key={faculty.id} value={faculty.name}>
                          {faculty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Chapter Title {files && files.length > 1 && '(optional for bulk)'}</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter title or leave blank for bulk upload"
                    required={files && files.length === 1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter chapter description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">PDF File(s)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={(e) => setFiles(e.target.files)}
                    required
                  />
                  {files && files.length > 1 && (
                    <p className="text-sm text-muted-foreground">
                      {files.length} files selected (bulk upload)
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={uploading}>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : `Upload ${files && files.length > 1 ? files.length + ' Chapters' : 'Chapter'}`}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chapters.map((chapter) => (
              <Card key={chapter.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{chapter.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{chapter.subject}</p>
                  {chapter.faculty && (
                    <p className="text-sm text-muted-foreground">Faculty: {chapter.faculty}</p>
                  )}
                  {chapter.description && (
                    <p className="text-sm text-muted-foreground mt-2">{chapter.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" asChild>
                    <a href={chapter.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" />
                      View PDF
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
