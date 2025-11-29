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
import { Truck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '@/context/AuthContext';
import Heading from '../element/Heading';
import { Pill } from '../ui/pill';
import supabase from '@/SupabaseClient';

interface StoreInPendingData {
    lift_number: string;
    indent_no: string;
    bill_no: string;
    vendor_name: string;
    product_name: string;
    qty: number;
    type_of_bill: string;
    bill_amount: number;
    payment_type: string;
    advance_amount_if_any: string;
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
    quantity: number;
    po_copy: string;
    bill_status: string;
    lead_time_to_lift_material: number;
    discount_amount: number;
    rowIndex?: number;
    firm_name_match: string;
}

type RecieveItemsData = StoreInPendingData;

// File upload function
async function uploadFileToSupabase(file: File, indentNo: string): Promise<string> {
    try {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Invalid file type. Please upload JPEG, PNG, JPG, WEBP, or PDF files.');
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            throw new Error('File size too large. Maximum size is 5MB.');
        }

        // Generate unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${indentNo}_${Date.now()}.${fileExt}`;
        const filePath = `bills/${fileName}`;

        console.log('Uploading file to bucket: bill_image_status');
        console.log('File path:', filePath);

        // Upload to Supabase Storage - bill_image_status bucket
        const { data, error } = await supabase.storage
            .from('bill_image_status') // Your bucket name
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            throw new Error(`Upload failed: ${error.message}`);
        }

        console.log('File uploaded successfully, getting public URL...');

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('bill_image_status')
            .getPublicUrl(filePath);

        console.log('Public URL generated:', publicUrl);

        return publicUrl;

    } catch (error) {
        console.error('File upload error:', error);
        throw error;
    }
}

