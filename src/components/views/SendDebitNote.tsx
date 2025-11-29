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
import { Input } from '../ui/input';
import { postToSheet, uploadFile } from '@/lib/fetchers';
import { Truck } from 'lucide-react';
import { Tabs, TabsContent } from '../ui/tabs';
import { useAuth } from '@/context/AuthContext';
import Heading from '../element/Heading';
import { Pill } from '../ui/pill';
import supabase from '@/SupabaseClient'; // Add this import

interface StoreInPendingData {
    liftNumber: string;
    indentNumber: string;
    billNo: string;
    vendorName: string;
    productName: string;
    qty: number;
    typeOfBill: string;
    billAmount: number;
    paymentType: string;
    advanceAmountIfAny: number;
    photoOfBill: string;
    transportationInclude: string;
    transporterName: string;
    amount: number;
    firmNameMatch: string;
    reason: string;
}

interface StoreInHistoryData {
    liftNumber: string;
    indentNumber: string;
    billNo: string;
    vendorName: string;
    productName: string;
    qty: number;
    typeOfBill: string;
    billAmount: number;
    paymentType: string;
    advanceAmountIfAny: number;
    photoOfBill: string;
    transportationInclude: string;
    status: string;
    reason: string;
    billNumber: string;
    statusPurchaser: string;
    debitNoteCopy: string;
    billCopy: string;
    returnCopy: string;
    firmNameMatch: string;
    debitNoteNumber: string; // Add this
}

