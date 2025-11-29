import { useSheets } from '@/context/SheetsContext';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import DataTable from '../element/DataTable';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { PuffLoader as Loader } from 'react-spinners';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Calculator } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '@/context/AuthContext';
import Heading from '../element/Heading';
import { Pill } from '../ui/pill';
import supabase from '@/SupabaseClient';

interface TallyEntryPendingData {
    indent_number: string;
    indent_date: string;
    purchase_date: string;
    material_in_date: string;
    product_name: string;
    bill_no: string;
    qty: number;
    party_name: string;
    bill_amt: number;
    bill_image: string;
    bill_received_later: string;
    not_received_bill_no: string;
    location: string;
    type_of_bills: string;
    product_image: string;
    area: string;
    indented_for: string;
    approved_party_name: string;
    rate: number;
    indent_qty: number;
    total_rate: number;
    status1: string;
    remarks1: string;
    status2: string;
    remarks2: string;
    status3: string;
    remarks3: string;
    firm_name_match: string;
}

interface TallyEntryHistoryData {
    indent_number: string;
    indent_date: string;
    purchase_date: string;
    material_in_date: string;
    product_name: string;
    bill_no: string;
    qty: number;
    party_name: string;
    bill_amt: number;
    bill_image: string;
    bill_received_later: string;
    not_received_bill_no: string;
    location: string;
    type_of_bills: string;
    product_image: string;
    area: string;
    indented_for: string;
    approved_party_name: string;
    rate: number;
    indent_qty: number;
    total_rate: number;
    status1: string;
    remarks1: string;
    status2: string;
    remarks2: string;
    status3: string;
    remarks3: string;
    status4: string;
    remarks4: string;
    firm_name_match: string;
}

