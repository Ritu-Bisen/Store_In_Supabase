import { type ColumnDef, type Row } from '@tanstack/react-table';
import DataTable from '../element/DataTable';
import { useEffect, useState } from 'react';
import { useSheets } from '@/context/SheetsContext';
import { DownloadOutlined } from "@ant-design/icons";

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
import { ClipboardCheck, PenSquare } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import Heading from '../element/Heading';
import { Pill } from '../ui/pill';
import { Input } from '../ui/input';
import supabase from '@/SupabaseClient';

const statuses = ['Pending', 'Reject', 'New Vendor', 'Regular'];

interface ApproveTableData {
    indentNo: string;
    indenter: string;
    department: string;
    product: string;
    quantity: number;
    uom: string;
    vendorType: 'Pending' | 'Reject' | 'New Vendor' | 'Regular';
    date: string;
    attachment: string;
    specifications: string;
    indentStatus: string;
    noDay: number;
    planned1: string;
    firmNameMatch: string;
}

interface HistoryData {
    indentNo: string;
    indenter: string;
    department: string;
    product: string;
    uom: string;
    approvedQuantity: number;
    vendorType: 'Reject' | 'New Vendor' | 'Regular';
    date: string;
    approvedDate: string;
    specifications: string;
    lastUpdated?: string;
    indentStatus: string;
    noDay: number;
    planned1: string;
    actual1: string;
    firmNameMatch: string;
}