export default () => {
    const { storeInSheet, updateAll } = useSheets();
    const { user } = useAuth();

    const [tableData, setTableData] = useState<StoreInPendingData[]>([]);
    const [selectedIndent, setSelectedIndent] = useState<StoreInPendingData | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [indentLoading, setIndentLoading] = useState(false);

    // Debug logging
    useEffect(() => {
        console.log("=== BILL STATUS DEBUG ===");
        console.log("Total storeInSheet items:", storeInSheet.length);
        console.log("User firm_name_match:", user.firm_name_match);
        
        if (storeInSheet.length > 0) {
            console.log("First item sample:", storeInSheet[0]);
        }
    }, [storeInSheet, user.firm_name_match]);

    useEffect(() => {
        // Pehle firm name se filter karo (case-insensitive)
        const filteredByFirm = storeInSheet.filter(item => {
            const userFirm = user.firm_name_match?.toLowerCase() || '';
            const itemFirm = item.firm_name_match?.toLowerCase() || '';
            return userFirm === "all" || itemFirm === userFirm;
        });
        
        const pendingItems = filteredByFirm.filter((i) => {
            const hasPlanned = i.planned11 && i.planned11.trim() !== '';
            const hasActual = i.actual11 && i.actual11.trim() !== '';
            const isPending = hasPlanned && !hasActual;
            return isPending;
        });
        
        console.log("Pending items found:", pendingItems.length);
        
        setTableData(pendingItems.map((i) => ({
            lift_number: i.lift_number || '',
            indent_no: i.indent_no || '',
            bill_no: String(i.bill_no) || '',
            vendor_name: i.vendor_name || '',
            product_name: i.product_name || '',
            qty: i.qty || 0,
            type_of_bill: i.type_of_bill || '',
            bill_amount: i.bill_amount || 0,
            payment_type: i.payment_type || '',
            advance_amount_if_any: i.advance_amount_if_any || '',
            photo_of_bill: i.photo_of_bill || '',
            transportation_include: i.transportation_include || '',
            transporter_name: i.transporter_name || '',
            amount: i.amount || 0,
            po_date: i.po_date || '',
            po_number: i.po_number || '',
            vendor: i.vendor || '',
            indent_number: i.indent_no|| '',
            product: i.product || '',
            uom: i.uom || '',
            quantity: i.quantity || 0,
            po_copy: i.po_copy || '',
            bill_status: i.bill_status || '',
            lead_time_to_lift_material: i.lead_time_to_lift_material || 0,
            discount_amount: i.discount_amount || 0,
            firm_name_match: i.firm_name_match || '',
        })));
    }, [storeInSheet, user.firm_name_match]);

    useEffect(() => {
        if (!openDialog) {
            form.reset({ status: undefined, billImageStatus: undefined });
        }
    }, [openDialog]);

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

    const schema = z.object({
        status: z.enum(['ok']),
        billImageStatus: z.instanceof(File).optional().refine((file) => {
            if (!file) return true;
            
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                return false;
            }
            
            // Validate file size
            return file.size <= 5 * 1024 * 1024; // 5MB max
        }, {
            message: 'File must be JPEG, PNG, JPG, WEBP, or PDF and less than 5MB'
        }),
    });

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            status: undefined,
            billImageStatus: undefined,
        },
    });

   const columns: ColumnDef<RecieveItemsData>[] = [
    ...(user.receive_item_view
        ? [
            {
                header: 'Action',
                cell: ({ row }: { row: Row<RecieveItemsData> }) => {
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
                                    Action
                                </Button>
                            </DialogTrigger>
                        </Dialog>
                    );
                },
            },
        ]
        : []),
        { accessorKey: 'lift_number', header: 'Lift Number' },
        { accessorKey: 'indent_no', header: 'Indent No.' },
        { accessorKey: 'po_number', header: 'PO Number' },
        { accessorKey: 'vendor_name', header: 'Vendor Name' },
        { accessorKey: 'firm_name_match', header: 'Firm Name' }, 
        { accessorKey: 'product_name', header: 'Product Name' },
        { accessorKey: 'bill_status', header: 'Bill Status' },
        { accessorKey: 'bill_no', header: 'Bill No.' },
        { accessorKey: 'qty', header: 'Qty' },
        { accessorKey: 'lead_time_to_lift_material', header: 'Lead Time To Lift Material' },
        { accessorKey: 'type_of_bill', header: 'Type Of Bill' },
        { accessorKey: 'bill_amount', header: 'Bill Amount' },
        { accessorKey: 'discount_amount', header: 'Discount Amount' },
        { accessorKey: 'payment_type', header: 'Payment Type' },
        {
            accessorKey: 'advance_amount_if_any',
            header: 'Advance Amount If Any',
            cell: ({ row }) => formatDate(row.original.advance_amount_if_any)
        },
        {
            accessorKey: 'photo_of_bill',
            header: 'Photo Of Bill',
            cell: ({ row }) => {
                const photo = row.original.photo_of_bill;
                return photo && photo.trim() !== '' ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        { accessorKey: 'transportation_include', header: 'Transportation Include' },
        { accessorKey: 'transporter_name', header: 'Transporter Name' },
        { accessorKey: 'amount', header: 'Amount' },
    ];

    async function onSubmit(values: z.infer<typeof schema>) {
        try {
            if (!selectedIndent) {
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

            let bill_image_status = '';

            // Upload image if provided
            if (values.billImageStatus) {
                try {
                    toast.info('Uploading bill image...');
                    console.log('Starting file upload for indent:', selectedIndent.indent_no);
                    
                    bill_image_status = await uploadFileToSupabase(values.billImageStatus, selectedIndent.indent_no);
                    
                    console.log('File uploaded successfully, URL:', bill_image_status);
                    toast.success('Bill image uploaded successfully');
                } catch (uploadError) {
                    console.error('File upload error:', uploadError);
                    // toast.error(`Failed to upload image: ${uploadError.message}`);
                    return;
                }
            }

            // console.log('Updating Supabase table with:', {
            //     indent_no: selectedIndent.indent_no,
            //     actual11: new Date().toLocaleString("en-CA", { 
            //         timeZone: "Asia/Kolkata", 
            //         hour12: false 
            //     }).replace(',', ''),
            //     bill_status_new: values.status,
            //     bill_image_status: bill_image_status
            // });

            // Update Supabase table directly
            const { data, error } = await supabase
                .from('store_in')
                .update({
                    actual11: new Date().toLocaleString("en-CA", { 
                        timeZone: "Asia/Kolkata", 
                        hour12: false 
                    }).replace(',', ''),
                    bill_status_new: values.status,
                    bill_image_status: bill_image_status,
                    // updated_at: new Date().toISOString(),
                })
                .eq('indent_no', selectedIndent.indent_no);

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            console.log('Update successful:', data);
            toast.success(`Bill status updated for ${selectedIndent.indent_no}`);
            setOpenDialog(false);
            setTimeout(() => updateAll(), 1000);

        } catch (err) {
            console.error("Error:", err);
            toast.error('Failed to update bill status');
        }
    }

    function onError(e: any) {
        console.log('Form validation errors:', e);
        if (e.billImageStatus) {
            toast.error(e.billImageStatus.message);
        } else {
            toast.error('Please fill all required fields');
        }
    }

    return (
        <div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <Tabs defaultValue="pending">
                    <Heading
                        heading="Bill Status"
                        subtext="Receive items from purchase orders"
                    >
                        <Truck size={50} className="text-primary" />
                    </Heading>

                    {/* <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pending">
                            Pending ({tableData.length})
                        </TabsTrigger>
                        <TabsTrigger value="history">
                            History (0)
                        </TabsTrigger>
                    </TabsList> */}

                    <TabsContent value="pending">
                        {tableData.length > 0 ? (
                            <DataTable
                                data={tableData}
                                columns={columns}
                                searchFields={[
                                    'lift_number',
                                    'indent_no',
                                    'po_number',
                                    'vendor_name',
                                    'product_name',
                                    'bill_status',
                                    'bill_no',
                                    'type_of_bill',
                                    'transporter_name',
                                ]}
                                dataLoading={indentLoading}
                            />
                        ) : (
                            <div className="text-center p-8 border rounded-lg">
                                <p className="text-muted-foreground">No pending bill status entries found</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="history">
                        <div className="text-center p-8 border rounded-lg">
                            <p className="text-muted-foreground">No history entries found</p>
                        </div>
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
                                    <DialogTitle>Bill Status Update</DialogTitle>
                                    <DialogDescription>
                                        Update bill status for indent{' '}
                                        <span className="font-medium">
                                            {selectedIndent.indent_no}
                                        </span>
                                    </DialogDescription>
                                </DialogHeader>
                                
                                <div className="bg-muted p-4 rounded-md grid gap-3">
                                    <h3 className="text-lg font-bold">Item Details</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="space-y-1">
                                            <p className="font-medium text-nowrap">Indent Number</p>
                                            <p className="text-sm font-light">
                                                {selectedIndent.indent_no}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Product Name</p>
                                            <p className="text-sm font-light">
                                                {selectedIndent.product_name}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Vendor Name</p>
                                            <p className="text-sm font-light">
                                                {selectedIndent.vendor_name}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Bill No</p>
                                            <p className="text-sm font-light">
                                                {selectedIndent.bill_no}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-nowrap">Ordered Quantity</p>
                                            <p className="text-sm font-light">
                                                {selectedIndent.quantity}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-nowrap">UOM</p>
                                            <p className="text-sm font-light">
                                                {selectedIndent.uom}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Bill Amount</p>
                                            <p className="text-sm font-light">
                                                {selectedIndent.bill_amount}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Payment Type</p>
                                            <p className="text-sm font-light">
                                                {selectedIndent.payment_type}
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
                                                <FormLabel>Status</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Set status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="ok">OK</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    {form.watch('status') === 'ok' && (
                                        <FormField
                                            control={form.control}
                                            name="billImageStatus"
                                            render={({ field: { onChange, value, ...field } }) => (
                                                <FormItem>
                                                    <FormLabel>Bill Image (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="file"
                                                            accept=".jpg,.jpeg,.png,.pdf,.webp"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    onChange(file);
                                                                }
                                                            }}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <p className="text-xs text-muted-foreground">
                                                        Accepted: JPG, PNG, WEBP, PDF (Max 5MB)
                                                    </p>
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