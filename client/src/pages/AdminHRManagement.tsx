import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, UserPlus, UserCog, Calendar, Clock, 
  Edit, Trash2, Eye, CheckCircle, XCircle, 
  History, ShieldCheck, Banknote as BanknoteIcon,
  Briefcase as BriefcaseIcon, FileText as FileTextIcon,
  Phone as PhoneIcon, Mail as MailIcon, MapPin as MapPinIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: 'admin' | 'manager' | 'support' | 'accountant' | 'hr';
  department: string;
  salary: number;
  hireDate: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  permissions: string[];
  attendanceRate: number;
  performanceScore: number;
  lastActive: string;
  address: string;
  emergencyContact: string;
  documents: string[];
}

interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  checkIn: string;
  checkOut: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'on_leave';
  hoursWorked: number;
  notes: string;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'annual' | 'sick' | 'emergency' | 'unpaid';
  startDate: string;
  endDate: string;
  duration: number;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  submittedAt: string;
}

export default function AdminHRManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('employees');
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: 'admin' as Employee['position'],
    department: 'management',
    salary: '',
    hireDate: new Date(),
    address: '',
    emergencyContact: '',
    permissions: ['view_dashboard', 'manage_orders']
  });

  const [attendanceForm, setAttendanceForm] = useState({
    employeeId: '',
    status: 'present' as Attendance['status'],
    notes: '',
    date: new Date()
  });

  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    type: 'annual' as LeaveRequest['type'],
    startDate: new Date(),
    endDate: new Date(),
    reason: ''
  });

  // جلب الموظفين
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['/api/admin/employees'],
  });

  // جلب الحضور
  const { data: attendanceRecords } = useQuery<Attendance[]>({
    queryKey: ['/api/admin/attendance'],
  });

  // جلب طلبات الإجازة
  const { data: leaveRequests } = useQuery<LeaveRequest[]>({
    queryKey: ['/api/admin/leave-requests'],
  });

  // إضافة موظف جديد
  const addEmployeeMutation = useMutation({
    mutationFn: async (data: typeof employeeForm) => {
      const response = await apiRequest('POST', '/api/admin/employees', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      toast({ title: 'تم إضافة الموظف بنجاح' });
      setShowEmployeeDialog(false);
      resetEmployeeForm();
    },
  });

  // تسجيل حضور
  const addAttendanceMutation = useMutation({
    mutationFn: async (data: typeof attendanceForm) => {
      const response = await apiRequest('POST', '/api/admin/attendance', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/attendance'] });
      toast({ title: 'تم تسجيل الحضور بنجاح' });
      setShowAttendanceDialog(false);
    },
  });

  // طلب إجازة
  const addLeaveMutation = useMutation({
    mutationFn: async (data: typeof leaveForm) => {
      const response = await apiRequest('POST', '/api/admin/leave-requests', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/leave-requests'] });
      toast({ title: 'تم إرسال طلب الإجازة بنجاح' });
      setShowLeaveDialog(false);
    },
  });

  // تحديث حالة طلب إجازة
  const updateLeaveStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const response = await apiRequest('PUT', `/api/admin/leave-requests/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/leave-requests'] });
      toast({ title: 'تم تحديث حالة الطلب بنجاح' });
    },
  });

  const resetEmployeeForm = () => {
    setEmployeeForm({
      name: '',
      email: '',
      phone: '',
      position: 'admin',
      department: 'management',
      salary: '',
      hireDate: new Date(),
      address: '',
      emergencyContact: '',
      permissions: ['view_dashboard', 'manage_orders']
    });
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الموارد البشرية</h1>
          <p className="text-gray-500 mt-1">إدارة شؤون الموظفين، الحضور، والإجازات</p>
        </div>
        <Button onClick={() => setShowEmployeeDialog(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          إضافة موظف جديد
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="employees" className="gap-2">
            <Users className="w-4 h-4" />
            الموظفين
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <Clock className="w-4 h-4" />
            الحضور والإنصراف
          </TabsTrigger>
          <TabsTrigger value="leave" className="gap-2">
            <Calendar className="w-4 h-4" />
            طلبات الإجازة
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-2">
            <BanknoteIcon className="w-4 h-4" />
            الرواتب
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>قائمة الموظفين</CardTitle>
                  <CardDescription>إدارة بيانات وصلاحيات الموظفين</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="بحث عن موظف..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="القسم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأقسام</SelectItem>
                      <SelectItem value="management">الإدارة</SelectItem>
                      <SelectItem value="support">الدعم الفني</SelectItem>
                      <SelectItem value="accounting">المحاسبة</SelectItem>
                      <SelectItem value="hr">الموارد البشرية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الموظف</TableHead>
                    <TableHead>القسم / المنصب</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ التعيين</TableHead>
                    <TableHead>الراتب</TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees?.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {employee.name[0]}
                          </div>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-xs text-gray-500">{employee.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{employee.department}</div>
                        <div className="text-xs text-gray-500">{employee.position}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                          {employee.status === 'active' ? 'نشط' : employee.status === 'on_leave' ? 'في إجازة' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(employee.hireDate).toLocaleDateString('ar-YE')}</TableCell>
                      <TableCell>{employee.salary} ر.ي</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>سجل الحضور والإنصراف</CardTitle>
                <CardDescription>تتبع حضور وانصراف الموظفين يومياً</CardDescription>
              </div>
              <Button onClick={() => setShowAttendanceDialog(true)} variant="outline" className="gap-2">
                <Clock className="w-4 h-4" />
                تسجيل حضور يدوي
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الموظف</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>وقت الحضور</TableHead>
                    <TableHead>وقت الإنصراف</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>ساعات العمل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords?.map((record) => {
                    const employee = employees?.find(e => e.id === record.employeeId);
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{employee?.name || 'موظف سابق'}</TableCell>
                        <TableCell>{new Date(record.date).toLocaleDateString('ar-YE')}</TableCell>
                        <TableCell>{record.checkIn ? new Date(record.checkIn).toLocaleTimeString('ar-YE') : '-'}</TableCell>
                        <TableCell>{record.checkOut ? new Date(record.checkOut).toLocaleTimeString('ar-YE') : '-'}</TableCell>
                        <TableCell>
                          <Badge variant={record.status === 'present' ? 'default' : 'destructive'}>
                            {record.status === 'present' ? 'حاضر' : record.status === 'absent' ? 'غائب' : 'متأخر'}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.hoursWorked || 0} ساعة</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>طلبات الإجازة</CardTitle>
                <CardDescription>مراجعة والموافقة على طلبات إجازات الموظفين</CardDescription>
              </div>
              <Button onClick={() => setShowLeaveDialog(true)} variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                تقديم طلب إجازة
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الموظف</TableHead>
                    <TableHead>نوع الإجازة</TableHead>
                    <TableHead>من</TableHead>
                    <TableHead>إلى</TableHead>
                    <TableHead>السبب</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests?.map((request) => {
                    const employee = employees?.find(e => e.id === request.employeeId);
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{employee?.name || 'موظف سابق'}</TableCell>
                        <TableCell>
                          {request.type === 'annual' ? 'سنوية' : request.type === 'sick' ? 'مرضية' : 'طارئة'}
                        </TableCell>
                        <TableCell>{new Date(request.startDate).toLocaleDateString('ar-YE')}</TableCell>
                        <TableCell>{new Date(request.endDate).toLocaleDateString('ar-YE')}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{request.reason}</TableCell>
                        <TableCell>
                          <Badge variant={request.status === 'approved' ? 'default' : request.status === 'pending' ? 'outline' : 'destructive'}>
                            {request.status === 'approved' ? 'مقبولة' : request.status === 'pending' ? 'قيد الانتظار' : 'مرفوضة'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-green-600 hover:text-green-700"
                                onClick={() => updateLeaveStatusMutation.mutate({ id: request.id, status: 'approved' })}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-destructive"
                                onClick={() => updateLeaveStatusMutation.mutate({ id: request.id, status: 'rejected' })}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle>مسير الرواتب</CardTitle>
              <CardDescription>إدارة المستحقات والرواتب الشهرية للموظفين</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BanknoteIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>نظام الرواتب قيد التطوير</p>
                <p className="text-sm">سيتم توفير تقارير الرواتب والمدفوعات قريباً</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
        <DialogContent className="max-w-2xl rtl">
          <DialogHeader>
            <DialogTitle>إضافة موظف جديد</DialogTitle>
            <CardDescription>أدخل بيانات الموظف الجديد لتعيينه في النظام</CardDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input 
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm({...employeeForm, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input 
                type="email"
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm({...employeeForm, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input 
                value={employeeForm.phone}
                onChange={(e) => setEmployeeForm({...employeeForm, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>المنصب</Label>
              <Select 
                value={employeeForm.position}
                onValueChange={(v: Employee['position']) => setEmployeeForm({...employeeForm, position: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مدير نظام</SelectItem>
                  <SelectItem value="manager">مدير قسم</SelectItem>
                  <SelectItem value="support">موظف دعم</SelectItem>
                  <SelectItem value="accountant">محاسب</SelectItem>
                  <SelectItem value="hr">موظف موارد بشرية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الراتب الأساسي</Label>
              <Input 
                type="number"
                value={employeeForm.salary}
                onChange={(e) => setEmployeeForm({...employeeForm, salary: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>تاريخ التعيين</Label>
              <DatePicker 
                date={employeeForm.hireDate}
                setDate={(date) => setEmployeeForm({...employeeForm, hireDate: date || new Date()})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmployeeDialog(false)}>إلغاء</Button>
            <Button onClick={() => addEmployeeMutation.mutate(employeeForm)}>إضافة الموظف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAttendanceDialog} onOpenChange={setShowAttendanceDialog}>
        <DialogContent className="rtl">
          <DialogHeader>
            <DialogTitle>تسجيل حضور يدوي</DialogTitle>
            <CardDescription>تسجيل حالة حضور موظف لتاريخ محدد</CardDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الموظف</Label>
              <Select value={attendanceForm.employeeId} onValueChange={(v) => setAttendanceForm({...attendanceForm, employeeId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={attendanceForm.status} onValueChange={(v: Attendance['status']) => setAttendanceForm({...attendanceForm, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">حاضر</SelectItem>
                  <SelectItem value="absent">غائب</SelectItem>
                  <SelectItem value="late">متأخر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea 
                value={attendanceForm.notes}
                onChange={(e) => setAttendanceForm({...attendanceForm, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAttendanceDialog(false)}>إلغاء</Button>
            <Button onClick={() => addAttendanceMutation.mutate(attendanceForm)}>تسجيل</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="rtl">
          <DialogHeader>
            <DialogTitle>تقديم طلب إجازة</DialogTitle>
            <CardDescription>إضافة طلب إجازة جديد للموظف</CardDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الموظف</Label>
              <Select value={leaveForm.employeeId} onValueChange={(v) => setLeaveForm({...leaveForm, employeeId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>من تاريخ</Label>
                <DatePicker 
                  date={leaveForm.startDate}
                  setDate={(d) => setLeaveForm({...leaveForm, startDate: d || new Date()})}
                />
              </div>
              <div className="space-y-2">
                <Label>إلى تاريخ</Label>
                <DatePicker 
                  date={leaveForm.endDate}
                  setDate={(d) => setLeaveForm({...leaveForm, endDate: d || new Date()})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>السبب</Label>
              <Textarea 
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>إلغاء</Button>
            <Button onClick={() => addLeaveMutation.mutate(leaveForm)}>تقديم الطلب</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