export default () => {
    const { indentSheet, indentLoading, updateIndentSheet } = useSheets();
    const { user } = useAuth();

    console.log("user.firmNameMatch:", user?.firm_name_match);
    console.log("indentSheet data:", indentSheet);

    const [selectedIndent, setSelectedIndent] = useState<ApproveTableData | null>(null);
    const [tableData, setTableData] = useState<ApproveTableData[]>([]);
    const [historyData, setHistoryData] = useState<HistoryData[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingRow, setEditingRow] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<HistoryData>>({});
    const [loading, setLoading] = useState(false);

    // Debug: Log the raw indentSheet data
    useEffect(() => {
        console.log("Raw indentSheet:", indentSheet);
        console.log("User firm_name_match:", user?.firm_name_match);
    }, [indentSheet, user]);

    // Fetching pending table data
    useEffect(() => {
        if (!indentSheet.length) return;

        // Filter by firm name first
        const filteredByFirm = indentSheet.filter(sheet => {
            const userFirm = user?.firm_name_match?.toLowerCase();
            const sheetFirm = sheet.firm_name?.toLowerCase();
            
            if (userFirm === "all") return true;
            return sheetFirm === userFirm;
        });

        console.log("Filtered by firm:", filteredByFirm);

        const pendingData = filteredByFirm
            .filter((sheet) => {
                // Pending = no actual date OR vendor_type is Pending or empty
                const hasNoActualDate = !sheet.actual1 || sheet.actual1 === '';
                const isPendingVendor = !sheet.vendor_type || sheet.vendor_type === '' || sheet.vendor_type === 'Pending';
                
                return hasNoActualDate && isPendingVendor;
            })
            .map((sheet) => ({
                indentNo: sheet.indent_number || '',
                firmNameMatch: sheet.firm_name || '',
                indenter: sheet.indenter_name || '',
                department: sheet.department || '',
                product: sheet.product_name || '',
                quantity: sheet.quantity || 0,
                uom: sheet.uom || '',
                attachment: sheet.attachment || '',
                specifications: sheet.specifications || '',
                vendorType: (sheet.vendor_type as ApproveTableData['vendorType']) || 'Pending',
                date: sheet.timestamp ? formatDate(new Date(sheet.timestamp)) : '',
                indentStatus: sheet.indent_status || '',
                noDay: sheet.no_day || 0,
                planned1: sheet.planned1 || '',
            }));

        console.log("Pending table data:", pendingData);
        setTableData(pendingData);
    }, [indentSheet, user?.firm_name_match]);

    // History data
    useEffect(() => {
        if (!indentSheet.length) return;

        const filteredByFirm = indentSheet.filter(sheet => {
            const userFirm = user?.firm_name_match?.toLowerCase();
            const sheetFirm = sheet.firm_name?.toLowerCase();
            
            if (userFirm === "all") return true;
            return sheetFirm === userFirm;
        });

        const historyData = filteredByFirm
            .filter((sheet) => {
                // History = has actual date OR vendor_type is set (not Pending)
                const hasActualDate = sheet.actual1 && sheet.actual1 !== '';
                const hasVendorType = sheet.vendor_type && sheet.vendor_type !== '' && sheet.vendor_type !== 'Pending';
                
                return hasActualDate || hasVendorType;
            })
            .map((sheet) => ({
                indentNo: sheet.indent_number || '',
                firmNameMatch: sheet.firm_name || '',
                indenter: sheet.indenter_name || '',
                department: sheet.department || '',
                product: sheet.product_name || '',
                approvedQuantity: sheet.approved_quantity || sheet.quantity || 0,
                vendorType: (sheet.vendor_type as HistoryData['vendorType']) || 'Regular',
                uom: sheet.uom || '',
                specifications: sheet.specifications || '',
                date: sheet.timestamp ? formatDate(new Date(sheet.timestamp)) : '',
                approvedDate: sheet.actual1 ? formatDate(new Date(sheet.actual1)) : 
                            //  sheet.lastUpdated ? formatDate(new Date(sheet.lastUpdated)) : 
                             formatDate(new Date()),
                indentStatus: sheet.indent_status || '',
                noDay: sheet.no_day || 0,
                planned1: sheet.planned1 || '',
                actual1: sheet.actual1 || '',
            }));

        // Safe sorting for history data - newest first
        const sortedHistoryData = historyData.sort((a, b) => {
            const aDate = a.approvedDate || a.date;
            const bDate = b.approvedDate || b.date;
            return new Date(bDate).getTime() - new Date(aDate).getTime();
        });

        console.log("History data:", sortedHistoryData);
        setHistoryData(sortedHistoryData);
    }, [indentSheet, user?.firm_name_match]);

    const handleDownload = (data: any[]) => {
        if (!data || data.length === 0) {
            toast.error("No data to download");
            return;
        }

        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(","),
            ...data.map(row =>
                headers.map(h => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
            )
        ];

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `pending-indents-${Date.now()}.csv`);
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

    const handleEditClick = (row: HistoryData) => {
        setEditingRow(row.indentNo);
        setEditValues({
            approvedQuantity: row.approvedQuantity,
            uom: row.uom,
            vendorType: row.vendorType,
        });
    };

    const handleCancelEdit = () => {
        setEditingRow(null);
        setEditValues({});
    };

    const handleSaveEdit = async (indentNo: string) => {
        try {
            const { data, error } = await supabase
                .from('indent')
                .update({
                    approved_quantity: editValues.approvedQuantity,
                    uom: editValues.uom,
                    vendor_type: editValues.vendorType,
                    lastUpdated: new Date().toLocaleString("en-CA", { 
                        timeZone: "Asia/Kolkata", 
                        hour12: false 
                    }).replace(',', '')
                })
                .eq('indent_number', indentNo);

            if (error) throw error;

            toast.success(`Updated indent ${indentNo}`);
            updateIndentSheet();
            setEditingRow(null);
            setEditValues({});
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to update indent');
        }
    };

    const handleInputChange = (field: keyof HistoryData, value: any) => {
        setEditValues(prev => ({ ...prev, [field]: value }));
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
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedIndent(indent);
                                        setOpenDialog(true);
                                    }}
                                >
                                    Approve
                                </Button>
                            </DialogTrigger>
                        </Dialog>
                    );
                },
            },
        ]
        : []),
        { accessorKey: 'indentNo', header: 'Indent No.' },
        { accessorKey: 'firmNameMatch', header: 'Firm Name' },
        { accessorKey: 'indenter', header: 'Indenter' },
        { accessorKey: 'department', header: 'Department' },
        {
            accessorKey: 'product',
            header: 'Product',
            cell: ({ getValue }) => (
                <div className="max-w-[150px] break-words whitespace-normal">
                    {getValue() as string}
                </div>
            ),
        },
        { accessorKey: 'quantity', header: 'Quantity' },
        { accessorKey: 'uom', header: 'UOM' },
        {
            accessorKey: 'specifications',
            header: 'Specifications',
            cell: ({ row, getValue }) => {
                const [value, setValue] = useState(getValue() as string);
                const [isEditing, setIsEditing] = useState(false);
                const indentNo = row.original.indentNo;

                const handleBlur = async () => {
                    setIsEditing(false);
                    try {
                        const { error } = await supabase
                            .from('indent')
                            .update({ 
                                specifications: value,
                                lastUpdated: new Date().toLocaleString("en-CA", { 
                                    timeZone: "Asia/Kolkata", 
                                    hour12: false 
                                }).replace(',', '')
                            })
                            .eq('indent_number', indentNo);

                        if (error) throw error;
                        
                        toast.success(`Updated specifications for ${indentNo}`);
                        updateIndentSheet();
                    } catch (error) {
                        console.error('Update specifications error:', error);
                        toast.error('Failed to update specifications');
                    }
                };

                const handleFocus = () => {
                    setIsEditing(true);
                };

                return (
                    <div className="max-w-[150px]">
                        {isEditing ? (
                            <Input
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onBlur={handleBlur}
                                autoFocus
                                className="border-1 focus:border-2"
                            />
                        ) : (
                            <div 
                                className="break-words whitespace-normal cursor-pointer p-2 hover:bg-gray-50 rounded"
                                onClick={handleFocus}
                                onFocus={handleFocus}
                                tabIndex={0}
                            >
                                {value || 'Click to edit...'}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'vendorType',
            header: 'Vendor Type',
            cell: ({ row }: { row: Row<ApproveTableData> }) => {
                const status = row.original.vendorType;
                return (
                    <Pill
                        variant={
                            status === 'Reject'
                                ? 'reject'
                                : status === 'Regular'
                                    ? 'primary'
                                    : 'secondary'
                        }
                    >
                        {status}
                    </Pill>
                );
            },
        },
        {
            accessorKey: 'indentStatus',
            header: 'Priority',
            cell: ({ row }: { row: Row<ApproveTableData> }) => {
                const status = row.original.indentStatus;
                return (
                    <Pill variant={status === 'Critical' ? 'reject' : 'secondary'}>
                        {status}
                    </Pill>
                );
            },
        },
        {
            accessorKey: 'noDay',
            header: 'Days',
            cell: ({ getValue }) => (
                <div className="text-center">
                    {getValue() as number}
                </div>
            ),
        },
        {
            accessorKey: 'attachment',
            header: 'Attachment',
            cell: ({ row }: { row: Row<ApproveTableData> }) => {
                const attachment = row.original.attachment;
                return attachment ? (
                    <a href={attachment} target="_blank" rel="noopener noreferrer">
                        Attachment
                    </a>
                ) : (
                    <span>-</span>
                );
            },
        },
        { accessorKey: 'date', header: 'Date' },
        {
            accessorKey: 'planned1',
            header: 'Planned Date',
            cell: ({ row }) =>
                row.original.planned1
                    ? formatDateTime(row.original.planned1)
                    : '-',
        }
    ];

    const historyColumns: ColumnDef<HistoryData>[] = [
        { accessorKey: 'indentNo', header: 'Indent No.' },
        { accessorKey: 'firmNameMatch', header: 'Firm Name' },
        { accessorKey: 'indenter', header: 'Indenter' },
        { accessorKey: 'department', header: 'Department' },
        {
            accessorKey: 'product',
            header: 'Product',
            cell: ({ getValue }) => (
                <div className="max-w-[150px] break-words whitespace-normal">
                    {getValue() as string}
                </div>
            ),
        },
        {
            accessorKey: 'approvedQuantity',
            header: 'Quantity',
            cell: ({ row }) => {
                const isEditing = editingRow === row.original.indentNo;
                return isEditing ? (
                    <Input
                        type="number"
                        value={editValues.approvedQuantity ?? row.original.approvedQuantity}
                        onChange={(e) => handleInputChange('approvedQuantity', Number(e.target.value))}
                        className="w-20"
                    />
                ) : (
                    <div className="flex items-center gap-2">
                        {row.original.approvedQuantity}
                        {user?.indent_approval_action && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4"
                                onClick={() => handleEditClick(row.original)}
                            >
                                <PenSquare className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'uom',
            header: 'UOM',
            cell: ({ row }) => {
                const isEditing = editingRow === row.original.indentNo;
                return isEditing ? (
                    <Input
                        value={editValues.uom ?? row.original.uom}
                        onChange={(e) => handleInputChange('uom', e.target.value)}
                        className="w-20"
                    />
                ) : (
                    <div className="flex items-center gap-2">
                        {row.original.uom}
                        {user?.indent_approval_action && editingRow !== row.original.indentNo && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4"
                                onClick={() => handleEditClick(row.original)}
                            >
                                <PenSquare className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'specifications',
            header: 'Specifications',
            cell: ({ getValue }) => (
                <div className="max-w-[150px] break-words whitespace-normal">
                    {getValue() as string}
                </div>
            ),
        },
        {
            accessorKey: 'vendorType',
            header: 'Vendor Type',
            cell: ({ row }) => {
                const isEditing = editingRow === row.original.indentNo;
                return isEditing ? (
                    <Select
                        value={editValues.vendorType ?? row.original.vendorType}
                        onValueChange={(value) => handleInputChange('vendorType', value)}
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Regular">Regular</SelectItem>
                            <SelectItem value="New Vendor">New Vendor</SelectItem>
                            <SelectItem value="Reject">Reject</SelectItem>
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="flex items-center gap-2">
                        <Pill
                            variant={
                                row.original.vendorType === 'Reject'
                                    ? 'reject'
                                    : row.original.vendorType === 'Regular'
                                        ? 'primary'
                                        : 'secondary'
                            }
                        >
                            {row.original.vendorType}
                        </Pill>
                        {user?.indent_approval_action && editingRow !== row.original.indentNo && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4"
                                onClick={() => handleEditClick(row.original)}
                            >
                                <PenSquare className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'indentStatus',
            header: 'Priority',
            cell: ({ row }: { row: Row<HistoryData> }) => {
                const status = row.original.indentStatus;
                return (
                    <Pill variant={status === 'Critical' ? 'reject' : 'secondary'}>
                        {status}
                    </Pill>
                );
            },
        },
        {
            accessorKey: 'noDay',
            header: 'Days',
            cell: ({ getValue }) => (
                <div className="text-center">
                    {getValue() as number}
                </div>
            ),
        },
        { accessorKey: 'date', header: 'Request Date' },
        { accessorKey: 'approvedDate', header: 'Approval Date' },
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
        ...(user?.indent_approval_action
            ? [
                {
                    id: 'editActions',
                    cell: ({ row }: { row: Row<HistoryData> }) => {
                        const isEditing = editingRow === row.original.indentNo;
                        return isEditing ? (
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => handleSaveEdit(row.original.indentNo)}
                                >
                                    Save
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                >
                                    Cancel
                                </Button>
                            </div>
                        ) : null;
                    },
                },
            ]
            : []),
    ];

    // Creating Form
    const schema = z
        .object({
            approval: z.enum(['Reject', 'Three Party', 'Regular']),
            approvedQuantity: z.coerce.number().optional(),
        })
        .superRefine((data, ctx) => {
            if (data.approval !== 'Reject') {
                if (!data.approvedQuantity || data.approvedQuantity === 0) {
                    ctx.addIssue({
                        path: ['approvedQuantity'],
                        code: z.ZodIssueCode.custom,
                    });
                }
            }
        });

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: { approvedQuantity: undefined, approval: undefined },
    });

    const approval = form.watch('approval');

    useEffect(() => {
        if (selectedIndent) {
            form.setValue("approvedQuantity", selectedIndent.quantity)
        }
    }, [selectedIndent]);

    async function onSubmit(values: z.infer<typeof schema>) {
    if (!selectedIndent) return;

    try {
        // Generate IST Timestamp
        let current = new Date();
        let istDate = new Date(current.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

        // Check if Sunday → Add +1 day
        if (istDate.getDay() === 0) {  
            istDate.setDate(istDate.getDate() + 1);
        }

        // Convert to YYYY-MM-DD HH:mm:ss
        const planned2Date = istDate
            .toLocaleString("en-CA", { hour12: false })
            .replace(',', '');

        // Always update these
        const updatePayload: any = {
            vendor_type: values.approval,
            approved_quantity: values.approvedQuantity,
            actual1: planned2Date
        };

        // ONLY set planned2 if NOT rejected
        if (values.approval !== "Reject") {
            updatePayload.planned2 = planned2Date;
        }

        // Update in Supabase
        const { data, error } = await supabase
            .from('indent')
            .update(updatePayload)
            .eq('indent_number', selectedIndent.indentNo);

        if (error) {
            console.error('Supabase update error:', error);
            throw error;
        }

        toast.success(`Updated approval status of ${selectedIndent.indentNo}`);
        setOpenDialog(false);
        form.reset();

        // Refresh sheet
        setTimeout(() => updateIndentSheet(), 1000);

    } catch (error) {
        console.error('Failed to approve indent:', error);
        toast.error('Failed to approve indent');
    }
}


    function onError(e: FieldErrors<z.infer<typeof schema>>) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    const formatDateTime = (isoString?: string) => {
        if (!isoString) return '-';
        try {
            const date = new Date(isoString);
            const day = date.getDate().toString().padStart(2, "0");
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, "0");
            const minutes = date.getMinutes().toString().padStart(2, "0");
            const seconds = date.getSeconds().toString().padStart(2, "0");
            return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        } catch {
            return isoString;
        }
    };

    return (
        <div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <Tabs defaultValue="pending">
                    <Heading
                        heading="Approve Indent"
                        subtext="Update Indent status to Approve or Reject them"
                        tabs
                    >
                        <ClipboardCheck size={50} className="text-primary" />
                    </Heading>
                    
                    {/* <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pending">Pending Indents ({tableData.length})</TabsTrigger>
                        <TabsTrigger value="history">History ({historyData.length})</TabsTrigger>
                    </TabsList> */}

                    <TabsContent value="pending">
                        <DataTable
                            data={tableData}
                            columns={columns}
                            searchFields={['product', 'department', 'indenter', 'vendorType','firmNameMatch']}
                            dataLoading={indentLoading}
                            extraActions={
                                <Button
                                    variant="default"
                                    onClick={onDownloadClick}
                                    style={{
                                        background: "linear-gradient(90deg, #4CAF50, #2E7D32)",
                                        border: "none",
                                        borderRadius: "8px",
                                        padding: "0 16px",
                                        fontWeight: "bold",
                                        boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <DownloadOutlined />
                                    {loading ? "Downloading..." : "Download"}
                                </Button>
                            }
                        />
                    </TabsContent>
                    <TabsContent value="history">
                        <DataTable
                            data={historyData}
                            columns={historyColumns}
                            searchFields={['product', 'department', 'indenter', 'vendorType']}
                            dataLoading={indentLoading}
                        />
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
                                            {selectedIndent.indentNo}
                                        </span>
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-3">
                                    <FormField
                                        control={form.control}
                                        name="approval"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Vendor Type</FormLabel>
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
                                                        <SelectItem value="Regular">
                                                            Regular
                                                        </SelectItem>
                                                        <SelectItem value="Three Party">
                                                            Three Party
                                                        </SelectItem>
                                                        <SelectItem value="Reject">
                                                            Reject
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="approvedQuantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Quantity</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={approval === 'Reject'}
                                                        type="number"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
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