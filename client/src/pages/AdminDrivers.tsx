import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Truck, Save, X, Phone, MapPin, User, Wallet, History, Coins, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Driver, DriverTransaction, DriverBalance, DriverCommission } from '@shared/schema';

interface DriverResponse extends Omit<Driver, 'commissionRate'> {
  commissionRate?: string | number;
  totalEarnings?: string | number;
}

interface DriverFormData {
  name: string;
  phone: string;
  password?: string;
  currentLocation?: string;
  isAvailable: boolean;
  isActive: boolean;
  commissionRate: string;
  vehicleType?: string;
  vehicleNumber?: string;
  email?: string;
  paymentMode?: string;
  salaryAmount?: string;
}

interface TransactionFormData {
  amount: string;
  type: 'commission' | 'salary' | 'bonus' | 'deduction' | 'withdrawal';
  description: string;
  referenceId?: string;
}

interface CommissionFormData {
  orderId: string;
  orderAmount: string;
  commissionRate: string;
}

export default function AdminDrivers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingDriver, setEditingDriver] = useState<DriverResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverResponse | null>(null);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const driversGridRef = useRef<HTMLDivElement>(null);
  
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const [formData, setFormData] = useState<DriverFormData>({
    name: '',
    phone: '',
    password: '',
    currentLocation: '',
    isAvailable: true,
    isActive: true,
    commissionRate: '70.00',
  });

  const [transactionData, setTransactionData] = useState<TransactionFormData>({
    amount: '',
    type: 'commission',
    description: '',
    referenceId: '',
  });

  const [commissionData, setCommissionData] = useState<CommissionFormData>({
    orderId: '',
    orderAmount: '',
    commissionRate: '',
  });

  const { data: drivers, isLoading } = useQuery<DriverResponse[]>({
    queryKey: ['/api/drivers'],
  });

  const { data: driverBalance } = useQuery<DriverBalance>({
    queryKey: ['/api/drivers', selectedDriver?.id, 'balance'],
    enabled: !!selectedDriver,
  });

  const { data: driverTransactions } = useQuery<DriverTransaction[]>({
    queryKey: ['/api/drivers', selectedDriver?.id, 'transactions'],
    enabled: !!selectedDriver,
  });

  const { data: driverCommissions } = useQuery<DriverCommission[]>({
    queryKey: ['/api/drivers', selectedDriver?.id, 'commissions'],
    enabled: !!selectedDriver,
  });

  useEffect(() => {
    const handleScroll = () => {
      if (mainContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = mainContainerRef.current;
        setShowScrollToTop(scrollTop > 200);
        setShowScrollToBottom(scrollTop < scrollHeight - clientHeight - 200);
      }
    };

    const container = mainContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // دالة لتحويل القيم العددية إلى نصية بصيغة مناسبة
  const formatDecimalField = (value: any): string => {
    if (value === null || value === undefined || value === '') return '0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // دالة لتنظيف رقم الهاتف
  const cleanPhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, '');
  };

  // إضافة سائق جديد
  const createDriverMutation = useMutation({
    mutationFn: async (data: DriverFormData) => {
      // تحضير البيانات للإرسال
      const requestData: Record<string, any> = {
        name: data.name.trim(),
        phone: cleanPhoneNumber(data.phone),
        isAvailable: data.isAvailable,
        isActive: data.isActive,
        commissionRate: formatDecimalField(data.commissionRate),
        paymentMode: 'commission',
        salaryAmount: '0.00',
      };

      // إضافة كلمة المرور فقط إذا كانت موجودة
      if (data.password && data.password.trim()) {
        requestData.password = data.password.trim();
      }

      // إضافة الحقول الاختيارية إذا كانت موجودة
      if (data.currentLocation && data.currentLocation.trim()) {
        requestData.currentLocation = data.currentLocation.trim();
      }
      if (data.vehicleType && data.vehicleType.trim()) {
        requestData.vehicleType = data.vehicleType.trim();
      }
      if (data.vehicleNumber && data.vehicleNumber.trim()) {
        requestData.vehicleNumber = data.vehicleNumber.trim();
      }
      if (data.email && data.email.trim()) {
        requestData.email = data.email.trim();
      }

      const response = await apiRequest('POST', '/api/drivers', requestData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.details?.[0]?.message || 'فشل إضافة السائق');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
      toast({
        title: "✅ تم إضافة السائق",
        description: "تم إضافة السائق الجديد بنجاح",
      });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      console.error('Error creating driver:', error);
      toast({
        title: "❌ خطأ في إضافة السائق",
        description: error.message || "حدث خطأ أثناء إضافة السائق",
        variant: "destructive",
      });
    },
  });

  // تحديث بيانات سائق
  const updateDriverMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DriverFormData> }) => {
      const requestData: Record<string, any> = {};

      // إضافة الحقول المحدثة فقط
      if (data.name !== undefined) requestData.name = data.name.trim();
      if (data.phone !== undefined) requestData.phone = cleanPhoneNumber(data.phone);
      if (data.isAvailable !== undefined) requestData.isAvailable = data.isAvailable;
      if (data.isActive !== undefined) requestData.isActive = data.isActive;
      if (data.commissionRate !== undefined) requestData.commissionRate = formatDecimalField(data.commissionRate);
      if (data.currentLocation !== undefined) requestData.currentLocation = data.currentLocation?.trim();
      if (data.vehicleType !== undefined) requestData.vehicleType = data.vehicleType?.trim();
      if (data.vehicleNumber !== undefined) requestData.vehicleNumber = data.vehicleNumber?.trim();
      if (data.email !== undefined) requestData.email = data.email?.trim();
      
      // إضافة كلمة المرور فقط إذا كانت موجودة وليست فارغة
      if (data.password !== undefined && data.password && data.password.trim()) {
        requestData.password = data.password.trim();
      }

      const response = await apiRequest('PUT', `/api/drivers/${id}`, requestData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.details?.[0]?.message || 'فشل تحديث السائق');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
      if (selectedDriver) {
        queryClient.invalidateQueries({ queryKey: ['/api/drivers', selectedDriver.id, 'balance'] });
      }
      toast({
        title: "✅ تم تحديث السائق",
        description: "تم تحديث بيانات السائق بنجاح",
      });
      resetForm();
      setEditingDriver(null);
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      console.error('Error updating driver:', error);
      toast({
        title: "❌ خطأ في تحديث السائق",
        description: error.message || "حدث خطأ أثناء تحديث السائق",
        variant: "destructive",
      });
    },
  });

  // حذف سائق
  const deleteDriverMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/drivers/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل حذف السائق');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
      toast({
        title: "✅ تم حذف السائق",
        description: "تم حذف السائق بنجاح",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting driver:', error);
      toast({
        title: "❌ خطأ في حذف السائق",
        description: error.message || "حدث خطأ أثناء حذف السائق",
        variant: "destructive",
      });
    },
  });

  // إضافة معاملة للسائق
  const createTransactionMutation = useMutation({
    mutationFn: async () => {
      const requestData = {
        ...transactionData,
        amount: formatDecimalField(transactionData.amount),
      };

      const response = await apiRequest('POST', `/api/drivers/${selectedDriver?.id}/transactions`, requestData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل إضافة المعاملة');
      }
      return response.json();
    },
    onSuccess: () => {
      if (selectedDriver) {
        queryClient.invalidateQueries({ queryKey: ['/api/drivers', selectedDriver.id, 'balance'] });
        queryClient.invalidateQueries({ queryKey: ['/api/drivers', selectedDriver.id, 'transactions'] });
      }
      toast({
        title: "✅ تم إضافة المعاملة",
        description: `تم ${transactionData.type === 'withdrawal' ? 'سحب' : 'إضافة'} ${transactionData.amount} ريال`,
      });
      resetTransactionForm();
    },
    onError: (error: any) => {
      console.error('Error creating transaction:', error);
      toast({
        title: "❌ خطأ في إضافة المعاملة",
        description: error.message || "حدث خطأ أثناء إضافة المعاملة",
        variant: "destructive",
      });
    },
  });

  // إضافة عمولة للسائق
  const createCommissionMutation = useMutation({
    mutationFn: async () => {
      const commissionAmount = (parseFloat(commissionData.orderAmount) * parseFloat(commissionData.commissionRate)) / 100;
      const requestData = {
        orderId: commissionData.orderId.trim(),
        orderAmount: formatDecimalField(commissionData.orderAmount),
        commissionRate: formatDecimalField(commissionData.commissionRate),
        commissionAmount: commissionAmount.toFixed(2),
      };

      const response = await apiRequest('POST', `/api/drivers/${selectedDriver?.id}/commissions`, requestData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل إضافة العمولة');
      }
      return response.json();
    },
    onSuccess: () => {
      if (selectedDriver) {
        queryClient.invalidateQueries({ queryKey: ['/api/drivers', selectedDriver.id, 'balance'] });
        queryClient.invalidateQueries({ queryKey: ['/api/drivers', selectedDriver.id, 'transactions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/drivers', selectedDriver.id, 'commissions'] });
      }
      toast({
        title: "✅ تم إضافة العمولة",
        description: "تم احتساب عمولة السائق بنجاح",
      });
      setCommissionData({
        orderId: '',
        orderAmount: '',
        commissionRate: '',
      });
    },
    onError: (error: any) => {
      console.error('Error creating commission:', error);
      toast({
        title: "❌ خطأ في إضافة العمولة",
        description: error.message || "حدث خطأ أثناء إضافة العمولة",
        variant: "destructive",
      });
    },
  });

  // سحب رصيد السائق
  const processWithdrawalMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('POST', `/api/drivers/${selectedDriver?.id}/withdraw`, { 
        amount: amount.toFixed(2)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل عملية السحب');
      }
      return response.json();
    },
    onSuccess: () => {
      if (selectedDriver) {
        queryClient.invalidateQueries({ queryKey: ['/api/drivers', selectedDriver.id, 'balance'] });
        queryClient.invalidateQueries({ queryKey: ['/api/drivers', selectedDriver.id, 'transactions'] });
      }
      toast({
        title: "✅ تم السحب",
        description: "تم سحب المبلغ بنجاح",
      });
    },
    onError: (error: any) => {
      console.error('Error processing withdrawal:', error);
      toast({
        title: "❌ خطأ في السحب",
        description: error.message || "حدث خطأ أثناء عملية السحب",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      password: '',
      currentLocation: '',
      isAvailable: true,
      isActive: true,
      commissionRate: '70.00',
    });
    setEditingDriver(null);
  };

  const resetTransactionForm = () => {
    setTransactionData({
      amount: '',
      type: 'commission',
      description: '',
      referenceId: '',
    });
  };

  const handleEdit = (driver: DriverResponse) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone,
      password: '', // لا نعرض كلمة المرور عند التعديل
      currentLocation: driver.currentLocation || '',
      isAvailable: driver.isAvailable,
      isActive: driver.isActive,
      commissionRate: formatDecimalField(driver.commissionRate),
      vehicleType: driver.vehicleType || '',
      vehicleNumber: driver.vehicleNumber || '',
      email: driver.email || '',
    });
    setIsDialogOpen(true);
  };

  const handleManageAccount = (driver: DriverResponse) => {
    setSelectedDriver(driver);
    setIsAccountDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من البيانات
    if (!formData.name.trim()) {
      toast({
        title: "❌ خطأ",
        description: "يرجى إدخال اسم السائق",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "❌ خطأ",
        description: "يرجى إدخال رقم الهاتف",
        variant: "destructive",
      });
      return;
    }

    // التحقق من صحة رقم الهاتف
    const cleanedPhone = cleanPhoneNumber(formData.phone);
    if (cleanedPhone.length < 10 || cleanedPhone.length > 15) {
      toast({
        title: "❌ خطأ",
        description: "يرجى إدخال رقم هاتف صحيح (10-15 رقم)",
        variant: "destructive",
      });
      return;
    }

    // التحقق من نسبة العمولة
    const commissionRate = parseFloat(formData.commissionRate);
    if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
      toast({
        title: "❌ خطأ",
        description: "يرجى إدخال نسبة عمولة صحيحة بين 0 و 100",
        variant: "destructive",
      });
      return;
    }

    // التحقق من كلمة المرور للسائق الجديد
    if (!editingDriver && !formData.password?.trim()) {
      toast({
        title: "❌ خطأ",
        description: "يرجى إدخال كلمة المرور للسائق الجديد",
        variant: "destructive",
      });
      return;
    }

    // تنظيف البيانات قبل الإرسال
    const submitData = { ...formData };
    submitData.phone = cleanedPhone;
    submitData.commissionRate = formatDecimalField(submitData.commissionRate);

    if (editingDriver) {
      updateDriverMutation.mutate({ id: editingDriver.id, data: submitData });
    } else {
      createDriverMutation.mutate(submitData);
    }
  };

  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transactionData.amount || parseFloat(transactionData.amount) <= 0) {
      toast({
        title: "❌ خطأ",
        description: "يرجى إدخال مبلغ صحيح أكبر من صفر",
        variant: "destructive",
      });
      return;
    }

    if (!transactionData.description.trim()) {
      toast({
        title: "❌ خطأ",
        description: "يرجى إدخال وصف للمعاملة",
        variant: "destructive",
      });
      return;
    }

    createTransactionMutation.mutate();
  };

  const handleCommissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commissionData.orderId.trim()) {
      toast({
        title: "❌ خطأ",
        description: "يرجى إدخال رقم الطلب",
        variant: "destructive",
      });
      return;
    }

    if (!commissionData.orderAmount || parseFloat(commissionData.orderAmount) <= 0) {
      toast({
        title: "❌ خطأ",
        description: "يرجى إدخال مبلغ الطلب",
        variant: "destructive",
      });
      return;
    }

    if (!commissionData.commissionRate || parseFloat(commissionData.commissionRate) <= 0) {
      toast({
        title: "❌ خطأ",
        description: "يرجى إدخال نسبة العمولة",
        variant: "destructive",
      });
      return;
    }

    createCommissionMutation.mutate();
  };

  const handleWithdrawal = () => {
    if (!driverBalance || driverBalance.availableBalance <= 0) {
      toast({
        title: "❌ خطأ",
        description: "لا يوجد رصيد متاح للسحب",
        variant: "destructive",
      });
      return;
    }

    processWithdrawalMutation.mutate(driverBalance.availableBalance);
  };

  const toggleDriverStatus = (driver: DriverResponse, field: 'isAvailable' | 'isActive') => {
    updateDriverMutation.mutate({
      id: driver.id,
      data: { [field]: !driver[field] }
    });
  };

  const scrollToTop = () => {
    mainContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    if (mainContainerRef.current) {
      mainContainerRef.current.scrollTo({ 
        top: mainContainerRef.current.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  };

  const scrollToDriversGrid = () => {
    driversGridRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      commission: 'عمولة',
      salary: 'راتب',
      bonus: 'مكافأة',
      deduction: 'خصم',
      withdrawal: 'سحب',
      order: 'طلب',
    };
    return labels[type] || type;
  };

  const getDriverEarnings = (driver: DriverResponse) => {
    const earnings = driver.totalEarnings || 0;
    if (typeof earnings === 'string') {
      return parseFloat(earnings) || 0;
    }
    return earnings;
  };

  return (
    <div className="relative" ref={mainContainerRef} style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
      {/* أزرار التمرير العائمة */}
      <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-2">
        {showScrollToTop && (
          <Button
            onClick={scrollToTop}
            size="icon"
            className="rounded-full shadow-lg h-10 w-10 bg-primary hover:bg-primary/90"
            aria-label="التمرير للأعلى"
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
        )}
        {showScrollToBottom && (
          <Button
            onClick={scrollToBottom}
            size="icon"
            className="rounded-full shadow-lg h-10 w-10 bg-primary hover:bg-primary/90"
            aria-label="التمرير للأسفل"
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
        )}
        <Button
          onClick={scrollToDriversGrid}
          size="icon"
          className="rounded-full shadow-lg h-10 w-10 bg-secondary hover:bg-secondary/90"
          aria-label="الذهاب إلى قائمة السائقين"
        >
          <Truck className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Truck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">إدارة السائقين</h1>
              <p className="text-muted-foreground">إدارة سائقي التوصيل وأرصدتهم</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              onClick={scrollToDriversGrid}
              variant="outline"
              size="sm"
              className="gap-2 justify-center"
            >
              <Truck className="h-4 w-4" />
              قائمة السائقين
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="gap-2 justify-center"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(true);
                  }}
                  data-testid="button-add-driver"
                >
                  <Plus className="h-4 w-4" />
                  إضافة سائق جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingDriver ? 'تعديل بيانات السائق' : 'إضافة سائق جديد'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">الاسم الكامل *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="أدخل اسم السائق"
                      required
                      data-testid="input-driver-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">رقم الهاتف *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="مثال: 771234567"
                      required
                      data-testid="input-driver-phone"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">
                      كلمة المرور {editingDriver ? "(اختياري)" : "*"}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="كلمة المرور"
                      required={!editingDriver}
                      data-testid="input-driver-password"
                    />
                    {editingDriver && (
                      <p className="text-xs text-muted-foreground mt-1">
                        اتركها فارغة للاحتفاظ بكلمة المرور الحالية
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="commissionRate">نسبة العمولة (%) *</Label>
                    <Input
                      id="commissionRate"
                      type="text"
                      inputMode="decimal"
                      value={formData.commissionRate}
                      onChange={(e) => {
                        const value = e.target.value;
                        // السماح فقط بالأرقام والنقطة
                        if (/^\d*\.?\d*$/.test(value)) {
                          setFormData(prev => ({ ...prev, commissionRate: value }));
                        }
                      }}
                      placeholder="70.00"
                      required
                      data-testid="input-driver-commission"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      النسبة المئوية التي يحصل عليها السائق من كل طلب (0-100)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="currentLocation">الموقع الحالي (اختياري)</Label>
                    <Input
                      id="currentLocation"
                      value={formData.currentLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentLocation: e.target.value }))}
                      placeholder="الموقع الحالي للسائق"
                    />
                  </div>

                  <div>
                    <Label htmlFor="vehicleType">نوع المركبة (اختياري)</Label>
                    <Input
                      id="vehicleType"
                      value={formData.vehicleType || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, vehicleType: e.target.value }))}
                      placeholder="مثلاً: دراجة نارية، سيارة"
                    />
                  </div>

                  <div>
                    <Label htmlFor="vehicleNumber">رقم المركبة (اختياري)</Label>
                    <Input
                      id="vehicleNumber"
                      value={formData.vehicleNumber || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                      placeholder="رقم لوحة المركبة"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="available">متاح للعمل</Label>
                      <Switch
                        id="available"
                        checked={formData.isAvailable}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAvailable: checked }))}
                        data-testid="switch-driver-available"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="active">نشط</Label>
                      <Switch
                        id="active"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                        data-testid="switch-driver-active"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      className="flex-1 gap-2"
                      disabled={createDriverMutation.isPending || updateDriverMutation.isPending}
                      data-testid="button-save-driver"
                    >
                      {createDriverMutation.isPending || updateDriverMutation.isPending ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          {editingDriver ? 'تحديث' : 'إضافة'}
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        resetForm();
                        setIsDialogOpen(false);
                      }}
                      data-testid="button-cancel-driver"
                    >
                      <X className="h-4 w-4" />
                      إلغاء
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Drivers Grid */}
        <div ref={driversGridRef} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">قائمة السائقين</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {drivers?.length || 0} سائق
              </span>
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-muted rounded-full mb-4 mx-auto" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-2 mx-auto" />
                    <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : drivers?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {drivers.map((driver) => (
                <Card key={driver.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="text-center pb-3">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg truncate">{driver.name}</CardTitle>
                    <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                      <Badge variant={driver.isActive ? "default" : "secondary"}>
                        {driver.isActive ? 'نشط' : 'غير نشط'}
                      </Badge>
                      <Badge variant={driver.isAvailable ? "default" : "outline"}>
                        {driver.isAvailable ? 'متاح' : 'غير متاح'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-foreground truncate">{driver.phone}</span>
                      </div>
                      
                      {driver.currentLocation && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-foreground truncate">{driver.currentLocation}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-foreground">
                          نسبة العمولة: {formatDecimalField(driver.commissionRate)}%
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">
                          الرصيد: {formatCurrency(getDriverEarnings(driver))}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">متاح للعمل</p>
                        <Switch
                          checked={driver.isAvailable}
                          onCheckedChange={() => toggleDriverStatus(driver, 'isAvailable')}
                          data-testid={`switch-driver-available-${driver.id}`}
                          disabled={updateDriverMutation.isPending}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">نشط</p>
                        <Switch
                          checked={driver.isActive}
                          onCheckedChange={() => toggleDriverStatus(driver, 'isActive')}
                          data-testid={`switch-driver-active-${driver.id}`}
                          disabled={updateDriverMutation.isPending}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 min-w-0"
                        onClick={() => handleEdit(driver)}
                        data-testid={`button-edit-driver-${driver.id}`}
                      >
                        <Edit className="h-4 w-4" />
                        تعديل
                      </Button>
                      
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 gap-2 min-w-0"
                        onClick={() => handleManageAccount(driver)}
                        data-testid={`button-manage-account-${driver.id}`}
                      >
                        <Wallet className="h-4 w-4" />
                        إدارة الرصيد
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`tel:${driver.phone}`)}
                        className="flex-1"
                        data-testid={`button-call-driver-${driver.id}`}
                      >
                        <Phone className="h-4 w-4" />
                        اتصال
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive flex-shrink-0 w-10 px-0"
                            data-testid={`button-delete-driver-${driver.id}`}
                            disabled={deleteDriverMutation.isPending}
                          >
                            {deleteDriverMutation.isPending ? (
                              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive"></span>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف السائق "{driver.name}"؟ 
                              لن يتمكن من الوصول للتطبيق بعد الحذف.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleteDriverMutation.isPending}>
                              إلغاء
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteDriverMutation.mutate(driver.id)}
                              className="bg-destructive hover:bg-destructive/90"
                              disabled={deleteDriverMutation.isPending}
                            >
                              {deleteDriverMutation.isPending ? 'جاري الحذف...' : 'حذف'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="col-span-full text-center py-12 border rounded-lg">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد سائقين</h3>
              <p className="text-muted-foreground mb-4">ابدأ بإضافة سائقين لخدمة التوصيل</p>
              <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-driver">
                إضافة السائق الأول
              </Button>
            </div>
          )}
        </div>

        {/* Account Management Dialog */}
        <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="sticky top-0 bg-background z-10 p-6 pb-4 border-b">
              <DialogTitle>
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  إدارة رصيد السائق: {selectedDriver?.name}
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto p-6">
              <Tabs defaultValue="balance" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="balance">الرصيد والعمولات</TabsTrigger>
                  <TabsTrigger value="transactions">سجل المعاملات</TabsTrigger>
                  <TabsTrigger value="commissions">عمولات الطلبات</TabsTrigger>
                </TabsList>
                
                {/* Balance Tab */}
                <TabsContent value="balance" className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          الرصيد الإجمالي
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                          {formatCurrency(driverBalance?.totalBalance || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">مجموع الأرباح</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          الرصيد المتاح
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(driverBalance?.availableBalance || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">قابل للسحب</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          المسحوب
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(driverBalance?.withdrawnAmount || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">إجمالي المسحوبات</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Add Manual Transaction */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">إضافة معاملة يدوية</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleTransactionSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="transactionType">نوع المعاملة</Label>
                            <Select
                              value={transactionData.type}
                              onValueChange={(value: any) => setTransactionData(prev => ({ ...prev, type: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="اختر نوع المعاملة" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="commission">عمولة</SelectItem>
                                <SelectItem value="salary">راتب</SelectItem>
                                <SelectItem value="bonus">مكافأة</SelectItem>
                                <SelectItem value="deduction">خصم</SelectItem>
                                <SelectItem value="withdrawal">سحب</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="amount">المبلغ (ريال)</Label>
                            <Input
                              id="amount"
                              type="text"
                              inputMode="decimal"
                              value={transactionData.amount}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d*\.?\d*$/.test(value)) {
                                  setTransactionData(prev => ({ ...prev, amount: value }));
                                }
                              }}
                              placeholder="أدخل المبلغ"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="description">الوصف</Label>
                            <Input
                              id="description"
                              value={transactionData.description}
                              onChange={(e) => setTransactionData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="وصف المعاملة"
                              required
                            />
                          </div>

                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={createTransactionMutation.isPending}
                          >
                            {createTransactionMutation.isPending ? 'جاري الإضافة...' : 'إضافة المعاملة'}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    {/* Add Commission for Order */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">إضافة عمولة طلب</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleCommissionSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="orderId">رقم الطلب</Label>
                            <Input
                              id="orderId"
                              value={commissionData.orderId}
                              onChange={(e) => setCommissionData(prev => ({ ...prev, orderId: e.target.value }))}
                              placeholder="رقم الطلب"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="orderAmount">مبلغ الطلب (ريال)</Label>
                            <Input
                              id="orderAmount"
                              type="text"
                              inputMode="decimal"
                              value={commissionData.orderAmount}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d*\.?\d*$/.test(value)) {
                                  setCommissionData(prev => ({ ...prev, orderAmount: value }));
                                }
                              }}
                              placeholder="مبلغ الطلب"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="commissionRate">نسبة العمولة (%)</Label>
                            <Input
                              id="commissionRate"
                              type="text"
                              inputMode="decimal"
                              value={commissionData.commissionRate || formatDecimalField(selectedDriver?.commissionRate) || '70.00'}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d*\.?\d*$/.test(value)) {
                                  setCommissionData(prev => ({ ...prev, commissionRate: value }));
                                }
                              }}
                              placeholder="نسبة العمولة"
                              required
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              قيمة العمولة: {((parseFloat(commissionData.orderAmount || '0') * parseFloat(commissionData.commissionRate || '0')) / 100).toFixed(2)} ريال
                            </p>
                          </div>

                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={createCommissionMutation.isPending}
                          >
                            {createCommissionMutation.isPending ? 'جاري الحساب...' : 'احتساب العمولة'}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">سحب الرصيد</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">الرصيد المتاح للسحب</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(driverBalance?.availableBalance || 0)}
                          </p>
                        </div>
                        <Button
                          onClick={handleWithdrawal}
                          disabled={!driverBalance || driverBalance.availableBalance <= 0 || processWithdrawalMutation.isPending}
                          className="gap-2"
                        >
                          {processWithdrawalMutation.isPending ? 'جاري السحب...' : 'سحب الرصيد'}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        سيتم خصم الرصيد المتاح بالكامل وإضافته إلى سجل المسحوبات
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Transactions Tab */}
                <TabsContent value="transactions" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>سجل المعاملات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>التاريخ</TableHead>
                              <TableHead>النوع</TableHead>
                              <TableHead>المبلغ</TableHead>
                              <TableHead>الوصف</TableHead>
                              <TableHead>الرصيد بعد</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {driverTransactions?.length ? (
                              driverTransactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                  <TableCell className="whitespace-nowrap">
                                    {formatDate(transaction.createdAt)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={
                                      transaction.type === 'commission' || transaction.type === 'salary' || transaction.type === 'bonus'
                                        ? 'default'
                                        : transaction.type === 'deduction' || transaction.type === 'withdrawal'
                                        ? 'destructive'
                                        : 'secondary'
                                    }>
                                      {getTransactionTypeLabel(transaction.type)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className={
                                    transaction.type === 'deduction' || transaction.type === 'withdrawal'
                                      ? 'text-red-600'
                                      : 'text-green-600'
                                  }>
                                    {transaction.type === 'deduction' || transaction.type === 'withdrawal' ? '-' : '+'}
                                    {formatCurrency(transaction.amount)}
                                  </TableCell>
                                  <TableCell className="max-w-[200px] truncate" title={transaction.description}>
                                    {transaction.description}
                                  </TableCell>
                                  <TableCell>{formatCurrency(transaction.balanceAfter)}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                  لا توجد معاملات
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Commissions Tab */}
                <TabsContent value="commissions" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>عمولات الطلبات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>رقم الطلب</TableHead>
                              <TableHead>مبلغ الطلب</TableHead>
                              <TableHead>نسبة العمولة</TableHead>
                              <TableHead>قيمة العمولة</TableHead>
                              <TableHead>التاريخ</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {driverCommissions?.length ? (
                              driverCommissions.map((commission) => (
                                <TableRow key={commission.id}>
                                  <TableCell className="font-medium">{commission.orderId}</TableCell>
                                  <TableCell>{formatCurrency(commission.orderAmount)}</TableCell>
                                  <TableCell>{commission.commissionRate}%</TableCell>
                                  <TableCell className="text-green-600 font-medium">
                                    {formatCurrency(commission.commissionAmount)}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {formatDate(commission.createdAt)}
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                  لا توجد عمولات
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            <DialogFooter className="sticky bottom-0 bg-background p-6 pt-4 border-t">
              <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
                <div className="text-sm text-muted-foreground">
                  <span>آخر تحديث: {new Date().toLocaleTimeString('ar-SA')}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAccountDialogOpen(false);
                      setSelectedDriver(null);
                    }}
                  >
                    إغلاق
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
