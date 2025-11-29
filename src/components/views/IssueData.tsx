import { type ColumnDef, type Row } from '@tanstack/react-table';
import DataTable from '../element/DataTable';
import { useEffect, useState } from 'react';
import { useSheets } from '@/context/SheetsContext';
import { DownloadOutlined } from '@ant-design/icons';
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { Dialog } from '@radix-ui/react-dialog';
import { z } from 'zod';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { PuffLoader as Loader } from 'react-spinners';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Heading from '../element/Heading';
import { Input } from '../ui/input';
import supabase from '@/SupabaseClient';

const statuses = ['Pending', 'Reject', 'New Vendor', 'Regular'];

interface ApproveTableData {
    issueNo: string;
    issueTo: string;
    uom: string;
    productName: string;
    quantity: number;
    department: string;
    groupHead: string;
    planned1?: string;
}

interface HistoryData {
    issueNo: string;
    issueTo: string;
    uom: string;
    productName: string;
    quantity: number;
    department: string;
    status: string;
    givenQty: number;
    groupHead: string;
    planned1?: string;
    actual1?: string;
}

export default () => {
    const { issueSheet, issueLoading, updateIssueSheet } = useSheets();
    const { user } = useAuth();

    const [selectedIndent, setSelectedIndent] = useState<ApproveTableData | null>(null);
    const [tableData, setTableData] = useState<ApproveTableData[]>([]);
    const [historyData, setHistoryData] = useState<HistoryData[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [loading, setLoading] = useState(false);

    // Debug: Log the raw issueSheet data
    useEffect(() => {
        window.console.log('🔄 Raw issueSheet data:', issueSheet);
        window.console.log('🔢 Total records from Supabase:', issueSheet.length);
    }, [issueSheet]);

    useEffect(() => {
        const pendingData = issueSheet
            .filter((sheet) => sheet.planned1 && sheet.planned1 !== '' && (!sheet.actual1 || sheet.actual1 === ''))
            .map((sheet) => ({
                issueNo: sheet.issue_no,
                issueTo: sheet.issue_to,
                uom: sheet.uom,
                productName: sheet.product_name,
                quantity: sheet.quantity,
                department: sheet.department,
                groupHead: sheet.group_head,
                planned1: sheet.planned1,
            }));
        
        window.console.log('✅ Filtered pending data:', pendingData);
        setTableData(pendingData);
    }, [issueSheet]);

    useEffect(() => {
        const history = issueSheet
            .filter((sheet) => sheet.planned1 && sheet.planned1 !== '' && sheet.actual1 && sheet.actual1 !== '')
            .map((sheet) => ({
                issueNo: sheet.issue_no,
                issueTo: sheet.issue_to,
                uom: sheet.uom,
                productName: sheet.product_name,
                quantity: sheet.quantity,
                department: sheet.department,
                status: sheet.status || '',
                givenQty: sheet.given_qty || 0,
                groupHead: sheet.group_head,
                planned1: sheet.planned1,
                actual1: sheet.actual1,
            }));
        
        window.console.log('📚 Filtered history data:', history);
        setHistoryData(history);
    }, [issueSheet]);

    const handleDownload = (data: any[]) => {
        if (!data || data.length === 0) {
            toast.error('No data to download');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map((row) =>
                headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
            ),
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `pending-indents-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const onDownloadClick = async () => {
        setLoading(true);
        try {
            await handleDownload(tableData);
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (isoString: string) => {
        if (!isoString) return '-';
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return '-';
            
            const day = date.getDate().toString().padStart(2, "0");
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, "0");
            const minutes = date.getMinutes().toString().padStart(2, "0");
            const seconds = date.getSeconds().toString().padStart(2, "0");

            return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        } catch {
            return '-';
        }
    };

    // Creating table columns
    const columns: ColumnDef<ApproveTableData>[] = [
        ...(user?.indent_approval_action
            ? [
                {
                    header: 'Action',
                    id: 'action',
                    cell: ({ row }: { row: Row<ApproveTableData> }) => {
                        const indent = row.original;
                        return (
                            <div>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedIndent(indent);
                                        }}
                                    >
                                        Approve
                                    </Button>
                                </DialogTrigger>
                            </div>
                        );
                    },
                },
            ]
            : []),
        { accessorKey: 'issueNo', header: 'Issue No' },
        { accessorKey: 'issueTo', header: 'Issue to' },
        { accessorKey: 'groupHead', header: 'Group Head' },
        { accessorKey: 'uom', header: 'Uom' },
        { accessorKey: 'productName', header: 'Product Name' },
        { accessorKey: 'quantity', header: 'Quantity' },
        { accessorKey: 'department', header: 'Department' },
        {
            accessorKey: 'planned1',
            header: 'Planned Date',
            cell: ({ row }) =>
                row.original.planned1
                    ? formatDateTime(row.original.planned1)
                    : '-',
        },
    ];

    const historyColumns: ColumnDef<HistoryData>[] = [
        { accessorKey: 'issueNo', header: 'Issue No' },
        { accessorKey: 'issueTo', header: 'Issue to' },
        { accessorKey: 'groupHead', header: 'Group Head' },
        { accessorKey: 'uom', header: 'Uom' },
        { accessorKey: 'productName', header: 'Product Name' },
        { accessorKey: 'quantity', header: 'Quantity' },
        { accessorKey: 'department', header: 'Department' },
        { accessorKey: 'status', header: 'Status' },
        { accessorKey: 'givenQty', header: 'Given Qty' },
        {
            accessorKey: 'planned1',
            header: 'Planned Date',
            cell: ({ row }) =>
                row.original.planned1
                    ? formatDateTime(row.original.planned1)
                    : '-',
        },
        {
            accessorKey: 'actual1',
            header: 'Actual Date',
            cell: ({ row }) =>
                row.original.actual1
                    ? formatDateTime(row.original.actual1)
                    : '-',
        },
    ];

    // Creating Form
    const schema = z
        .object({
            status: z.string(),
            givenQty: z.number().optional(),
        })
        .superRefine((data, ctx) => {
            if (data.status === 'Yes' && (!data.givenQty || data.givenQty === 0)) {
                ctx.addIssue({
                    path: ['givenQty'],
                    code: z.ZodIssueCode.custom,
                    message: 'Given quantity is required when status is Yes',
                });
            }
        });

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: { givenQty: undefined, status: undefined },
    });

    async function onSubmit(values: z.infer<typeof schema>) {
        if (!selectedIndent) return;
        
        try {
            // Update Supabase directly
            const { error } = await supabase
                .from('issue')
                .update({
                    actual1:new Date().toLocaleString("en-CA", { 
      timeZone: "Asia/Kolkata", 
      hour12: false 
    }).replace(',', ''),
                    status: values.status,
                    given_qty: values.status === 'Yes' ? values.givenQty : 0,
                })
                .eq('issue_no', selectedIndent.issueNo);

            if (error) throw error;

            toast.success(`Updated approval status of ${selectedIndent.issueNo}`);
            setOpenDialog(false);
            form.reset();
            
            // Refresh the data from Supabase
            setTimeout(() => updateIssueSheet(), 1000);
        } catch (error) {
            window.console.error('Failed to approve indent:', error);
            toast.error('Failed to approve indent');
        }
    }

    function onError(e: FieldErrors<z.infer<typeof schema>>) {
        toast.error('Please fill all required fields');
    }

    return (
        <div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <Tabs defaultValue="pending">
                    <Heading heading="Issue Data" subtext="Update Issue Data" tabs>
                        <ClipboardCheck size={50} className="text-primary" />
                    </Heading>
                    
                    {/* Add TabsList for navigation
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pending">
                            Pending Issues ({tableData.length})
                        </TabsTrigger>
                        <TabsTrigger value="history">
                            Issue History ({historyData.length})
                        </TabsTrigger>
                    </TabsList> */}

                  <TabsContent value="pending">
  {issueLoading ? (
    <div className="flex justify-center items-center p-8">
      <Loader size={30} color="#3B82F6" />
      <span className="ml-2">Loading issue data from Supabase...</span>
    </div>
  ) : (
    <div> {/* Add this wrapper div */}
      <DataTable
        data={tableData}
        columns={columns}
        searchFields={['productName', 'department', 'issueNo', 'issueTo']}
        dataLoading={issueLoading}
        extraActions={
          <Button
            variant="default"
            onClick={onDownloadClick}
            disabled={tableData.length === 0 || loading}
            style={{
              background: 'linear-gradient(90deg, #4CAF50, #2E7D32)',
              border: 'none',
              borderRadius: '8px',
              padding: '0 16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <DownloadOutlined />
            {loading ? 'Downloading...' : 'Download CSV'}
          </Button>
        }
      />
    </div>
  )}
</TabsContent>
                    
                    <TabsContent value="history">
                        {issueLoading ? (
                            <div className="flex justify-center items-center p-8">
                                <Loader size={30} color="#3B82F6" />
                                <span className="ml-2">Loading issue data from Supabase...</span>
                            </div>
                        ) : (
                            <DataTable
                                data={historyData}
                                columns={historyColumns}
                                searchFields={['productName', 'department', 'issueNo', 'issueTo']}
                                dataLoading={issueLoading}
                            />
                        )}
                    </TabsContent>
                </Tabs>

                {selectedIndent && (
                    <DialogContent>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit, onError)}
                                className="grid gap-5"
                            >
                                <DialogHeader className="grid gap-2">
                                    <DialogTitle>Approve Indent</DialogTitle>
                                    <DialogDescription>
                                        Approve indent{' '}
                                        <span className="font-medium">
                                            {selectedIndent.issueNo}
                                        </span>
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-3">
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select approval status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Yes">Yes</SelectItem>
                                                        <SelectItem value="No">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />

                                    {form.watch('status') === 'Yes' && (
                                        <FormField
                                            control={form.control}
                                            name="givenQty"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Given Quantity</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    Number(e.target.value)
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Close</Button>
                                    </DialogClose>

                                    <Button type="submit" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting && (
                                            <Loader
                                                size={20}
                                                color="white"
                                                aria-label="Loading Spinner"
                                            />
                                        )}
                                        Approve
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
};