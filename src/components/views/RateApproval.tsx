import type { ColumnDef, Row } from '@tanstack/react-table';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import { useEffect, useState } from 'react';
import { useSheets } from '@/context/SheetsContext';
import DataTable from '../element/DataTable';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { PuffLoader as Loader } from 'react-spinners';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '@/context/AuthContext';
import Heading from '../element/Heading';
import { formatDate } from '@/lib/utils';
import { Input } from '../ui/input';
import supabase from '@/SupabaseClient';

interface RateApprovalData {
    indentNo: string;
    indenter: string;
    department: string;
    product: string;
    comparisonSheet: string;
    vendors: string[][];
    date: string;
    firmNameMatch?: string;
}

interface HistoryData {
    indentNo: string;
    indenter: string;
    department: string;
    product: string;
    vendor: string[];
    date: string;
    firmNameMatch?: string;
}

export default () => {
    const { indentLoading, indentSheet, updateIndentSheet } = useSheets();
    const { user } = useAuth();

    const [selectedIndent, setSelectedIndent] = useState<RateApprovalData | null>(null);
    const [selectedHistory, setSelectedHistory] = useState<HistoryData | null>(null);
    const [tableData, setTableData] = useState<RateApprovalData[]>([]);
    const [historyData, setHistoryData] = useState<HistoryData[]>([]);
    const [openDialog, setOpenDialog] = useState(false);

    // Debug: Check what data we have
    useEffect(() => {
        console.log("=== THREE PARTY APPROVAL DEBUG ===");
        console.log("Raw indentSheet length:", indentSheet.length);
        console.log("User firm_name_match:", user?.firm_name_match);
        
        const filteredByFirm = indentSheet.filter(sheet => 
            user?.firm_name_match?.toLowerCase() === "all" || sheet.firm_name === user?.firm_name_match
        );
        
        console.log("After firm filtering:", filteredByFirm.length);
        
        const pendingData = filteredByFirm.filter(
            (sheet) =>
                sheet.planned3 !== '' &&
                sheet.actual3 === '' &&
                sheet.vendor_type === 'Three Party'
        );
        
        console.log("Pending three party data:", pendingData.length);
        console.log("Sample pending item:", pendingData[0]);
    }, [indentSheet, user]);

    useEffect(() => {
        if (!indentSheet.length) return;

        const filteredByFirm = indentSheet.filter(sheet => 
            user?.firm_name_match?.toLowerCase() === "all" || sheet.firm_name === user?.firm_name_match
        );

        console.log("Processing pending three party data...");
        
        const data = filteredByFirm
            .filter(
                (sheet) => {
                    const hasPlanned3 = sheet.planned3 && sheet.planned3 !== '';
                    const hasNoActual3 = !sheet.actual3 || sheet.actual3 === '';
                    const isThreeParty = sheet.vendor_type === 'Three Party';
                    
                    console.log(`Indent ${sheet.indent_number}: planned3="${sheet.planned3}", actual3="${sheet.actual3}", vendor_type="${sheet.vendor_type}"`);
                    
                    return hasPlanned3 && hasNoActual3 && isThreeParty;
                }
            )
            .map((sheet) => {
                console.log(`Mapping indent ${sheet.indent_number}:`, {
                    vendor_name1: sheet.vendor_name1,
                    vendor_name2: sheet.vendor_name2,
                    vendor_name3: sheet.vendor_name3,
                    rate1: sheet.rate1,
                    rate2: sheet.rate2,
                    rate3: sheet.rate3
                });

                return {
                    indentNo: sheet.indent_number || '',
                    firmNameMatch: sheet.firm_name || '',
                    indenter: sheet.indenter_name || '',
                    department: sheet.department || '',
                    product: sheet.product_name || '',
                    comparisonSheet: sheet.comparison_sheet || '',
                    date: sheet.timestamp ? formatDate(new Date(sheet.timestamp)) : '',
                    vendors: [
                        [
                            sheet.vendor_name1 || '', 
                            sheet.rate1?.toString() || '0', 
                            sheet.payment_term1 || '',
                            sheet.select_rate_type1 || 'With Tax',
                            sheet.with_tax_or_not1 || 'Yes',
                            sheet.tax_value1?.toString() || '0'
                        ],
                        [
                            sheet.vendor_name2 || '', 
                            sheet.rate2?.toString() || '0', 
                            sheet.payment_term2 || '',
                            sheet.select_rate_type2 || 'With Tax',
                            sheet.with_tax_or_not2 || 'Yes',
                            sheet.tax_value2?.toString() || '0'
                        ],
                        [
                            sheet.vendor_name3 || '', 
                            sheet.rate3?.toString() || '0', 
                            sheet.payment_term3 || '',
                            sheet.select_rate_type3 || 'With Tax',
                            sheet.with_tax_or_not3 || 'Yes',
                            sheet.tax_value3?.toString() || '0'
                        ],
                    ],
                };
            });
        
        console.log("Final pending table data:", data);
        setTableData(data);
    }, [indentSheet, user?.firm_name_match]);

    useEffect(() => {
        if (!indentSheet.length) return;

        const filteredByFirm = indentSheet.filter(sheet => 
            user?.firm_name_match?.toLowerCase() === "all" || sheet.firm_name === user?.firm_name_match
        );
        
        const data = filteredByFirm
            .filter(
                (sheet) => {
                    const hasPlanned3 = sheet.planned3 && sheet.planned3 !== '';
                    const hasActual3 = sheet.actual3 && sheet.actual3 !== '';
                    const isThreeParty = sheet.vendor_type === 'Three Party';
                    
                    return hasPlanned3 && hasActual3 && isThreeParty;
                }
            )
            .map((sheet) => ({
                indentNo: sheet.indent_number || '',
                firmNameMatch: sheet.firm_name || '',
                indenter: sheet.indenter_name || '',
                department: sheet.department || '',
                product: sheet.product_name || '',
                date: sheet.actual3 ? formatDate(new Date(sheet.actual3)) : '',
                vendor: [
                    sheet.approved_vendor_name || '', 
                    sheet.approved_rate?.toString() || '0'
                ],
            }));
        
        console.log("Final history data:", data);
        setHistoryData(data);
    }, [indentSheet, user?.firm_name_match]);

    const columns: ColumnDef<RateApprovalData>[] = [
        ...(user?.three_party_approval_action
            ? [
                {
                    header: 'Action',
                    id: 'action',
                    cell: ({ row }: { row: Row<RateApprovalData> }) => {
                        const indent = row.original;

                        return (
                            <div>
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
                            </div>
                        );
                    },
                },
            ]
            : []),
        { accessorKey: 'indentNo', header: 'Indent No.' },
        { accessorKey: 'firmNameMatch', header: 'Firm Name' },
        { accessorKey: 'indenter', header: 'Indenter' },
        { accessorKey: 'department', header: 'Department' },
        { accessorKey: 'product', header: 'Product' },
        { accessorKey: 'date', header: 'Date' },
        {
            accessorKey: 'vendors',
            header: 'Vendors',
            cell: ({ row }) => {
                const vendors = row.original.vendors;
                return (
                    <div className="grid place-items-center">
                        <div className="flex flex-col gap-1">
                            {vendors.map((vendor, index) => (
                                vendor[0] && (
                                    <span key={index} className="rounded-full text-xs px-3 py-1 bg-accent text-accent-foreground border border-accent-foreground">
                                        {vendor[0]} - &#8377;{vendor[1]}
                                    </span>
                                )
                            ))}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'comparisonSheet',
            header: 'Comparison Sheet',
            cell: ({ row }) => {
                const sheet = row.original.comparisonSheet;
                return sheet ? (
                    <a href={sheet} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Sheet
                    </a>
                ) : (
                    <span className="text-muted-foreground">No sheet</span>
                );
            },
        },
    ];

    const historyColumns: ColumnDef<HistoryData>[] = [
        ...(user?.update_vendor_action ? [
            {
                header: 'Action',
                cell: ({ row }: { row: Row<HistoryData> }) => {
                    const indent = row.original;

                    return (
                        <div>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedHistory(indent);
                                        setOpenDialog(true);
                                    }}
                                >
                                    Update
                                </Button>
                            </DialogTrigger>
                        </div>
                    );
                },
            },
        ] : []),
        { accessorKey: 'indentNo', header: 'Indent No.' },
        { accessorKey: 'firmNameMatch', header: 'Firm Name' },
        { accessorKey: 'indenter', header: 'Indenter' },
        { accessorKey: 'department', header: 'Department' },
        { accessorKey: 'product', header: 'Product' },
        { accessorKey: 'date', header: 'Date' },
        {
            accessorKey: 'vendor',
            header: 'Vendor',
            cell: ({ row }) => {
                const vendor = row.original.vendor;
                return (
                    <div className="grid place-items-center">
                        <div className="flex flex-col gap-1">
                            {vendor[0] && (
                                <span className="rounded-full text-xs px-3 py-1 bg-accent text-accent-foreground border border-accent-foreground">
                                    {vendor[0]} - &#8377;{vendor[1]}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
        },
    ];

    const schema = z.object({
        vendor: z.coerce.number(),
    });

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            vendor: undefined,
        },
    });

    async function onSubmit(values: z.infer<typeof schema>) {
        if (!selectedIndent) return;
        
        try {
            const selectedVendor = selectedIndent.vendors[values.vendor];
            
            // Get current timestamp in IST
            const currentTimestamp = new Date().toLocaleString("en-CA", { 
                timeZone: "Asia/Kolkata", 
                hour12: false 
            }).replace(',', '');

            console.log("Updating indent:", selectedIndent.indentNo);
            console.log("Selected vendor:", selectedVendor);

            // Update directly in Supabase
            const { data, error } = await supabase
                .from('indent')
                .update({
                    actual3: currentTimestamp,
                    approved_vendor_name: selectedVendor?.[0] || null,
                    approved_rate: selectedVendor?.[1] || '0',
                    approved_payment_term: selectedVendor?.[2] || null,
                    with_tax_or_not4: selectedVendor?.[4] || 'Yes',
                    tax_value4: selectedVendor?.[5] || '0',
                    planned4: currentTimestamp,
                })
                .eq('indent_number', selectedIndent.indentNo);

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }
            
            toast.success(`Approved vendor for ${selectedIndent.indentNo}`);
            setOpenDialog(false);
            form.reset();
            setTimeout(() => updateIndentSheet(), 1000);
        } catch (error) {
            console.error("❌ Full error:", error);
            toast.error('Failed to update vendor');
        }
    }

    const historyUpdateSchema = z.object({
        rate: z.coerce.number(),
    })

    const historyUpdateForm = useForm<z.infer<typeof historyUpdateSchema>>({
        resolver: zodResolver(historyUpdateSchema),
        defaultValues: {
            rate: 0,
        },
    })

    useEffect(() => {
        if (selectedHistory) {
            historyUpdateForm.reset({ rate: parseInt(selectedHistory.vendor[1]) || 0 })
        }
    }, [selectedHistory, historyUpdateForm])

    async function onSubmitHistoryUpdate(values: z.infer<typeof historyUpdateSchema>) {
        if (!selectedHistory) return;
        
        try {
            console.log("Updating rate for:", selectedHistory.indentNo);
            console.log("New rate:", values.rate);

            // Update directly in Supabase
            const { data, error } = await supabase
                .from('indent')
                .update({
                    approved_rate: values.rate,
                    lastUpdated: new Date().toLocaleString("en-CA", { 
                        timeZone: "Asia/Kolkata", 
                        hour12: false 
                    }).replace(',', '')
                })
                .eq('indent_number', selectedHistory.indentNo);

            if (error) throw error;

            toast.success(`Updated rate of ${selectedHistory.indentNo}`);
            setOpenDialog(false);
            historyUpdateForm.reset({ rate: 0 });
            setTimeout(() => updateIndentSheet(), 1000);
        } catch (err) {
            console.error("❌ Error in onSubmitHistoryUpdate:", err);
            toast.error('Failed to update vendor');
        }
    }

    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    return (
        <div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <Tabs defaultValue="pending">
                    <Heading
                        heading="Three Party Rate Approval"
                        subtext="Approve rates for three party vendors"
                        tabs
                    >
                        <Users size={50} className="text-primary" />
                    </Heading>
                    
                    {/* <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pending">
                            Pending Indents ({tableData.length})
                        </TabsTrigger>
                        <TabsTrigger value="history">
                            History ({historyData.length})
                        </TabsTrigger>
                    </TabsList> */}
                    
                    <TabsContent value="pending">
                        {tableData.length === 0 ? (
                            <div className="text-center p-8 border rounded-lg bg-muted/30">
                                <p className="text-muted-foreground">No pending three party approvals found.</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Check the browser console for debugging information.
                                </p>
                            </div>
                        ) : (
                            <DataTable
                                data={tableData}
                                columns={columns}
                                searchFields={['product', 'department', 'indenter', 'firmNameMatch']}
                                dataLoading={indentLoading}
                            />
                        )}
                    </TabsContent>
                    <TabsContent value="history">
                        {historyData.length === 0 ? (
                            <div className="text-center p-8 border rounded-lg bg-muted/30">
                                <p className="text-muted-foreground">No three party approval history found.</p>
                            </div>
                        ) : (
                            <DataTable
                                data={historyData}
                                columns={historyColumns}
                                searchFields={['product', 'department', 'indenter', 'firmNameMatch']}
                                dataLoading={indentLoading}
                            />
                        )}
                    </TabsContent>
                </Tabs>

                {selectedIndent && (
                    <DialogContent>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit, onError)}
                                className="space-y-5"
                            >
                                <DialogHeader className="space-y-1">
                                    <DialogTitle>Rate Approval</DialogTitle>
                                    <DialogDescription>
                                        Approve vendor for{' '}
                                        <span className="font-medium">
                                            {selectedIndent.indentNo}
                                        </span>
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-muted py-2 px-5 rounded-md ">
                                    <div className="space-y-1">
                                        <p className="font-medium">Indenter</p>
                                        <p className="text-sm font-light">
                                            {selectedIndent.indenter}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium">Department</p>
                                        <p className="text-sm font-light">
                                            {selectedIndent.department}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium">Product</p>
                                        <p className="text-sm font-light">
                                            {selectedIndent.product}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid gap-3">
                                    <FormField
                                        control={form.control}
                                        name="vendor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Select a vendor</FormLabel>
                                                <FormControl>
                                                    <RadioGroup onValueChange={field.onChange} value={field.value?.toString()}>
                                                        {selectedIndent.vendors.map(
                                                            (vendor, index) => {
                                                                if (!vendor[0]) return null; // Skip empty vendors
                                                                
                                                                return (
                                                                    <FormItem key={index}>
                                                                        <FormLabel className="flex items-center gap-4 border hover:bg-accent p-3 rounded-md cursor-pointer">
                                                                            <FormControl>
                                                                                <RadioGroupItem value={`${index}`} />
                                                                            </FormControl>
                                                                            <div className="font-normal w-full">
                                                                                <div className="flex justify-between items-center w-full">
                                                                                    <div className="flex-1">
                                                                                        <p className="font-medium text-base">
                                                                                            {vendor[0]}
                                                                                        </p>
                                                                                        <p className="text-xs text-muted-foreground">
                                                                                            Payment Term: {vendor[2]}
                                                                                        </p>
                                                                                        
                                                                                        {vendor[3] === 'Basic Rate' && vendor[4] === 'No' ? (
                                                                                            <p className="text-xs text-orange-600 font-medium mt-1">
                                                                                                Without Tax - GST: {vendor[5]}%
                                                                                            </p>
                                                                                        ) : vendor[3] === 'With Tax' && vendor[4] === 'Yes' ? (
                                                                                            <p className="text-xs text-green-600 font-medium mt-1">
                                                                                                With Tax
                                                                                            </p>
                                                                                        ) : (
                                                                                            <p className="text-xs text-green-600 font-medium mt-1">
                                                                                                With Tax
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="text-right">
                                                                                        <p className="text-base font-semibold">
                                                                                            &#8377;{vendor[1]}
                                                                                        </p>
                                                                                        {vendor[3] === 'Basic Rate' && vendor[4] === 'No' && (
                                                                                            <p className="text-xs text-muted-foreground">
                                                                                                Basic Rate
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </FormLabel>
                                                                    </FormItem>
                                                                );
                                                            }
                                                        )}
                                                    </RadioGroup>
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

                {selectedHistory && (
                    <DialogContent>
                        <Form {...historyUpdateForm}>
                            <form onSubmit={historyUpdateForm.handleSubmit(onSubmitHistoryUpdate, onError)} className="space-y-7">
                                <DialogHeader className="space-y-1">
                                    <DialogTitle>Update Rate</DialogTitle>
                                    <DialogDescription>
                                        Update rate for{' '}
                                        <span className="font-medium">
                                            {selectedHistory.indentNo}
                                        </span>
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-3">
                                    <FormField
                                        control={historyUpdateForm.control}
                                        name="rate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Rate</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Close</Button>
                                    </DialogClose>

                                    <Button
                                        type="submit"
                                        disabled={historyUpdateForm.formState.isSubmitting}
                                    >
                                        {historyUpdateForm.formState.isSubmitting && (
                                            <Loader
                                                size={20}
                                                color="white"
                                                aria-label="Loading Spinner"
                                            />
                                        )}
                                        Update
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