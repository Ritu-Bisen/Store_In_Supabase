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
import { Textarea } from '../ui/textarea';
import type { StoreInSheet } from '@/types';
import { Truck } from 'lucide-react';
import { Tabs, TabsContent } from '../ui/tabs';
import { useAuth } from '@/context/AuthContext';
import Heading from '../element/Heading';
import { formatDate } from '@/lib/utils';
import supabase from '@/SupabaseClient'; // Import Supabase client

interface StoreInPendingData {
    lift_number: string;
    indent_no: string;
    bill_no: string;
    vendor_name: string;
    product_name: string;
    type_of_bill: string;
    bill_amount: number;
    payment_type: string;
    advance_amount_if_any: number;
    photo_of_bill: string;
    transportation_include: string;
    transporter_name: string;
    amount: number;
    po_date: string;
    po_number: string;
    vendor: string;
    indent_number: string;
    product: string;
    uom: string;
    qty: number;
    po_copy: string;
    bill_status: string;
    lead_time_to_lift_material: number;
    discount_amount: number;
    firm_name_match: string;
}

interface StoreInHistoryData {
    lift_number: string;
    indent_no: string;
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
    bill_status: string;
    photo_of_product: string;
    unitOfMeasurement: string;
    damage_order: string;
    quantity_as_per_bill: number;
    priceAsPerPo: number;
    remark: string;
    po_date: string;
    po_number: string;
    receiving_status: string;
    vendor: string;
    product: string;
    order_quantity: number;
    received_date: string;
    warranty_status: string;
    end_date_warrenty: string;
    bill_number: string;
    any_transport: string;
    transporting_amount: number;
    timestamp: string;
    lead_time_to_lift_material: number;
    discount_amount: number;
    bill_received: string;
    bill_image: string;
    firm_name_match: string;
}

type RecieveItemsData = StoreInPendingData;
type HistoryData = StoreInHistoryData;