export default () => {
    const { tallyEntrySheet, updateAll } = useSheets();
    const { user } = useAuth();

    const [pendingData, setPendingData] = useState<TallyEntryPendingData[]>([]);
    const [historyData, setHistoryData] = useState<TallyEntryHistoryData[]>([]);
    const [selectedItem, setSelectedItem] = useState<TallyEntryPendingData | null>(null);
    const [openDialog, setOpenDialog] = useState(false);

    // Debug logging
    useEffect(() => {
        console.log("=== TALLY ENTRY DEBUG ===");
        console.log("Total tallyEntrySheet items:", tallyEntrySheet.length);
        console.log("User firm_name_match:", user.firm_name_match);
        
        if (tallyEntrySheet.length > 0) {
            console.log("First item sample:", tallyEntrySheet[0]);
            console.log("=== AVAILABLE PROPERTIES IN FIRST ITEM ===");
            const firstItem = tallyEntrySheet[0];
            console.log("All properties:", Object.keys(firstItem));
            console.log("planned4:", firstItem.planned4);
            console.log("actual4:", firstItem.actual4);
        }
    }, [tallyEntrySheet, user.firm_name_match]);

    useEffect(() => {
        // Pehle firm name se filter karo (case-insensitive)
        const filteredByFirm = tallyEntrySheet.filter(item => {
            const userFirm = user.firm_name_match?.toLowerCase() || '';
            const itemFirm = item.firm_name_match?.toLowerCase() || '';
            return userFirm === "all" || itemFirm === userFirm;
        });
        
        const pendingItems = filteredByFirm.filter((i) => {
            const hasPlanned = i.planned4 && i.planned4.trim() !== '';
            const hasActual = i.actual4 && i.actual4.trim() !== '';
            const isPending = hasPlanned && !hasActual;
            return isPending;
        });
        
        console.log("Pending items found:", pendingItems.length);
        
        setPendingData(pendingItems.map((i) => ({
            indent_number: i.indent_number || i.indent_no || '',
            indent_date: i.indent_date || '',
            purchase_date: i.purchase_date || '',
            material_in_date: i.material_in_date || '',
            product_name: i.product_name || '',
            bill_no: i.bill_no || '',
            qty: i.qty || 0,
            party_name: i.party_name || '',
            bill_amt: i.bill_amt || 0,
            bill_image: i.bill_image || '',
            bill_received_later: i.bill_received_later || '',
            not_received_bill_no: i.not_received_bill_no || '',
            location: i.location || '',
            type_of_bills: i.type_of_bills || '',
            product_image: i.product_image || '',
            area: i.area || '',
            indented_for: i.indented_for || '',
            approved_party_name: i.approved_party_name || '',
            rate: i.rate || 0,
            indent_qty: i.indent_qty || 0,
            total_rate: i.total_rate || 0,
            status1: i.status1 || '',
            remarks1: i.remarks1 || '',
            status2: i.status2 || '',
            remarks2: i.remarks2 || '',
            status3: i.status3 || '',
            remarks3: i.remarks3 || '',
            firm_name_match: i.firm_name_match || '',
        })));
    }, [tallyEntrySheet, user.firm_name_match]);

    useEffect(() => {
        // Pehle firm name se filter karo (case-insensitive)
        const filteredByFirm = tallyEntrySheet.filter(item => {
            const userFirm = user.firm_name_match?.toLowerCase() || '';
            const itemFirm = item.firm_name_match?.toLowerCase() || '';
            return userFirm === "all" || itemFirm === userFirm;
        });
        
        const historyItems = filteredByFirm.filter((i) => {
            const hasPlanned = i.planned4 && i.planned4.trim() !== '';
            const hasActual = i.actual4 && i.actual4.trim() !== '';
            const isHistory = hasPlanned && hasActual;
            return isHistory;
        });
        
        console.log("History items found:", historyItems.length);
        
        setHistoryData(historyItems.map((i) => ({
            indent_number: i.indent_number || i.indent_no || '',
            indent_date: i.indent_date || '',
            purchase_date: i.purchase_date || '',
            material_in_date: i.material_in_date || '',
            product_name: i.product_name || '',
            bill_no: i.bill_no || '',
            qty: i.qty || 0,
            party_name: i.party_name || '',
            bill_amt: i.bill_amt || 0,
            bill_image: i.bill_image || '',
            bill_received_later: i.bill_received_later || '',
            not_received_bill_no: i.not_received_bill_no || '',
            location: i.location || '',
            type_of_bills: i.type_of_bills || '',
            product_image: i.product_image || '',
            area: i.area || '',
            indented_for: i.indented_for || '',
            approved_party_name: i.approved_party_name || '',
            rate: i.rate || 0,
            indent_qty: i.indent_qty || 0,
            total_rate: i.total_rate || 0,
            status1: i.status1 || '',
            remarks1: i.remarks1 || '',
            status2: i.status2 || '',
            remarks2: i.remarks2 || '',
            status3: i.status3 || '',
            remarks3: i.remarks3 || '',
            status4: i.status4 || '',
            remarks4: i.remarks4 || '',
            firm_name_match: i.firm_name_match || '',
        })));
    }, [tallyEntrySheet, user.firm_name_match]);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch {
            return dateString;
        }
    };

    const pendingColumns: ColumnDef<TallyEntryPendingData>[] = [
        ...(user.receive_item_view
            ? [
                {
                    header: 'Action',
                    cell: ({ row }: { row: Row<TallyEntryPendingData> }) => {
                        const item = row.original;

                        return (
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedItem(item);
                                        setOpenDialog(true);
                                    }}
                                >
                                    Process
                                </Button>
                            </DialogTrigger>
                        );
                    },
                },
            ]
            : []),
        { accessorKey: 'indent_number', header: 'Indent No.' },
        { accessorKey: 'firm_name_match', header: 'Firm Name' },
        { 
            accessorKey: 'indent_date', 
            header: 'Indent Date',
            cell: ({ row }) => formatDate(row.original.indent_date)
        },
        { 
            accessorKey: 'purchase_date', 
            header: 'Purchase Date',
            cell: ({ row }) => formatDate(row.original.purchase_date)
        },
        { 
            accessorKey: 'material_in_date', 
            header: 'Material In Date',
            cell: ({ row }) => formatDate(row.original.material_in_date)
        },
        { accessorKey: 'product_name', header: 'Product Name' },
        { accessorKey: 'bill_no', header: 'Bill No.' },
        { accessorKey: 'qty', header: 'Qty' },
        { accessorKey: 'party_name', header: 'Party Name' },
        { accessorKey: 'bill_amt', header: 'Bill Amt' },
        {
            accessorKey: 'bill_image',
            header: 'Bill Image',
            cell: ({ row }) => {
                const image = row.original.bill_image;
                return image && image.trim() !== '' ? (
                    <a href={image} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        { accessorKey: 'bill_received_later', header: 'Bill Received Later' },
        { accessorKey: 'not_received_bill_no', header: 'Not Received Bill No.' },
        { accessorKey: 'location', header: 'Location' },
        { accessorKey: 'type_of_bills', header: 'Type Of Bills' },
        {
            accessorKey: 'product_image',
            header: 'Product Image',
            cell: ({ row }) => {
                const image = row.original.product_image;
                return image && image.trim() !== '' ? (
                    <a href={image} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        { accessorKey: 'area', header: 'Area' },
        { accessorKey: 'indented_for', header: 'Indented For' },
        { accessorKey: 'approved_party_name', header: 'Approved Party Name' },
        { accessorKey: 'rate', header: 'Rate' },
        { accessorKey: 'indent_qty', header: 'Indent Qty' },
        { accessorKey: 'total_rate', header: 'Total Rate' },
        { accessorKey: 'status1', header: 'Status 1' },
        { accessorKey: 'remarks1', header: 'Remarks 1' },
        { accessorKey: 'status2', header: 'Status 2' },
        { accessorKey: 'remarks2', header: 'Remarks 2' },
        { accessorKey: 'status3', header: 'Status 3' },
        { accessorKey: 'remarks3', header: 'Remarks 3' },
    ];

    const historyColumns: ColumnDef<TallyEntryHistoryData>[] = [
        { accessorKey: 'indent_number', header: 'Indent No.' },
        { accessorKey: 'firm_name_match', header: 'Firm Name' },
        { 
            accessorKey: 'indent_date', 
            header: 'Indent Date',
            cell: ({ row }) => formatDate(row.original.indent_date)
        },
        { 
            accessorKey: 'purchase_date', 
            header: 'Purchase Date',
            cell: ({ row }) => formatDate(row.original.purchase_date)
        },
        { 
            accessorKey: 'material_in_date', 
            header: 'Material In Date',
            cell: ({ row }) => formatDate(row.original.material_in_date)
        },
        { accessorKey: 'product_name', header: 'Product Name' },
        { accessorKey: 'bill_no', header: 'Bill No.' },
        { accessorKey: 'qty', header: 'Qty' },
        { accessorKey: 'party_name', header: 'Party Name' },
        { accessorKey: 'bill_amt', header: 'Bill Amt' },
        {
            accessorKey: 'bill_image',
            header: 'Bill Image',
            cell: ({ row }) => {
                const image = row.original.bill_image;
                return image && image.trim() !== '' ? (
                    <a href={image} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        { accessorKey: 'bill_received_later', header: 'Bill Received Later' },
        { accessorKey: 'not_received_bill_no', header: 'Not Received Bill No.' },
        { accessorKey: 'location', header: 'Location' },
        { accessorKey: 'type_of_bills', header: 'Type Of Bills' },
        {
            accessorKey: 'product_image',
            header: 'Product Image',
            cell: ({ row }) => {
                const image = row.original.product_image;
                return image && image.trim() !== '' ? (
                    <a href={image} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        { accessorKey: 'area', header: 'Area' },
        { accessorKey: 'indented_for', header: 'Indented For' },
        { accessorKey: 'approved_party_name', header: 'Approved Party Name' },
        { accessorKey: 'rate', header: 'Rate' },
        { accessorKey: 'indent_qty', header: 'Indent Qty' },
        { accessorKey: 'total_rate', header: 'Total Rate' },
        {
            accessorKey: 'status1',
            header: 'Status 1',
            cell: ({ row }) => {
                const status = row.original.status1;
                const variant = status === 'Done' ? 'secondary' : 'reject';
                return <Pill variant={variant}>{status}</Pill>;
            },
        },
        { accessorKey: 'remarks1', header: 'Remarks 1' },
        {
            accessorKey: 'status2',
            header: 'Status 2',
            cell: ({ row }) => {
                const status = row.original.status2;
                const variant = status === 'Done' ? 'secondary' : 'reject';
                return <Pill variant={variant}>{status}</Pill>;
            },
        },
        { accessorKey: 'remarks2', header: 'Remarks 2' },
        {
            accessorKey: 'status3',
            header: 'Status 3',
            cell: ({ row }) => {
                const status = row.original.status3;
                const variant = status === 'Done' ? 'secondary' : 'reject';
                return <Pill variant={variant}>{status}</Pill>;
            },
        },
        { accessorKey: 'remarks3', header: 'Remarks 3' },
        {
            accessorKey: 'status4',
            header: 'Status 4',
            cell: ({ row }) => {
                const status = row.original.status4;
                const variant = status === 'Done' ? 'secondary' : 'reject';
                return <Pill variant={variant}>{status}</Pill>;
            },
        },
        { accessorKey: 'remarks4', header: 'Remarks 4' },
    ];

    const schema = z.object({
        status4: z.enum(['Done', 'Not Done'], {
            required_error: 'Please select a status',
        }),
        remarks4: z.string().min(1, 'Remarks are required'),
    });

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            status4: undefined,
            remarks4: '',
        },
    });

    useEffect(() => {
        if (!openDialog) {
            form.reset({
                status4: undefined,
                remarks4: '',
            });
        }
    }, [openDialog, form]);

    async function onSubmit(values: z.infer<typeof schema>) {
        try {
            if (!selectedItem) {
                toast.error('No item selected');
                return;
            }

            const currentDateTime = new Date()
                .toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                })
                .replace(',', '');

            // Update Supabase table directly
            const { data, error } = await supabase
                .from('tally_entry')
                .update({
                    actual4: new Date().toLocaleString("en-CA", { 
      timeZone: "Asia/Kolkata", 
      hour12: false 
    }).replace(',', ''),
                    status4: values.status4,
                    remarks4: values.remarks4,
                    // updated_at: new Date().toISOString(),
                })
                .eq('indent_number', selectedItem.indent_number);

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            console.log('Update successful:', data);
            toast.success(`Updated status for ${selectedItem.indent_number}`);
            setOpenDialog(false);
            setTimeout(() => updateAll(), 1000);

        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Failed to update status');
        }
    }

    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    return (
        <div>
            {/* Debug Info */}
            {/* <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                <h3 className="font-bold text-yellow-800">Debug Info:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <p>Total Sheets: <span className="font-semibold">{tallyEntrySheet.length}</span></p>
                    <p>Pending: <span className="font-semibold">{pendingData.length}</span></p>
                    <p>History: <span className="font-semibold">{historyData.length}</span></p>
                    <p>User Firm: <span className="font-semibold">{user.firm_name_match}</span></p>
                </div>
            </div> */}

            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <Tabs defaultValue="pending">
                    <Heading
                        heading="Tally Entry"
                        subtext="Process tally entries and manage status"
                        tabs
                    >
                        <Calculator size={50} className="text-primary" />
                    </Heading>

                    {/* <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pending">
                            Pending ({pendingData.length})
                        </TabsTrigger>
                        <TabsTrigger value="history">
                            History ({historyData.length})
                        </TabsTrigger>
                    </TabsList> */}

                    <TabsContent value="pending">
                        {pendingData.length > 0 ? (
                            <DataTable
                                data={pendingData}
                                columns={pendingColumns}
                                searchFields={['indent_number', 'product_name', 'party_name', 'bill_no']}
                                dataLoading={false}
                            />
                        ) : (
                            <div className="text-center p-8 border rounded-lg">
                                <p className="text-muted-foreground">No pending tally entries found</p>
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="history">
                        {historyData.length > 0 ? (
                            <DataTable
                                data={historyData}
                                columns={historyColumns}
                                searchFields={[
                                    'indent_number',
                                    'product_name',
                                    'party_name',
                                    'bill_no',
                                    'status1',
                                    'status2',
                                    'status3',
                                    'status4',
                                ]}
                                dataLoading={false}
                            />
                        ) : (
                            <div className="text-center p-8 border rounded-lg">
                                <p className="text-muted-foreground">No tally history entries found</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {selectedItem && (
                    <DialogContent className="sm:max-w-2xl">
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit, onError)}
                                className="space-y-5"
                            >
                                <DialogHeader className="space-y-1">
                                    <DialogTitle>Process Tally Entry</DialogTitle>
                                    <DialogDescription>
                                        Process entry for indent number{' '}
                                        <span className="font-medium">{selectedItem.indent_number}</span>
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="bg-muted p-4 rounded-md grid gap-3">
                                    <h3 className="text-lg font-bold">Entry Details</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <p className="font-medium text-nowrap">Indent No.</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.indent_number}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-nowrap">Indent Date</p>
                                            <p className="text-sm font-light">
                                                {formatDate(selectedItem.indent_date)}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-nowrap">Purchase Date</p>
                                            <p className="text-sm font-light">
                                                {formatDate(selectedItem.purchase_date)}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-nowrap">Product Name</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.product_name}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Party Name</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.party_name}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Bill No.</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.bill_no}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Quantity</p>
                                            <p className="text-sm font-light">{selectedItem.qty}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Bill Amount</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.bill_amt}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Location</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.location}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    <FormField
                                        control={form.control}
                                        name="status4"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status *</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Done">Done</SelectItem>
                                                        <SelectItem value="Not Done">
                                                            Not Done
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="remarks4"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Remarks *</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Enter remarks..."
                                                        {...field}
                                                        rows={4}
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
                                        Update Status
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