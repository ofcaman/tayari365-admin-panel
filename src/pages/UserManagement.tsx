import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { UserX, UserCheck, Filter } from 'lucide-react';

interface User {
  id: string;
  email: string;
  class: string;
  faculty?: string;
  name?: string;
  blocked?: boolean;
  status?: string;
  createdAt?: any;
}

interface Class {
  id: string;
  name: string;
}

interface Faculty {
  id: string;
  name: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
    fetchClasses();
    fetchFaculties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, selectedClass, selectedFaculty]);

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as User));
      setUsers(data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'classes'));
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name 
      } as Class));
      setClasses(data);
    } catch (error) {
      console.error('Failed to fetch classes');
    }
  };

  const fetchFaculties = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'faculties'));
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name 
      } as Faculty));
      setFaculties(data);
    } catch (error) {
      console.error('Failed to fetch faculties');
    }
  };

  const applyFilters = () => {
    let filtered = [...users];
    
    if (selectedClass !== 'all') {
      filtered = filtered.filter(user => user.class === selectedClass);
    }
    
    if (selectedFaculty !== 'all') {
      filtered = filtered.filter(user => user.faculty === selectedFaculty);
    }
    
    setFilteredUsers(filtered);
  };

  const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        blocked: !currentStatus,
        status: !currentStatus ? 'blocked' : 'active'
      });
      toast.success(`User ${!currentStatus ? 'blocked' : 'unblocked'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const isUserBlocked = (user: User) => {
    return user.blocked || user.status === 'blocked';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user access and permissions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.name}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Faculties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Faculties</SelectItem>
                    {faculties.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.name}>
                        {faculty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {user.name || user.email}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <Badge variant="outline">
                        {user.class}
                      </Badge>
                      {user.faculty && (
                        <Badge variant="secondary">
                          {user.faculty}
                        </Badge>
                      )}
                      {isUserBlocked(user) && (
                        <Badge variant="destructive">Blocked</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant={isUserBlocked(user) ? "default" : "destructive"}
                    size="sm"
                    onClick={() => handleToggleBlock(user.id, isUserBlocked(user))}
                  >
                    {isUserBlocked(user) ? (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Unblock
                      </>
                    ) : (
                      <>
                        <UserX className="w-4 h-4 mr-2" />
                        Block
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              {user.createdAt && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Joined: {new Date(user.createdAt.toDate()).toLocaleDateString()}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}

          {filteredUsers.length === 0 && !loading && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {selectedClass !== 'all' || selectedFaculty !== 'all' 
                  ? 'No users found matching the selected filters' 
                  : 'No users found'}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
