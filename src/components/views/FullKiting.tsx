import { useSheets } from '@/context/SheetsContext';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import DataTable from '../element/DataTable';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { PuffLoader as Loader } from 'react-spinners';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Truck } from 'lucide-react';
import Heading from '../element/Heading';
import supabase from '@/SupabaseClient';

interface FullkittingData {
    indent_number: string;
    vendor_name: string;
    product_name: string;
    qty: number;
    bill_no: string;
    transporting_include: string;
    transporter_name: string;
    amount: number;
    firm_name_match: string;
}

export default function FullKitting() {
    const { fullkittingSheet, fullkittingLoading, updateFullkittingSheet } = useSheets();
    const [tableData, setTableData] = useState<FullkittingData[]>([]);
    const [selectedItem, setSelectedItem] = useState<FullkittingData | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { masterSheet } = useSheets();
    const { user } = useAuth();

    useEffect(() => {
        console.log("Fullkitting Sheet:", fullkittingSheet);
        
        // Filter by firm name
        const filteredByFirm = fullkittingSheet.filter(item => 
            user.firm_name_match.toLowerCase() === "all" || item.firm_name_match === user.firm_name_match
        );
        
        setTableData(
            filteredByFirm
                .filter((item) => item.planned && item.planned !== '' && (!item.actual || item.actual === ''))
                .map((item) => ({
                    indent_number: item.indent_number || '',
                    vendor_name: item.vendor_name || '',
                    product_name: item.product_name || '',
                    qty: item.qty || 0,
                    bill_no: item.bill_no || '',
                    transporting_include: item.transporting_include || '',
                    transporter_name: item.transporter_name || '',
                    amount: item.amount || 0,
                    firm_name_match: item.firm_name_match || '',
                }))
        );
    }, [fullkittingSheet, user.firm_name_match]);

    useEffect(() => {
        console.log("Master Sheet:", masterSheet);
        console.log("FMS Names:", masterSheet?.fmsNames);
    }, [masterSheet]);

    const columns: ColumnDef<FullkittingData>[] = [
        {
            header: 'Action',
            cell: ({ row }: { row: Row<FullkittingData> }) => {
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
                            Update
                        </Button>
                    </DialogTrigger>
                );
            },
        },
        { accessorKey: 'indent_number', header: 'Indent Number' },
        { accessorKey: 'firm_name_match', header: 'Firm Name Match' }, 
        { accessorKey: 'vendor_name', header: 'Vendor Name' },
        { accessorKey: 'product_name', header: 'Product Name' },
        { accessorKey: 'qty', header: 'Qty' },
        { accessorKey: 'bill_no', header: 'Bill No.' },
        { accessorKey: 'transporting_include', header: 'Transporting Include' },
        { accessorKey: 'transporter_name', header: 'Transporter Name' },
        { accessorKey: 'amount', header: 'Amount' },
    ];

    const schema = z.object({
        fms_name: z.string().min(1, 'FMS Name is required'),
        status: z.enum(['Yes', 'No'], { required_error: 'Status is required' }),
        vehicle_number: z.string().min(1, 'Vehicle Number is required'),
        from: z.string().min(1, 'From is required'),
        to: z.string().min(1, 'To is required'),
        material_load_details: z.string().optional(),
        bilty_number: z.string().min(1, 'Bilty Number is required'),
        rate_type: z.enum(['Fixed', 'Per MT'], { required_error: 'Rate Type is required' }),
        amount1: z.string().min(1, 'Amount is required'),
        bilty_image: z.instanceof(File).optional(),
    });

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            fms_name: 'Store Fms',
            status: undefined,
            vehicle_number: '',
            from: '',
            to: '',
            material_load_details: '',
            bilty_number: '',
            rate_type: undefined,
            amount1: '',
            bilty_image: undefined,
        },
    });

    useEffect(() => {
        if (!openDialog) {
            form.reset({
                fms_name: 'Store Fms',
                status: undefined,
                vehicle_number: '',
                from: '',
                to: '',
                material_load_details: '',
                bilty_number: '',
                rate_type: undefined,
                amount1: '',
                bilty_image: undefined,
            });
        }
    }, [openDialog, form]);

    async function onSubmit(values: z.infer<typeof schema>) {
        try {
            setIsSubmitting(true);
            const currentDateTime = new Date().toLocaleString("en-CA", { 
      timeZone: "Asia/Kolkata", 
      hour12: false 
    }).replace(',', '');

            let biltyImageUrl = '';
            
            // Upload bilty image to Supabase storage if provided
            if (values.bilty_image) {
                try {
                    const fileExt = values.bilty_image.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const filePath = `bilty-images/${fileName}`;

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('fullkitting-photos')
                        .upload(filePath, values.bilty_image);

                    if (uploadError) throw uploadError;

                    const { data: urlData } = supabase.storage
                        .from('fullkitting-photos')
                        .getPublicUrl(filePath);

                    biltyImageUrl = urlData.publicUrl;
                    console.log('✅ Bilty image uploaded to Supabase:', biltyImageUrl);
                } catch (uploadError) {
                    console.error('❌ Error uploading bilty image:', uploadError);
                    toast.error('Failed to upload bilty image');
                    return;
                }
            }

            // Find matching records in fullkittingSheet
            const filteredData = fullkittingSheet.filter(
                (s) => s.indent_number === selectedItem?.indent_number
            );

            if (filteredData.length === 0) {
                console.error('❌ No matching record found');
                console.log('Looking for indent_number:', selectedItem?.indent_number);
                console.log('Available indent_numbers:', fullkittingSheet.map(s => s.indent_number));
                toast.error('No matching record found in sheet');
                return;
            }

            // Update records directly in Supabase
            const updatePromises = filteredData.map(async (record) => {
                const updateData = {
                    actual: currentDateTime,
                    fms_name: values.fms_name,
                    status: values.status,
                    vehicle_number: values.vehicle_number,
                    from: values.from,
                    to: values.to,
                    material_load_details: values.material_load_details || '',
                    bilty_number: values.bilty_number,
                    rate_type: values.rate_type,
                    amount1: values.amount1,
                    ...(biltyImageUrl && { bilty_image: biltyImageUrl }),
                    // updated_at: new Date().toISOString(),
                };

                // Update using indent_number as the identifier
                const { error } = await supabase
                    .from('fullkitting')
                    .update(updateData)
                    .eq('indent_number', record.indent_number);

                if (error) {
                    console.error(`❌ Error updating record ${record.indent_number}:`, error);
                    throw error;
                }

                console.log(`✅ Record ${record.indent_number} updated successfully`);
                return record.indent_number;
            });

            await Promise.all(updatePromises);
            console.log('✅ All records updated successfully');

            toast.success(`Updated fullkitting for ${selectedItem?.indent_number}`);
            setOpenDialog(false);
            setTimeout(() => updateFullkittingSheet(), 1000);
        } catch (error) {
            console.error('Error updating fullkitting:', error);
            toast.error('Failed to update fullkitting');
        } finally {
            setIsSubmitting(false);
        }
    }

    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    return (
        <div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <Heading heading="Full Kitting" subtext="Manage full kitting details">
                    <Truck size={50} className="text-primary" />
                </Heading>

                <DataTable
                    data={tableData}
                    columns={columns}
                    searchFields={['indent_number', 'product_name', 'vendor_name', 'firm_name_match']}
                    dataLoading={fullkittingLoading}
                />

                {selectedItem && (
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Update Full Kitting</DialogTitle>
                            <DialogDescription>
                                Update details for Indent Number: {selectedItem.indent_number}
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* FMS Name Dropdown */}
                                    <FormField
                                        control={form.control}
                                        name="fms_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>FMS Name</FormLabel>
                                                <Select 
                                                    onValueChange={field.onChange} 
                                                    value={field.value}
                                                    defaultValue="Store Fms"
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Store Fms" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Store Fms">Store Fms</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Status Dropdown */}
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Yes">Yes</SelectItem>
                                                        <SelectItem value="No">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Vehicle Number */}
                                    <FormField
                                        control={form.control}
                                        name="vehicle_number"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Vehicle Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter vehicle number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Bilty Number */}
                                    <FormField
                                        control={form.control}
                                        name="bilty_number"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Bilty Number</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder="Enter bilty number"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* From */}
                                    <FormField
                                        control={form.control}
                                        name="from"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>From</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter source location" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* To */}
                                    <FormField
                                        control={form.control}
                                        name="to"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>To</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter destination location" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Rate Type Dropdown */}
                                    <FormField
                                        control={form.control}
                                        name="rate_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Rate Type</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Rate Type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Fixed">Fixed</SelectItem>
                                                        <SelectItem value="Per MT">Per MT</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Amount */}
                                    <FormField
                                        control={form.control}
                                        name="amount1"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Amount</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="Enter amount"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Material Load Details - Full Width */}
                                <FormField
                                    control={form.control}
                                    name="material_load_details"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Material Load Details</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter material load details"
                                                    {...field}
                                                    rows={3}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Bilty Image - Full Width */}
                                <FormField
                                    control={form.control}
                                    name="bilty_image"
                                    render={({ field: { value, onChange, ...fieldProps } }) => (
                                        <FormItem>
                                            <FormLabel>Bilty Image</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...fieldProps}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(event) => {
                                                        const file = event.target.files?.[0];
                                                        onChange(file);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline" disabled={isSubmitting}>
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader size={20} className="mr-2" />
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit'
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
}