export default () => {
    const { storeInSheet, updateAll } = useSheets();
    const { user } = useAuth();

    const [tableData, setTableData] = useState<StoreInPendingData[]>([]);
    const [historyData, setHistoryData] = useState<StoreInHistoryData[]>([]);
    const [selectedIndent, setSelectedIndent] = useState<StoreInPendingData | null>(null);
    const [openDialog, setOpenDialog] = useState(false);

    const [indentLoading, setIndentLoading] = useState(false);
    const [receivedLoading, setReceivedLoading] = useState(false);

    // Debug: Log the raw storeInSheet data
    useEffect(() => {
        console.log('📦 Raw storeInSheet data:', storeInSheet);
        console.log('👤 Current user firm:', user.firm_name_match);
    }, [storeInSheet, user.firm_name_match]);

    // Fetching table data
    useEffect(() => {
        if (!storeInSheet || storeInSheet.length === 0) {
            console.log('❌ No storeInSheet data available');
            setTableData([]);
            return;
        }

        const filteredByFirm = storeInSheet.filter((item: StoreInSheet) =>
            user.firm_name_match.toLowerCase() === "all" || item.firm_name_match === user.firm_name_match
        );

        console.log('🏢 Filtered by firm:', filteredByFirm.length, 'items');

        // Check for planned6 and actual6 properly
        const pendingItems = filteredByFirm.filter((i: StoreInSheet) => {
            const hasPlanned6 = i.planned6 && i.planned6.trim() !== '';
            const hasActual6 = i.actual6 && i.actual6.trim() !== '';
            const isPending = hasPlanned6 && !hasActual6;
            
            console.log(`📋 Item ${i.lift_number}: planned6="${i.planned6}", actual6="${i.actual6}", isPending=${isPending}`);
            return isPending;
        });

        console.log('⏳ Pending items found:', pendingItems.length);

        const transformedData = pendingItems.map((i: StoreInSheet) => ({
            lift_number: i.lift_number || '',
            indent_no: i.indent_no || '',
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
            po_date: i.po_date || '',
            po_number: i.po_number || '',
            vendor: i.vendor || '',
            indent_number: i.indent_no || '',
            product: i.product || '',
            uom: i.uom || '',
            po_copy: i.po_copy || '',
            bill_status: i.bill_status || '',
            lead_time_to_lift_material: i.lead_time_to_lift_material || 0,
            discount_amount: i.discount_amount || 0,
            firm_name_match: i.firm_name_match || '',
        }));

        console.log('✅ Final table data:', transformedData);
        setTableData(transformedData);
    }, [storeInSheet, user.firm_name_match]);

    // History data
    useEffect(() => {
        if (!storeInSheet || storeInSheet.length === 0) {
            setHistoryData([]);
            return;
        }

        const filteredByFirm = storeInSheet.filter((item: StoreInSheet) =>
            user.firm_name_match.toLowerCase() === "all" || item.firm_name_match === user.firm_name_match
        );

        // Check for actual6 properly
        const historyItems = filteredByFirm.filter((i: StoreInSheet) => 
            i.actual6 && i.actual6.trim() !== ''
        );

        console.log('📜 History items found:', historyItems.length);

        const transformedHistory = historyItems.map((i: StoreInSheet) => ({
            lift_number: i.lift_number || '',
            indent_no: i.indent_no || '',
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
            bill_status: i.bill_status || '',
            received_quantity: i.received_quantity || 0,
            photo_of_product: i.photo_of_product || '',
            unitOfMeasurement: i.unitOfMeasurement || '',
            damage_order: i.damage_order || '',
            quantity_as_per_bill: i.quantity_as_per_bill || 0,
            priceAsPerPo: i.priceAsPerPo || 0,
            remark: i.remark || '',
            po_date: i.po_date || '',
            po_number: i.po_number || '',
            receiving_status: i.receiving_status || '',
            vendor: i.vendor_name || '',
            product: i.product_name || '',
            order_quantity: i.qty || 0,
            received_date: i.timestamp ? formatDate(new Date(i.timestamp)) : '',
            warranty_status: i.warranty_status || '',
            end_date_warrenty: i.end_date_warrenty || '',
            bill_number: i.bill_no || '',
            any_transport: i.transportation_include || '',
            transporting_amount: i.amount || 0,
            timestamp: i.timestamp ? formatDate(new Date(i.timestamp)) : '',
            lead_time_to_lift_material: i.lead_time_to_lift_material || 0,
            discount_amount: i.discount_amount || 0,
            bill_received: i.bill_status || '',
            bill_image: i.photo_of_bill || '',
            firm_name_match: i.firm_name_match || '',
        }));

        setHistoryData(transformedHistory);
    }, [storeInSheet, user.firm_name_match]);

    const columns: ColumnDef<RecieveItemsData>[] = [
        ...(user.receive_item_view
            ? [
                {
                    header: 'Action',
                    cell: ({ row }: { row: Row<RecieveItemsData> }) => {
                        const indent = row.original;
                        return (
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedIndent(indent);
                                        setOpenDialog(true);
                                    }}
                                >
                                    Store In
                                </Button>
                            </DialogTrigger>
                        );
                    },
                },
            ]
            : []),
        { accessorKey: 'lift_number', header: 'Lift Number' },
        { accessorKey: 'indent_no', header: 'Indent No.' },
        { accessorKey: 'po_number', header: 'PO Number' },
        { accessorKey: 'vendor_name', header: 'Vendor Name' },
        { accessorKey: 'product_name', header: 'Product Name' },
        { accessorKey: 'firm_name_match', header: 'Firm Name' },
        { accessorKey: 'bill_status', header: 'Bill Status' },
        { accessorKey: 'bill_no', header: 'Bill No.' },
        { accessorKey: 'qty', header: 'Qty' },
        { accessorKey: 'lead_time_to_lift_material', header: 'Lead Time To Lift Material' },
        { accessorKey: 'type_of_bill', header: 'Type Of Bill' },
        { accessorKey: 'bill_amount', header: 'Bill Amount' },
        { accessorKey: 'discount_amount', header: 'Discount Amount' },
        { accessorKey: 'payment_type', header: 'Payment Type' },
        { accessorKey: 'advance_amount_if_any', header: 'Advance Amount If Any' },
        {
            accessorKey: 'photo_of_bill',
            header: 'Photo Of Bill',
            cell: ({ row }) => {
                const photo = row.original.photo_of_bill;
                return photo ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer">
                        View
                    </a>
                ) : null;
            },
        },
        { accessorKey: 'transportation_include', header: 'Transportation Include' },
        { accessorKey: 'transporter_name', header: 'Transporter Name' },
        { accessorKey: 'amount', header: 'Amount' },
    ];

    const historyColumns: ColumnDef<HistoryData>[] = [
        { accessorKey: 'timestamp', header: 'Timestamp' },
        { accessorKey: 'lift_number', header: 'Lift Number' },
        { accessorKey: 'indent_no', header: 'Indent No.' },
        { accessorKey: 'po_number', header: 'PO Number' },
        { accessorKey: 'firm_name_match', header: 'Firm Name' },
        { accessorKey: 'vendor_name', header: 'Vendor Name' },
        { accessorKey: 'product_name', header: 'Product Name' },
        { accessorKey: 'bill_status', header: 'Bill Status' },
        { accessorKey: 'bill_no', header: 'Bill No.' },
        { accessorKey: 'qty', header: 'Qty' },
        { accessorKey: 'lead_time_to_lift_material', header: 'Lead Time To Lift Material' },
        { accessorKey: 'type_of_bill', header: 'Type Of Bill' },
        { accessorKey: 'bill_amount', header: 'Bill Amount' },
        { accessorKey: 'discount_amount', header: 'Discount Amount' },
        { accessorKey: 'payment_type', header: 'Payment Type' },
        { accessorKey: 'advance_amount_if_any', header: 'Advance Amount If Any' },
        {
            accessorKey: 'photo_of_bill',
            header: 'Photo Of Bill',
            cell: ({ row }) => {
                const photo = row.original.photo_of_bill;
                return photo ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer">
                        View
                    </a>
                ) : null;
            },
        },
        { accessorKey: 'transportation_include', header: 'Transportation Include' },
        { accessorKey: 'transporter_name', header: 'Transporter Name' },
        { accessorKey: 'amount', header: 'Amount' },
        { accessorKey: 'receiving_status', header: 'Receiving Status' },
        { accessorKey: 'received_quantity', header: 'Received Quantity' },
        {
            accessorKey: 'photo_of_product',
            header: 'Photo Of Product',
            cell: ({ row }) => {
                const photo = row.original.photo_of_product;
                return photo ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer">
                        View
                    </a>
                ) : null;
            },
        },
        { accessorKey: 'warranty_status', header: 'Warranty' },
        { accessorKey: 'end_date_warrenty', header: 'End Date Warranty' },
        { accessorKey: 'bill_received', header: 'Bill Received' },
        { accessorKey: 'bill_number', header: 'Bill Number' },
        { accessorKey: 'bill_amount', header: 'Bill Amount' },
        {
            accessorKey: 'bill_image',
            header: 'Bill Image',
            cell: ({ row }) => {
                const photo = row.original.photo_of_bill;
                return photo ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer">
                        View
                    </a>
                ) : null;
            },
        },
        { accessorKey: 'damage_order', header: 'Damage Order' },
        { accessorKey: 'quantity_as_per_bill', header: 'Quantity As Per Bill' },
        { accessorKey: 'priceAsPerPo', header: 'Price As Per Po' },
        { accessorKey: 'remark', header: 'Remark' },
    ];

    const schema = z.object({
        status: z.enum(['Received']),
        qty: z.coerce.number().min(1, 'Quantity is required'),
        photoOfProduct: z.instanceof(File).optional(),
        damage_order: z.enum(['Yes', 'No']),
        quantity_as_per_bill: z.enum(['Yes', 'No']),
        remark: z.string().optional(),
    });

    type FormValues = z.infer<typeof schema>;

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            status: 'Received',
            qty: 0,
            photoOfProduct: undefined,
            damage_order: undefined,
            quantity_as_per_bill: undefined,
            remark: '',
        },
    });

    const status = form.watch('status');

    useEffect(() => {
        if (!openDialog) {
            form.reset({
                status: 'Received',
                qty: 0,
                photoOfProduct: undefined,
                damage_order: undefined,
                quantity_as_per_bill: undefined,
                remark: '',
            });
        }
    }, [openDialog, form]);

    async function onSubmit(values: FormValues) {
        try {
            let photoUrl = '';
            
            // Upload image to Supabase storage if provided
            if (values.photoOfProduct) {
                try {
                    const fileExt = values.photoOfProduct.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const filePath = `product-photos/${fileName}`;

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('photo_of_product')
                        .upload(filePath, values.photoOfProduct);

                    if (uploadError) throw uploadError;

                    const { data: urlData } = supabase.storage
                        .from('photo_of_product')
                        .getPublicUrl(filePath);

                    photoUrl = urlData.publicUrl;
                    console.log('✅ Photo uploaded to Supabase:', photoUrl);
                } catch (uploadError) {
                    console.error('❌ Error uploading photo:', uploadError);
                    toast.error('Failed to upload product photo');
                    return;
                }
            }

            const currentDateTime =new Date().toLocaleString("en-CA", { 
      timeZone: "Asia/Kolkata", 
      hour12: false 
    }).replace(',', '');

            const filteredData = storeInSheet.filter(
                (s: StoreInSheet) => s.lift_number === selectedIndent?.lift_number
            );

            if (filteredData.length === 0) {
                console.error('❌ No matching record found');
                console.log('Looking for lift_number:', selectedIndent?.lift_number);
                console.log('Available lift_numbers:', storeInSheet.map(s => s.lift_number));
                toast.error('No matching record found in sheet');
                return;
            }

            // Update records directly in Supabase
            const updatePromises = filteredData.map(async (record) => {
                const updateData = {
                    actual6: currentDateTime,
                    receiving_status: values.status,
                    received_quantity: values.qty,
                    damage_order: values.damage_order,
                    quantity_as_per_bill: values.quantity_as_per_bill,
                    remark: values.remark,
                    ...(photoUrl && { photo_of_product: photoUrl }),
                   planned7: new Date().toLocaleString("en-CA", { 
      timeZone: "Asia/Kolkata", 
      hour12: false 
    }).replace(',', ''),
                };

                // Update using lift_number as the identifier
                const { error } = await supabase
                    .from('store_in')
                    .update(updateData)
                    .eq('lift_number', record.lift_number);

                if (error) {
                    console.error(`❌ Error updating record ${record.lift_number}:`, error);
                    throw error;
                }

                console.log(`✅ Record ${record.lift_number} updated successfully`);
                return record.lift_number;
            });

            await Promise.all(updatePromises);
            console.log('✅ All records updated successfully');

            toast.success(`Stored in successfully`);
            setOpenDialog(false);
            setTimeout(() => updateAll(), 1000);
        } catch (error) {
            console.error('Error in onSubmit:', error);
            toast.error('Failed to store in');
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
                        heading="Receive Items"
                        subtext="Receive items from purchase orders"
                        tabs
                    >
                        <Truck size={50} className="text-primary" />
                    </Heading>

                    {/* <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Debug Info:</strong> Showing {tableData.length} pending items and {historyData.length} history items
                        </p>
                    </div> */}

                    <TabsContent value="pending">
                        <DataTable
                            data={tableData}
                            columns={columns}
                            searchFields={['product_name', 'bill_no', 'indent_no']}
                            dataLoading={indentLoading}
                        />
                    </TabsContent>
                    <TabsContent value="history">
                        <DataTable
                            data={historyData}
                            columns={historyColumns}
                            searchFields={['product_name', 'bill_no', 'indent_no', 'vendor_name']}
                            dataLoading={receivedLoading}
                        />
                    </TabsContent>
                </Tabs>

                {selectedIndent && (
                    <DialogContent className="sm:max-w-3xl">
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit, onError)}
                                className="space-y-5"
                            >
                                <DialogHeader className="space-y-1">
                                    <DialogTitle>Store In</DialogTitle>
                                    <DialogDescription>
                                        Store In from indent{' '}
                                        <span className="font-medium">
                                            {selectedIndent.indent_no}
                                        </span>
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="bg-muted p-4 rounded-md grid gap-3">
                                    <h3 className="text-lg font-bold">Item Details</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 bg-muted rounded-md gap-3 ">
                                        <div className="space-y-1">
                                            <p className="font-medium text-nowrap">Indent Number</p>
                                            <p className="text-sm font-light">
                                                {selectedIndent.indent_no}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Item Name</p>
                                            <p className="text-sm font-light">
                                                {selectedIndent.product_name}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-nowrap">
                                                Lifiting Quantity
                                            </p>
                                            <p className="text-sm font-light">
                                                {selectedIndent.qty}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-nowrap">UOM</p>
                                            <p className="text-sm font-light">
                                                {selectedIndent.uom}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                   <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Receiving Status</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        disabled={true}
                                                        readOnly
                                                        className="bg-gray-100 cursor-not-allowed"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="qty"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Received Quantity</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="Enter received quantity"
                                                        disabled={status !== 'Received'}
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="photoOfProduct"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Photo of Product</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="file"
                                                    disabled={status !== 'Received'}
                                                    onChange={(e) =>
                                                        field.onChange(e.target.files?.[0])
                                                    }
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="damage_order"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Damage Order</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select" />
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

                                    <FormField
                                        control={form.control}
                                        name="quantity_as_per_bill"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Quantity As Per Bill</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select" />
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
                                    <FormField
                                        control={form.control}
                                        name="remark"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Remark</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        className="w-full"
                                                        rows={3}
                                                        placeholder="Enter remark"
                                                        {...field}
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
                                        Store In
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