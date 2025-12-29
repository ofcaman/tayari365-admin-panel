import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Plus, Trash2, Clock, FileQuestion, Download, Upload, Pencil } from 'lucide-react';
import Papa from 'papaparse';

interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number;
  marks: number;
}

interface Test {
  id: string;
  title: string;
  category: string;
  duration: number;
  totalQuestions: number;
  totalMarks: number;
  questions: TestQuestion[];
  createdAt: Date;
}

export default function TestPreparation() {
  const [tests, setTests] = useState<Test[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ioe');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  // Question states
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [currentTestId, setCurrentTestId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [marks, setMarks] = useState(1);

  const categories = [
    { value: 'ioe', label: 'IOE Entrance' },
    { value: 'loksewa', label: 'Loksewa' },
    { value: 'cee', label: 'CEE' },
    { value: 'sat', label: 'SAT' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchTests();
  }, [selectedCategory]);

  const fetchTests = async () => {
    const snapshot = await getDocs(collection(db, 'testPreparation'));
    const data = snapshot.docs
      .map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Test))
      .filter(test => test.category === selectedCategory)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    setTests(data);
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, 'testPreparation'), {
        title,
        category: selectedCategory,
        duration,
        totalQuestions,
        totalMarks: 0,
        questions: [],
        createdAt: new Date()
      });
      
      toast.success('Test created successfully');
      setOpen(false);
      setTitle('');
      setDuration(60);
      setTotalQuestions(0);
      fetchTests();
    } catch (error) {
      toast.error('Failed to create test');
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTestId) return;

    try {
      const testRef = doc(db, 'testPreparation', currentTestId);
      const currentTest = tests.find(t => t.id === currentTestId);
      if (!currentTest) return;

      if (editingQuestionId) {
        // Edit existing question
        const updatedQuestions = currentTest.questions.map(q =>
          q.id === editingQuestionId
            ? {
                ...q,
                question,
                options: [optionA, optionB, optionC, optionD],
                answer: correctAnswer,
                marks
              }
            : q
        );
        const updatedTotalMarks = updatedQuestions.reduce((sum, q) => sum + q.marks, 0);

        await addDoc(collection(db, 'testPreparation'), {
          ...currentTest,
          questions: updatedQuestions,
          totalMarks: updatedTotalMarks
        });

        await deleteDoc(testRef);
        toast.success('Question updated successfully');
      } else {
        // Add new question
        const newQuestion: TestQuestion = {
          id: Date.now().toString(),
          question,
          options: [optionA, optionB, optionC, optionD],
          answer: correctAnswer,
          marks
        };

        const updatedQuestions = [...(currentTest.questions || []), newQuestion];
        const updatedTotalMarks = updatedQuestions.reduce((sum, q) => sum + q.marks, 0);

        await addDoc(collection(db, 'testPreparation'), {
          ...currentTest,
          questions: updatedQuestions,
          totalMarks: updatedTotalMarks
        });

        await deleteDoc(testRef);
        toast.success('Question added successfully');
      }
      
      setQuestionDialogOpen(false);
      setQuestion('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setCorrectAnswer(0);
      setMarks(1);
      setCurrentTestId(null);
      setEditingQuestionId(null);
      fetchTests();
    } catch (error) {
      toast.error(editingQuestionId ? 'Failed to update question' : 'Failed to add question');
    }
  };

  const handleEditQuestion = (testId: string, questionToEdit: TestQuestion) => {
    setCurrentTestId(testId);
    setEditingQuestionId(questionToEdit.id);
    setQuestion(questionToEdit.question);
    setOptionA(questionToEdit.options[0]);
    setOptionB(questionToEdit.options[1]);
    setOptionC(questionToEdit.options[2]);
    setOptionD(questionToEdit.options[3]);
    setCorrectAnswer(questionToEdit.answer);
    setMarks(questionToEdit.marks);
    setQuestionDialogOpen(true);
  };

  const handleDeleteTest = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'testPreparation', id));
      toast.success('Test deleted successfully');
      fetchTests();
    } catch (error) {
      toast.error('Failed to delete test');
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = `Question,Option A,Option B,Option C,Option D,Correct Answer,Marks
What is the capital of Nepal?,Kathmandu,Pokhara,Lalitpur,Bhaktapur,0,1
Which gas is most abundant in Earth's atmosphere?,Oxygen,Nitrogen,Carbon Dioxide,Hydrogen,1,2
What is 5 + 7?,10,11,12,13,2,1`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_questions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Sample CSV downloaded');
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentTestId) return;

    const currentTest = tests.find(t => t.id === currentTestId);
    if (!currentTest) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const newQuestions: TestQuestion[] = results.data
            .filter((row: any) => row.Question && row['Option A'])
            .map((row: any, index: number) => ({
              id: `${Date.now()}_${index}`,
              question: row.Question,
              options: [row['Option A'], row['Option B'], row['Option C'], row['Option D']],
              answer: parseInt(row['Correct Answer']) || 0,
              marks: parseInt(row.Marks) || 1
            }));

          const remainingSlots = currentTest.totalQuestions - (currentTest.questions?.length || 0);
          const questionsToAdd = newQuestions.slice(0, remainingSlots);

          const updatedQuestions = [...(currentTest.questions || []), ...questionsToAdd];
          const updatedTotalMarks = updatedQuestions.reduce((sum, q) => sum + q.marks, 0);

          const testRef = doc(db, 'testPreparation', currentTestId);
          await addDoc(collection(db, 'testPreparation'), {
            ...currentTest,
            questions: updatedQuestions,
            totalMarks: updatedTotalMarks
          });
          await deleteDoc(testRef);

          toast.success(`${questionsToAdd.length} questions uploaded successfully`);
          fetchTests();
        } catch (error) {
          toast.error('Failed to upload questions');
        }
      },
      error: () => {
        toast.error('Failed to parse CSV file');
      }
    });

    e.target.value = '';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Test Preparation</h1>
            <p className="text-muted-foreground">Manage entrance exam preparation tests</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Test
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Test</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTest} className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Test Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., IOE Entrance Mock Test 2025"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalQuestions">Total Questions</Label>
                  <Input
                    id="totalQuestions"
                    type="number"
                    min="1"
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(parseInt(e.target.value))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create Test
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{test.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {test.duration} min
                    </div>
                    <div className="flex items-center gap-1">
                      <FileQuestion className="w-4 h-4" />
                      {test.questions?.length || 0}/{test.totalQuestions}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm">
                    <p><strong>Total Marks:</strong> {test.totalMarks}</p>
                    <p><strong>Category:</strong> {categories.find(c => c.value === test.category)?.label}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setCurrentTestId(test.id);
                          setQuestionDialogOpen(true);
                        }}
                        disabled={(test.questions?.length || 0) >= test.totalQuestions}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTest(test.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={downloadSampleCSV}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Sample CSV
                      </Button>
                      <label className="flex-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setCurrentTestId(test.id);
                            document.getElementById(`bulk-upload-${test.id}`)?.click();
                          }}
                          disabled={(test.questions?.length || 0) >= test.totalQuestions}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Bulk Upload
                        </Button>
                        <input
                          id={`bulk-upload-${test.id}`}
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={handleBulkUpload}
                        />
                      </label>
                    </div>
                  </div>
                  
                  {/* Questions List */}
                  {test.questions && test.questions.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <h4 className="font-semibold text-sm">Questions:</h4>
                      {test.questions.map((q, idx) => (
                        <div key={q.id} className="p-3 border rounded-lg space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium">
                              Q{idx + 1}. {q.question}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-muted-foreground">{q.marks}m</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditQuestion(test.id, q)}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            {q.options.map((opt, optIdx) => (
                              <div
                                key={optIdx}
                                className={`p-2 rounded ${
                                  optIdx === q.answer
                                    ? 'bg-green-50 border border-green-500 dark:bg-green-950 dark:border-green-700'
                                    : 'bg-muted'
                                }`}
                              >
                                {String.fromCharCode(65 + optIdx)}. {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Question Dialog */}
        <Dialog open={questionDialogOpen} onOpenChange={(open) => {
          setQuestionDialogOpen(open);
          if (!open) {
            setEditingQuestionId(null);
            setQuestion('');
            setOptionA('');
            setOptionB('');
            setOptionC('');
            setOptionD('');
            setCorrectAnswer(0);
            setMarks(1);
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingQuestionId ? 'Edit Question' : 'Add Question'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddQuestion} className="space-y-4">
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
                    <RadioGroupItem value="0" id="qa" />
                    <Label htmlFor="qa">Option A</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="qb" />
                    <Label htmlFor="qb">Option B</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="qc" />
                    <Label htmlFor="qc">Option C</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="qd" />
                    <Label htmlFor="qd">Option D</Label>
                  </div>
                </RadioGroup>
              </div>
              <Button type="submit" className="w-full">
                {editingQuestionId ? 'Update Question' : 'Add Question'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
