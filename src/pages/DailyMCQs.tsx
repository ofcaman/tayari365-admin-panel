import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface DailyMCQ {
  id: string;
  question: string;
  options: string[];
  answer: number;
  class: string;
  date: string;
  enabled: boolean;
  marks?: number;
}

interface Class {
  id: string;
  name: string;
  faculty?: string;
}

export default function DailyMCQs() {
  const [mcqs, setMcqs] = useState<DailyMCQ[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [marks, setMarks] = useState(1);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchMCQs();
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

  const fetchMCQs = async () => {
    const snapshot = await getDocs(collection(db, 'dailyMcqs'));
    const data = snapshot.docs
      .map(doc => ({ 
        id: doc.id, 
        ...doc.data()
      } as DailyMCQ))
      .filter(mcq => mcq.class === selectedClass)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setMcqs(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const date = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, 'dailyMcqs'), {
        question,
        options: [optionA, optionB, optionC, optionD],
        answer: correctAnswer,
        class: selectedClass,
        date,
        enabled: true,
        marks,
        createdAt: new Date()
      });
      
      toast.success('Daily MCQ added successfully');
      setOpen(false);
      setQuestion('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setCorrectAnswer(0);
      setMarks(1);
      fetchMCQs();
    } catch (error) {
      toast.error('Failed to add MCQ');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'dailyMcqs', id));
      toast.success('Daily MCQ deleted successfully');
      fetchMCQs();
    } catch (error) {
      toast.error('Failed to delete MCQ');
    }
  };

  const handleToggleEnabled = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'dailyMcqs', id), {
        enabled: !currentStatus
      });
      toast.success(`MCQ ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
      fetchMCQs();
    } catch (error) {
      toast.error('Failed to update MCQ status');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">MCQs of the Day</h1>
            <p className="text-muted-foreground">Manage daily multiple choice questions</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Daily MCQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Daily MCQ</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="question">Question</Label>
                  <Input
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="optionA">Option A</Label>
                    <Input
                      id="optionA"
                      value={optionA}
                      onChange={(e) => setOptionA(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="optionB">Option B</Label>
                    <Input
                      id="optionB"
                      value={optionB}
                      onChange={(e) => setOptionB(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="optionC">Option C</Label>
                    <Input
                      id="optionC"
                      value={optionC}
                      onChange={(e) => setOptionC(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="optionD">Option D</Label>
                    <Input
                      id="optionD"
                      value={optionD}
                      onChange={(e) => setOptionD(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marks">Marks</Label>
                  <Input
                    id="marks"
                    type="number"
                    min="1"
                    value={marks}
                    onChange={(e) => setMarks(parseInt(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <RadioGroup value={correctAnswer.toString()} onValueChange={(val) => setCorrectAnswer(parseInt(val))}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="0" id="a" />
                      <Label htmlFor="a">Option A</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1" id="b" />
                      <Label htmlFor="b">Option B</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="2" id="c" />
                      <Label htmlFor="c">Option C</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="3" id="d" />
                      <Label htmlFor="d">Option D</Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button type="submit" className="w-full">
                  Add Daily MCQ
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
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

          <div className="space-y-4">
            {mcqs.map((mcq) => (
              <Card key={mcq.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{mcq.question}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Date: {mcq.date} | Marks: {mcq.marks || 1}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">
                          {mcq.enabled ? 'Enabled' : 'Disabled'}
                        </Label>
                        <Switch
                          checked={mcq.enabled}
                          onCheckedChange={() => handleToggleEnabled(mcq.id, mcq.enabled)}
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(mcq.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {mcq.options.map((option, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        index === mcq.answer
                          ? 'bg-green-50 border-green-500 dark:bg-green-950 dark:border-green-700'
                          : 'bg-background'
                      }`}
                    >
                      <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