export default () => {
    const { storeInSheet, updateAll } = useSheets();
    const { user } = useAuth();

    const [pendingData, setPendingData] = useState<StoreInPendingData[]>([]);
    const [historyData, setHistoryData] = useState<StoreInHistoryData[]>([]);
    const [selectedItem, setSelectedItem] = useState<StoreInPendingData | null>(null);
    const [openDialog, setOpenDialog] = useState(false);

    // Debug: Log the storeInSheet data to see what columns are available
    useEffect(() => {
        console.log('📊 Full storeInSheet data:', storeInSheet);
        if (storeInSheet.length > 0) {
            console.log('🔍 First item keys:', Object.keys(storeInSheet[0]));
            console.log('🔍 First item planned9:', storeInSheet[0].planned9);
            console.log('🔍 First item actual9:', storeInSheet[0].actual9);
            console.log('🔍 First item debit_note_copy:', storeInSheet[0].debit_note_copy);
            console.log('🔍 First item debit_note_number:', storeInSheet[0].debit_note_number);
        }
    }, [storeInSheet]);

    useEffect(() => {
        console.log('🔄 Filtering pending data...');
        
        const filteredByFirm = storeInSheet.filter(item => 
            user.firm_name_match?.toLowerCase() === "all" || item.firm_name_match === user.firm_name_match
        );
        
        console.log('👥 After firm filter:', filteredByFirm.length, 'items');
        
        const pendingItems = filteredByFirm
            .filter((i) => {
                // Check if planned9 exists and actual9 is empty
                const hasPlanned9 = i.planned9 && i.planned9 !== '';
                const hasNoActual9 = !i.actual9 || i.actual9 === '';
                console.log(`📝 ${i.lift_number}: planned9=${i.planned9}, actual9=${i.actual9}, matches=${hasPlanned9 && hasNoActual9}`);
                return hasPlanned9 && hasNoActual9;
            })
            .map((i) => ({
                liftNumber: i.lift_number || '',
                indentNumber: i.indent_no || '',
                billNo: i.bill_no || '',
                vendorName: i.vendor_name || '',
                productName: i.product_name || '',
                qty: i.qty || 0,
                typeOfBill: i.type_of_bill || '',
                billAmount: i.bill_amount || 0,
                paymentType: i.payment_type || '',
                advanceAmountIfAny: Number(i.advance_amount_if_any) || 0,
                photoOfBill: i.photo_of_bill || '',
                transportationInclude: i.transportation_include || '',
                transporterName: i.transporter_name || '',
                amount: i.amount || 0,
                firmNameMatch: i.firm_name_match || '',
                reason: i.reason || '',
            }));

        console.log('⏳ Final pending items:', pendingItems);
        setPendingData(pendingItems);
    }, [storeInSheet, user.firm_name_match]);

    useEffect(() => {
        console.log('🔄 Filtering history data...');
        
        const filteredByFirm = storeInSheet.filter(item => 
            user.firm_name_match?.toLowerCase() === "all" || item.firm_name_match === user.firm_name_match
        );
        
        console.log('👥 After firm filter:', filteredByFirm.length, 'items');
        
        const historyItems = filteredByFirm
            .filter((i) => {
                // Check if both planned9 and actual9 exist
                const hasPlanned9 = i.planned9 && i.planned9 !== '';
                const hasActual9 = i.actual9 && i.actual9 !== '';
                console.log(`📜 ${i.lift_number}: planned9=${i.planned9}, actual9=${i.actual9}, matches=${hasPlanned9 && hasActual9}`);
                return hasPlanned9 && hasActual9;
            })
            .map((i) => ({
                liftNumber: i.lift_number || '',
                indentNumber: i.indent_no || '',
                billNo: i.bill_no || '',
                vendorName: i.vendor_name || '',
                productName: i.product_name || '',
                qty: i.qty || 0,
                typeOfBill: i.type_of_bill || '',
                billAmount: i.bill_amount || 0,
                paymentType: i.payment_type || '',
                advanceAmountIfAny: Number(i.advance_amount_if_any) || 0,
                photoOfBill: i.photo_of_bill || '',
                transportationInclude: i.transportation_include || '',
                status: i.status || '',
                reason: i.reason || '',
                billNumber: i.bill_no || '',
                statusPurchaser: i.statusPurchaser || '',
                debitNoteCopy: i.debit_note_copy || '', // Fixed column name
                billCopy: i.bill_copy_attached || '',
                returnCopy: i.returnCopy || '',
                firmNameMatch: i.firm_name_match || '', // Fixed from type_of_bill
                debitNoteNumber: i.debit_note_number || '', // Add this
            }));

        console.log('📜 Final history items:', historyItems);
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
                                        setOpenDialog(true); // Add this to open dialog
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
        { accessorKey: 'liftNumber', header: 'Lift Number' },
        { accessorKey: 'indentNumber', header: 'Indent No.' },
        { accessorKey: 'firmNameMatch', header: 'Firm Name' }, 
        { accessorKey: 'billNo', header: 'Bill No.' },
        { accessorKey: 'vendorName', header: 'Vendor Name' },
        { accessorKey: 'productName', header: 'Product Name' },
        { accessorKey: 'qty', header: 'Qty' },
        { accessorKey: 'typeOfBill', header: 'Type Of Bill' },
        { accessorKey: 'billAmount', header: 'Bill Amount' },
        { accessorKey: 'paymentType', header: 'Payment Type' },
        { accessorKey: 'advanceAmountIfAny', header: 'Advance Amount If Any' },
        {
            accessorKey: 'photoOfBill',
            header: 'Photo Of Bill',
            cell: ({ row }) => {
                const photo = row.original.photoOfBill;
                return photo ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer">
                        Bill
                    </a>
                ) : (
                    <></>
                );
            },
        },
        { accessorKey: 'transportationInclude', header: 'Transportation Include' },
        { accessorKey: 'transporterName', header: 'Transporter Name' },
        { accessorKey: 'amount', header: 'Amount' },
        { accessorKey: 'reason', header: 'Reason' },
    ];

    const historyColumns: ColumnDef<StoreInHistoryData>[] = [
        { accessorKey: 'liftNumber', header: 'Lift Number' },
        { accessorKey: 'firmNameMatch', header: 'Firm Name' }, 
        { accessorKey: 'indentNumber', header: 'Indent No.' },
        { accessorKey: 'billNo', header: 'Bill No.' },
        { accessorKey: 'vendorName', header: 'Vendor Name' },
        { accessorKey: 'productName', header: 'Product Name' },
        { accessorKey: 'qty', header: 'Qty' },
        { accessorKey: 'typeOfBill', header: 'Type Of Bill' },
        { accessorKey: 'billAmount', header: 'Bill Amount' },
        { accessorKey: 'paymentType', header: 'Payment Type' },
        { accessorKey: 'advanceAmountIfAny', header: 'Advance Amount If Any' },
        {
            accessorKey: 'photoOfBill',
            header: 'Photo Of Bill',
            cell: ({ row }) => {
                const photo = row.original.photoOfBill;
                return photo ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer">
                        Bill
                    </a>
                ) : (
                    <></>
                );
            },
        },
        { accessorKey: 'transportationInclude', header: 'Transportation Include' },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                const variant = status === 'Return' ? 'secondary' : 'reject';
                return <Pill variant={variant}>{status}</Pill>;
            },
        },
        { accessorKey: 'reason', header: 'Reason' },
        { accessorKey: 'billNumber', header: 'Bill Number' },
        {
            accessorKey: 'statusPurchaser',
            header: 'Status Purchaser',
            cell: ({ row }) => {
                const status = row.original.statusPurchaser;
                const variant = status === 'Return to Party' ? 'secondary' : 'reject';
                return <Pill variant={variant}>{status}</Pill>;
            },
        },
        { accessorKey: 'debitNoteNumber', header: 'Debit Note Number' }, // Add this column
        {
            accessorKey: 'debitNoteCopy',
            header: 'Debit Note Copy',
            cell: ({ row }) => {
                const file = row.original.debitNoteCopy;
                return file ? (
                    <a href={file} target="_blank" rel="noopener noreferrer">
                        View
                    </a>
                ) : (
                    <></>
                );
            },
        },
        {
            accessorKey: 'billCopy',
            header: 'Bill Copy',
            cell: ({ row }) => {
                const file = row.original.billCopy;
                return file ? (
                    <a href={file} target="_blank" rel="noopener noreferrer">
                        View
                    </a>
                ) : (
                    <></>
                );
            },
        },
        {
            accessorKey: 'returnCopy',
            header: 'Return Copy',
            cell: ({ row }) => {
                const file = row.original.returnCopy;
                return file ? (
                    <a href={file} target="_blank" rel="noopener noreferrer">
                        View
                    </a>
                ) : (
                    <></>
                );
            },
        },
    ];

    const schema = z.object({
        debitNoteCopy: z.instanceof(File).optional(),
        debitNoteNumber: z.string().optional(),
    });

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            debitNoteCopy: undefined,
            debitNoteNumber: '',
        },
    });

    useEffect(() => {
        if (!openDialog) {
            form.reset({
                debitNoteCopy: undefined,
                debitNoteNumber: '',
            });
        }
    }, [openDialog, form]);

    async function onSubmit(values: z.infer<typeof schema>) {
        try {
            console.log('📝 Form values:', values);
            console.log('📦 Selected item:', selectedItem);
            
            if (!selectedItem) {
                console.error('❌ No item selected');
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

            let debitNoteCopyUrl: string = '';

            // Upload file to Supabase Storage
            if (values.debitNoteCopy) {
                try {
                    console.log('📤 Uploading debit note copy...');
                    
                    const fileExt = values.debitNoteCopy.name.split('.').pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                    const filePath = `debit-notes/${fileName}`;

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('bill_copy_attached')
                        .upload(filePath, values.debitNoteCopy);

                    if (uploadError) {
                        console.error('❌ Storage upload error:', uploadError);
                        throw uploadError;
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('bill_copy_attached')
                        .getPublicUrl(filePath);

                    debitNoteCopyUrl = publicUrl;
                    console.log('✅ File uploaded:', debitNoteCopyUrl);
                } catch (uploadError) {
                    console.error('❌ Upload error:', uploadError);
                    toast.error('Failed to upload file');
                    return;
                }
            }

            // Prepare update data for Supabase
            const updateData: any = {
                actual9: new Date().toLocaleString("en-CA", { 
      timeZone: "Asia/Kolkata", 
      hour12: false 
    }).replace(',', ''),
                debit_note_copy: debitNoteCopyUrl,
                debit_note_number: values.debitNoteNumber,
            };

            console.log('📤 Update data for Supabase:', updateData);
            console.log('🎯 Updating lift_number:', selectedItem.liftNumber);

            // Update directly in Supabase
            const { data, error } = await supabase
                .from('store_in')
                .update(updateData)
                .eq('lift_number', selectedItem.liftNumber);

            if (error) {
                console.error('❌ Supabase update error:', error);
                toast.error(`Failed to update: ${error.message}`);
                return;
            }

            console.log('✅ Update successful:', data);
            toast.success(`Updated status for ${selectedItem.indentNumber}`);
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
                        heading="Send Debit Note"
                        subtext="Process store items and manage returns"
                        tabs
                    >
                        <Truck size={50} className="text-primary" />
                    </Heading>

                    <TabsContent value="pending">
                        {pendingData.length === 0 ? (
                            <div className="text-center p-8 border rounded-lg">
                                <p className="text-muted-foreground">No pending items found</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Check if planned9 column has data and actual9 is empty
                                </p>
                            </div>
                        ) : (
                            <DataTable
                                data={pendingData}
                                columns={pendingColumns}
                                searchFields={[
                                    'liftNumber',
                                    'indentNumber',
                                    'productName',
                                    'vendorName',
                                ]}
                                dataLoading={false}
                            />
                        )}
                    </TabsContent>
                    <TabsContent value="history">
                        {historyData.length === 0 ? (
                            <div className="text-center p-8 border rounded-lg">
                                <p className="text-muted-foreground">No history items found</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Check if both planned9 and actual9 columns have data
                                </p>
                            </div>
                        ) : (
                            <DataTable
                                data={historyData}
                                columns={historyColumns}
                                searchFields={[
                                    'liftNumber',
                                    'indentNumber',
                                    'productName',
                                    'vendorName',
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
                                    <DialogTitle>Send Debit Note</DialogTitle>
                                    <DialogDescription>
                                        Process debit note for lift number{' '}
                                        <span className="font-medium">
                                            {selectedItem.liftNumber}
                                        </span>
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="bg-muted p-4 rounded-md grid gap-3">
                                    <h3 className="text-lg font-bold">Item Details</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <p className="font-medium text-nowrap">Indent Number</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.indentNumber}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-nowrap">Lift Number</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.liftNumber}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Product Name</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.productName}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Vendor Name</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.vendorName}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Quantity</p>
                                            <p className="text-sm font-light">{selectedItem.qty}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Bill Amount</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.billAmount}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    <FormField
                                        control={form.control}
                                        name="debitNoteNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Debit Note Number</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder="Enter debit note number"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    
                                    <FormField
                                        control={form.control}
                                        name="debitNoteCopy"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Debit Note Copy</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="file"
                                                        onChange={(e) =>
                                                            field.onChange(e.target.files?.[0])
                                                        }
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
                                        Send Debit Note
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