import { useSheets } from '@/context/SheetsContext';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import DataTable from '../element/DataTable';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { postToSheet, uploadFile } from '@/lib/fetchers';

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
import { Input } from '../ui/input';
import { Truck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '@/context/AuthContext';
import Heading from '../element/Heading';
import { Pill } from '../ui/pill';
import supabase from '@/SupabaseClient';

interface StoreInPendingData {
    lift_number: string;
    indent_number: string;
    bill_no: string;
    vendor_name: string;
    product_name: string;
    qty: number;
    type_of_bill: string;
    bill_amount: number;
    payment_type: string;
    advance_amount_if_any: number;
    photo_of_bill: string;
    transportation_include: string;
    transporter_name: string;
    amount: number;
    firm_name_match: string;
    damage_order?: string;
    quantity_as_per_bill?: number;
    price_as_per_po?: number;
    remark?: string;
}

interface StoreInHistoryData {
    lift_number: string;
    indent_number: string;
    bill_no: string;
    vendor_name: string;
    product_name: string;
    qty: number;
    type_of_bill: string;
    bill_amount: number;
    payment_type: string;
    advance_amount_if_any: number;
    photo_of_bill: string;
    transportation_include: string;
    status: string;
    bill_copy_attached: string;
    debit_note: string;
    reason: string;
    firm_name_match: string;
    damage_order?: string;
    quantity_as_per_bill?: number;
    price_as_per_po?: number;
    remark?: string;
}

interface StoreInSheetItem {
    lift_number?: string;
    indent_no?: string;
    bill_no?: string;
    vendor_name?: string;
    product_name?: string;
    qty?: number;
    type_of_bill?: string;
    bill_amount?: number;
    payment_type?: string;
    advance_amount_if_any?: number | string;
    photo_of_bill?: string;
    transportation_include?: string;
    transporter_name?: string;
    amount?: number;
    planned7?: string;
    actual7?: string;
    status?: string;
    bill_copy_attached?: string;
    debit_note?: string;
    reason?: string;
    damage_order?: string;
    quantity_as_per_bill?: number;
    price_as_per_po?: number;
    remark?: string;
    firm_name_match?: string;
    rowIndex?: number;
}

const schema = z.object({
    status: z.enum(['Accept', 'Reject']),
    billCopyAttached: z.instanceof(File).optional(),
    debitNote: z.enum(['Yes', 'No']),
    reason: z.string().min(1, 'Reason is required'),
});

type FormValues = z.infer<typeof schema>;

export default () => {
    const { storeInSheet, updateAll } = useSheets();
    const { user } = useAuth();

    const [pendingData, setPendingData] = useState<StoreInPendingData[]>([]);
    const [historyData, setHistoryData] = useState<StoreInHistoryData[]>([]);
    const [selectedItem, setSelectedItem] = useState<StoreInPendingData | null>(null);
    const [openDialog, setOpenDialog] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            status: undefined,
            billCopyAttached: undefined,
            debitNote: undefined,
            reason: '',
        },
    });

    useEffect(() => {
        console.log('📊 StoreInSheet data:', storeInSheet); // Debug log
        console.log('👤 User firm match:', user.firm_name_match); // Debug log
        
        const filteredByFirm = storeInSheet.filter((item: StoreInSheetItem) => 
            user.firm_name_match?.toLowerCase() === "all" || item.firm_name_match === user.firm_name_match
        );
        
        console.log('🔍 Filtered by firm:', filteredByFirm); // Debug log
        
        const pendingItems = filteredByFirm
            .filter((i: StoreInSheetItem) => i.planned7 && i.planned7 !== '' && (!i.actual7 || i.actual7 === ''))
            .map((i: StoreInSheetItem) => ({
                lift_number: i.lift_number || '',
                indent_number: i.indent_no || '',
                bill_no: i.bill_no || '',
                vendor_name: i.vendor_name || '',
                product_name: i.product_name || '',
                qty: i.qty || 0,
                type_of_bill: i.type_of_bill || '',
                bill_amount: i.bill_amount || 0,
                payment_type: i.payment_type || '',
                advance_amount_if_any: Number(i.advance_amount_if_any) || 0,
                photo_of_bill: i.photo_of_bill || '',
                transportation_include: i.transportation_include || '',
                transporter_name: i.transporter_name || '',
                amount: i.amount || 0,
                damage_order: i.damage_order || '',
                quantity_as_per_bill: i.quantity_as_per_bill || 0,
                price_as_per_po: i.price_as_per_po || 0,
                remark: i.remark || '',
                firm_name_match: i.firm_name_match || '',
            }));
        
        console.log('⏳ Pending items:', pendingItems); // Debug log
        setPendingData(pendingItems);
    }, [storeInSheet, user.firm_name_match]);

    useEffect(() => {
        const filteredByFirm = storeInSheet.filter((item: StoreInSheetItem) => 
            user.firm_name_match?.toLowerCase() === "all" || item.firm_name_match === user.firm_name_match
        );
        
        const historyItems = filteredByFirm
            .filter((i: StoreInSheetItem) => i.planned7 && i.planned7 !== '' && i.actual7 && i.actual7 !== '')
            .map((i: StoreInSheetItem) => ({
                lift_number: i.lift_number || '',
                indent_number: i.indent_no || '',
                bill_no: i.bill_no || '',
                vendor_name: i.vendor_name || '',
                product_name: i.product_name || '',
                qty: i.qty || 0,
                type_of_bill: i.type_of_bill || '',
                bill_amount: i.bill_amount || 0,
                payment_type: i.payment_type || '',
                advance_amount_if_any: Number(i.advance_amount_if_any) || 0,
                photo_of_bill: i.photo_of_bill || '',
                transportation_include: i.transportation_include || '',
                status: i.status || '',
                bill_copy_attached: i.bill_copy_attached || '',
                debit_note: i.debit_note || '',
                reason: i.reason || '',
                damage_order: i.damage_order || '',
                quantity_as_per_bill: i.quantity_as_per_bill || 0,
                price_as_per_po: i.price_as_per_po || 0,
                remark: i.remark || '',
                firm_name_match: i.firm_name_match || '',
            }));
        
        console.log('📜 History items:', historyItems); // Debug log
        setHistoryData(historyItems);
    }, [storeInSheet, user.firm_name_match]);

    const pendingColumns: ColumnDef<StoreInPendingData>[] = [
        ...(user.receive_item_view
            ? [
                  {
                      header: 'Action',
                      cell: ({ row }: { row: Row<StoreInPendingData> }) => {
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
        { accessorKey: 'lift_number', header: 'Lift Number' },
        { accessorKey: 'indent_number', header: 'Indent No.' },
        { accessorKey: 'bill_no', header: 'Bill No.' },
        { accessorKey: 'vendor_name', header: 'Vendor Name' },
        { accessorKey: 'firm_name_match', header: 'Firm Name' },
        { accessorKey: 'product_name', header: 'Product Name' },
        { accessorKey: 'qty', header: 'Qty' },
        { accessorKey: 'type_of_bill', header: 'Type Of Bill' },
        { accessorKey: 'bill_amount', header: 'Bill Amount' },
        { accessorKey: 'payment_type', header: 'Payment Type' },
        { accessorKey: 'advance_amount_if_any', header: 'Advance Amount If Any' },
        {
            accessorKey: 'photo_of_bill',
            header: 'Photo Of Bill',
            cell: ({ row }) => {
                const photo = row.original.photo_of_bill;
                return photo ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Bill
                    </a>
                ) : (
                    <span className="text-gray-400">No bill</span>
                );
            },
        },
        { accessorKey: 'transportation_include', header: 'Transportation Include' },
        { accessorKey: 'transporter_name', header: 'Transporter Name' },
        { accessorKey: 'amount', header: 'Amount' },
        { accessorKey: 'damage_order', header: 'Damage Order' },
        { accessorKey: 'quantity_as_per_bill', header: 'Quantity As Per Bill' },
        { accessorKey: 'price_as_per_po', header: 'Price As Per Po' },
        { accessorKey: 'remark', header: 'Remark' },
    ];

    const historyColumns: ColumnDef<StoreInHistoryData>[] = [
        { accessorKey: 'lift_number', header: 'Lift Number' },
        { accessorKey: 'indent_number', header: 'Indent No.' },
        { accessorKey: 'bill_no', header: 'Bill No.' },
        { accessorKey: 'vendor_name', header: 'Vendor Name' },
        { accessorKey: 'firm_name_match', header: 'Firm Name' },
        { accessorKey: 'product_name', header: 'Product Name' },
        { accessorKey: 'qty', header: 'Qty' },
        { accessorKey: 'type_of_bill', header: 'Type Of Bill' },
        { accessorKey: 'bill_amount', header: 'Bill Amount' },
        { accessorKey: 'payment_type', header: 'Payment Type' },
        { accessorKey: 'advance_amount_if_any', header: 'Advance Amount If Any' },
        {
            accessorKey: 'photo_of_bill',
            header: 'Photo Of Bill',
            cell: ({ row }) => {
                const photo = row.original.photo_of_bill;
                return photo ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Bill
                    </a>
                ) : (
                    <span className="text-gray-400">No bill</span>
                );
            },
        },
        { accessorKey: 'transportation_include', header: 'Transportation Include' },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                const variant = status === 'Accept' ? 'default' : 'reject';
                return <Pill variant={variant as any}>{status}</Pill>;
            },
        },
        {
            accessorKey: 'bill_copy_attached',
            header: 'Bill Copy Attached',
            cell: ({ row }) => {
                const billCopy = row.original.bill_copy_attached;
                return billCopy ? (
                    <a href={billCopy} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View
                    </a>
                ) : (
                    <span className="text-gray-400">No copy</span>
                );
            },
        },
        { accessorKey: 'debit_note', header: 'Debit Note' },
        { accessorKey: 'reason', header: 'Reason' },
        { accessorKey: 'damage_order', header: 'Damage Order' },
        { accessorKey: 'quantity_as_per_bill', header: 'Quantity As Per Bill' },
        { accessorKey: 'price_as_per_po', header: 'Price As Per Po' },
        { accessorKey: 'remark', header: 'Remark' },
    ];

    useEffect(() => {
        if (!openDialog) {
            form.reset({
                status: undefined,
                billCopyAttached: undefined,
                debitNote: undefined,
                reason: '',
            });
        }
    }, [openDialog, form]);

    async function onSubmit(values: FormValues) {
        try {
            console.log('📝 Form values:', values);
            
            if (!selectedItem) {
                console.error('❌ No item selected');
                toast.error('No item selected');
                return;
            }
            
            let billCopyAttachedUrl = '';

            // Step 1: Upload file to Supabase Storage if exists
            if (values.billCopyAttached) {
                try {
                    console.log('📤 Uploading bill copy to Supabase Storage...');
                    
                    // Generate unique file name
                    const fileExt = values.billCopyAttached.name.split('.').pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                    const filePath = `bill-copies/${fileName}`;

                    // Upload to Supabase Storage
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('bill_copy_attached')
                        .upload(filePath, values.billCopyAttached);

                    if (uploadError) {
                        console.error('❌ Storage upload error:', uploadError);
                        throw uploadError;
                    }

                    console.log('✅ File uploaded to storage:', uploadData);

                    // Get public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('bill_copy_attached')
                        .getPublicUrl(filePath);

                    billCopyAttachedUrl = publicUrl;
                    console.log('✅ Bill copy URL generated:', billCopyAttachedUrl);
                    
                } catch (uploadError) {
                    console.error('❌ Supabase upload error:', uploadError);
                    toast.error('Failed to upload bill copy');
                    return;
                }
            }

            // Step 2: Prepare update data
            const updateData: any = {
                actual7: new Date().toLocaleString("en-CA", { 
                    timeZone: "Asia/Kolkata", 
                    hour12: false 
                }).replace(',', ''),
                status: values.status,
                bill_copy_attached: billCopyAttachedUrl || null,
                send_debit_note: values.debitNote,
                reason: values.reason,
            };

            console.log('📊 Update data for store_in table:', updateData);

            // Step 3: Update the record in Supabase store_in table
            const { data, error } = await supabase
                .from('store_in')
                .update(updateData)
                .eq('lift_number', selectedItem.lift_number);

            if (error) {
                console.error('❌ Supabase update error:', error);
                toast.error(`Failed to update: ${error.message}`);
                return;
            }

            console.log('✅ Update successful:', data);
            toast.success(`Updated status for ${selectedItem.lift_number}`);
            setOpenDialog(false);
            
            // Refresh the data
            setTimeout(() => updateAll(), 1000);
        } catch (error) {
            console.error('❌ Error in onSubmit:', error);
            
            if (error instanceof Error) {
                toast.error(`Failed to update: ${error.message}`);
            } else {
                toast.error('Failed to update status');
            }
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
                        heading="Store In Management"
                        subtext="Process store items and manage returns"
                        tabs
                    >
                        <Truck size={50} className="text-primary" />
                    </Heading>

                    <TabsContent value="pending">
                        {pendingData.length === 0 ? (
                            <div className="text-center p-8 border rounded-lg">
                                <p className="text-muted-foreground">No pending items found</p>
                            </div>
                        ) : (
                            <DataTable
                                data={pendingData}
                                columns={pendingColumns}
                                searchFields={[
                                    'lift_number',
                                    'indent_number',
                                    'product_name',
                                    'vendor_name',
                                ]}
                                dataLoading={false}
                            />
                        )}
                    </TabsContent>
                    <TabsContent value="history">
                        {historyData.length === 0 ? (
                            <div className="text-center p-8 border rounded-lg">
                                <p className="text-muted-foreground">No history items found</p>
                            </div>
                        ) : (
                            <DataTable
                                data={historyData}
                                columns={historyColumns}
                                searchFields={[
                                    'lift_number',
                                    'indent_number',
                                    'product_name',
                                    'vendor_name',
                                    'status',
                                ]}
                                dataLoading={false}
                            />
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
                                    <DialogTitle>Process Store Item</DialogTitle>
                                    <DialogDescription>
                                        Process item from lift number{' '}
                                        <span className="font-medium">
                                            {selectedItem.lift_number}
                                        </span>
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="bg-muted p-4 rounded-md grid gap-3">
                                    <h3 className="text-lg font-bold">Item Details</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <p className="font-medium text-nowrap">Indent Number</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.indent_number}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-nowrap">Lift Number</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.lift_number}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Product Name</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.product_name}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Vendor Name</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.vendor_name}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Quantity</p>
                                            <p className="text-sm font-light">{selectedItem.qty}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Bill Amount</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.bill_amount}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Payment Type</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.payment_type}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Accept">Accept</SelectItem>
                                                            <SelectItem value="Reject">Reject</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    {form.watch('status') === 'Accept' && (
                                        <FormField
                                            control={form.control}
                                            name="billCopyAttached"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Bill Copy Attached</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="file"
                                                            accept="image/*,.pdf"
                                                            onChange={(e) => field.onChange(e.target.files?.[0])}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {(form.watch('status') === 'Accept' || form.watch('status') === 'Reject') && (
                                        <FormField
                                            control={form.control}
                                            name="reason"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Reason</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter reason" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {(form.watch('status') === 'Accept' || form.watch('status') === 'Reject') && (
                                        <FormField
                                            control={form.control}
                                            name="debitNote"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Send Debit Note</FormLabel>
                                                    <FormControl>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select option" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Yes">Yes</SelectItem>
                                                                <SelectItem value="No">No</SelectItem>
                                                            </SelectContent>
                                                        </Select>
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