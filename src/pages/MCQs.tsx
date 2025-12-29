import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Plus, Upload, Download, BookOpen, Pencil } from 'lucide-react';
import Papa from 'papaparse';

interface MCQ {
  question: string;
  options: string[];
  answer: number;
  marks: number;
}

interface SubjectTest {
  id: string;
  name: string;
  class: string;
  subject: string;
  totalQuestions: number;
  totalMarks: number;
  questions: MCQ[];
  createdAt: Date;
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

export default function MCQs() {
  const [tests, setTests] = useState<SubjectTest[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [openTestDialog, setOpenTestDialog] = useState(false);
  const [openMCQDialog, setOpenMCQDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [testName, setTestName] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
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
      fetchSubjects();
      fetchTests();
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

  const fetchSubjects = async () => {
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

  const fetchTests = async () => {
    const snapshot = await getDocs(collection(db, 'subject-tests'));
    const data = snapshot.docs
      .map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      } as SubjectTest))
      .filter(test => test.class === selectedClass)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    setTests(data);
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, 'subject-tests'), {
        name: testName,
        class: selectedClass,
        subject: selectedSubject,
        totalQuestions,
        totalMarks: 0,
        questions: [],
        createdAt: new Date()
      });
      
      toast.success('Test created successfully');
      setOpenTestDialog(false);
      setTestName('');
      setSelectedSubject('');
      setTotalQuestions(10);
      fetchTests();
    } catch (error) {
      toast.error('Failed to create test');
    }
  };

  const handleAddMCQ = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const test = tests.find(t => t.id === selectedTestId);
      if (!test) {
        toast.error('Test not found');
        return;
      }

      if (editingQuestionIndex !== null) {
        // Edit existing question
        const updatedQuestions = test.questions.map((q, idx) =>
          idx === editingQuestionIndex
            ? {
                question,
                options: [optionA, optionB, optionC, optionD],
                answer: correctAnswer,
                marks
              }
            : q
        );
        const updatedTotalMarks = updatedQuestions.reduce((sum, q) => sum + q.marks, 0);

        await updateDoc(doc(db, 'subject-tests', selectedTestId), {
          questions: updatedQuestions,
          totalMarks: updatedTotalMarks
        });

        toast.success('MCQ updated successfully');
      } else {
        // Add new question
        if (test.questions.length >= test.totalQuestions) {
          toast.error(`Test already has ${test.totalQuestions} questions`);
          return;
        }

        const newQuestion: MCQ = {
          question,
          options: [optionA, optionB, optionC, optionD],
          answer: correctAnswer,
          marks
        };

        const updatedQuestions = [...test.questions, newQuestion];
        const updatedTotalMarks = test.totalMarks + marks;

        await updateDoc(doc(db, 'subject-tests', selectedTestId), {
          questions: updatedQuestions,
          totalMarks: updatedTotalMarks
        });

        toast.success('MCQ added successfully');
      }
      
      setOpenMCQDialog(false);
      setQuestion('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setCorrectAnswer(0);
      setMarks(1);
      setEditingQuestionIndex(null);
      fetchTests();
    } catch (error) {
      toast.error(editingQuestionIndex !== null ? 'Failed to update MCQ' : 'Failed to add MCQ');
    }
  };

  const handleEditMCQ = (testId: string, index: number, mcq: MCQ) => {
    setSelectedTestId(testId);
    setEditingQuestionIndex(index);
    setQuestion(mcq.question);
    setOptionA(mcq.options[0]);
    setOptionB(mcq.options[1]);
    setOptionC(mcq.options[2]);
    setOptionD(mcq.options[3]);
    setCorrectAnswer(mcq.answer);
    setMarks(mcq.marks);
    setOpenMCQDialog(true);
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer (0-3)', 'Marks'],
      ['What is 2+2?', '3', '4', '5', '6', '1', '1'],
      ['Capital of France?', 'London', 'Paris', 'Berlin', 'Rome', '1', '2'],
    ];
    
    const csv = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subject_test_mcqs_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkUpload = (testId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const test = tests.find(t => t.id === testId);
    if (!test) {
      toast.error('Test not found');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const newQuestions: MCQ[] = [];
          let totalNewMarks = 0;
          let errorCount = 0;

          for (const row of results.data as any[]) {
            try {
              const answer = parseInt(row['Correct Answer (0-3)']);
              if (isNaN(answer) || answer < 0 || answer > 3) {
                errorCount++;
                continue;
              }

              const questionMarks = parseInt(row['Marks']) || 1;

              if (test.questions.length + newQuestions.length >= test.totalQuestions) {
                toast.error(`Cannot add more questions. Test limit is ${test.totalQuestions}`);
                break;
              }

              newQuestions.push({
                question: row['Question'],
                options: [
                  row['Option A'],
                  row['Option B'],
                  row['Option C'],
                  row['Option D']
                ],
                answer,
                marks: questionMarks
              });
              totalNewMarks += questionMarks;
            } catch (err) {
              errorCount++;
            }
          }

          if (newQuestions.length > 0) {
            const updatedQuestions = [...test.questions, ...newQuestions];
            const updatedTotalMarks = test.totalMarks + totalNewMarks;

            await updateDoc(doc(db, 'subject-tests', testId), {
              questions: updatedQuestions,
              totalMarks: updatedTotalMarks
            });

            toast.success(`${newQuestions.length} MCQs uploaded successfully`);
            fetchTests();
          }
          if (errorCount > 0) {
            toast.error(`${errorCount} MCQs failed to upload`);
          }
        } catch (error) {
          toast.error('Failed to process CSV file');
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
            <h1 className="text-3xl font-bold">Subject Test MCQs</h1>
            <p className="text-muted-foreground">Create tests and manage subject-based questions</p>
          </div>
          <Dialog open={openTestDialog} onOpenChange={setOpenTestDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Test
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Subject Test</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testName">Test Name</Label>
                  <Input
                    id="testName"
                    placeholder="e.g., Computer Fundamentals Test"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    required
                  />
                </div>
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
                  <Select value={selectedSubject} onValueChange={setSelectedSubject} required>
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

        <div className="flex gap-4">
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
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((subj) => (
                <SelectItem key={subj.id} value={subj.name}>
                  {subj.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6">
          {tests
            .filter(test => filterSubject === 'all' || test.subject === filterSubject)
            .map((test) => (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      {test.name}
                    </CardTitle>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Subject: {test.subject}</span>
                      <span>Questions: {test.questions.length}/{test.totalQuestions}</span>
                      <span>Total Marks: {test.totalMarks}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={downloadSampleCSV}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Sample CSV
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      asChild
                      disabled={test.questions.length >= test.totalQuestions}
                    >
                      <label className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Bulk Upload
                        <input
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={handleBulkUpload(test.id)}
                          disabled={test.questions.length >= test.totalQuestions}
                        />
                      </label>
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => {
                        setSelectedTestId(test.id);
                        setOpenMCQDialog(true);
                      }}
                      disabled={test.questions.length >= test.totalQuestions}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add MCQ
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {test.questions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No questions added yet
                  </p>
                ) : (
                  test.questions.map((mcq, index) => (
                    <div key={index} className="space-y-2 pb-4 border-b last:border-0">
                      <div className="flex items-start justify-between">
                        <p className="font-medium">
                          Q{index + 1}. {mcq.question}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {mcq.marks} {mcq.marks === 1 ? 'mark' : 'marks'}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditMCQ(test.id, index, mcq)}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {mcq.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`p-2 rounded-lg border text-sm ${
                              optIndex === mcq.answer
                                ? 'bg-green-50 border-green-500 dark:bg-green-950 dark:border-green-700'
                                : 'bg-background'
                            }`}
                          >
                            <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span> {option}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
          {tests.filter(test => filterSubject === 'all' || test.subject === filterSubject).length === 0 && (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  No tests found. Create a test to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={openMCQDialog} onOpenChange={(open) => {
          setOpenMCQDialog(open);
          if (!open) {
            setEditingQuestionIndex(null);
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
              <DialogTitle>{editingQuestionIndex !== null ? 'Edit MCQ' : 'Add MCQ to Test'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMCQ} className="space-y-4">
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
              <Button type="submit" className="w-full">
                {editingQuestionIndex !== null ? 'Update MCQ' : 'Add MCQ'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
