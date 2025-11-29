import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { ClipLoader as Loader } from 'react-spinners';
import { ClipboardList, Trash, Search } from 'lucide-react';
import { postToSheet, uploadFile } from '@/lib/fetchers';
import type { IndentSheet } from '@/types';
import { useSheets } from '@/context/SheetsContext';
import Heading from '../element/Heading';
import { useEffect, useState } from 'react';
import supabase from '@/SupabaseClient';

// Search state interface
interface SearchTerms {
    department: string;
    groupHead: string;
    productName: string;
    uom: string;
    firmName: string;
}

export default () => {
    const { indentSheet: sheet, updateIndentSheet, masterSheet: options } = useSheets();
    const [indentSheet, setIndentSheet] = useState<IndentSheet[]>([]);
    const [searchTerms, setSearchTerms] = useState<SearchTerms>({
        department: '',
        groupHead: '',
        productName: '',
        uom: '',
        firmName: ''
    });

    useEffect(() => {
        setIndentSheet(sheet || []);
    }, [sheet]);

    const schema = z.object({
        indenterName: z.string().min(1, 'Indenter name is required'),
        indentStatus: z.enum(['Critical', 'None Critical'], {
            required_error: 'Select indent status',
        }),
        products: z
            .array(
                z.object({
                    department: z.string().min(1, 'Department is required'),
                    groupHead: z.string().min(1, 'Group head is required'),
                    productName: z.string().min(1, 'Product name is required'),
                    quantity: z.coerce.number().gt(0, 'Must be greater than 0'),
                    uom: z.string().min(1, 'UOM is required'),
                    firmName: z.string().min(1, 'Firm name is required'),
                    areaOfUse: z.string().min(1, 'Area of use is required'),
                    numberOfDays: z.coerce.number().gt(0, 'Must be greater than 0'),
                    attachment: z.instanceof(File).optional(),
                    specifications: z.string().optional(),
                })
            )
            .min(1, 'At least one product is required'),
    });

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            indenterName: '',
            indentStatus: undefined,
            products: [
                {
                    attachment: undefined,
                    uom: '',
                    firmName: '',
                    productName: '',
                    specifications: '',
                    quantity: 1,
                    areaOfUse: '',
                    numberOfDays: 1,
                    groupHead: '',
                    department: '',
                },
            ],
        },
    });

    const products = form.watch('products');
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'products',
    });

    // Handle search term updates
    const handleSearchChange = (field: keyof SearchTerms, value: string) => {
        setSearchTerms(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Get next indent number
    const getNextIndentNumber = (existingIndents: IndentSheet[]): string => {
        if (!Array.isArray(existingIndents) || existingIndents.length === 0) {
            return 'SI-0001';
        }

        const availableNumbers = existingIndents
            .filter((indent) => indent.indent_number && typeof indent.indent_number === 'string')
            .map((indent) => indent.indent_number!)
            .filter((num) => /^SI-\d+$/.test(num))
            .map((num) => parseInt(num.split('-')[1], 10));

        if (availableNumbers.length === 0) return 'SI-0001';

        const lastIndentNumber = Math.max(...availableNumbers);
        return `SI-${String(lastIndentNumber + 1).padStart(4, '0')}`;
    };



async function onSubmit(data: z.infer<typeof schema>) {
    try {
        // Refresh data first if needed
        await updateIndentSheet();
        
        // Wait for state update
        await new Promise((resolve) => setTimeout(resolve, 500));

        const nextIndentNumber = getNextIndentNumber(indentSheet);
        const rows: Partial<IndentSheet>[] = [];

        for (const product of data.products) {
            let attachmentUrl = '';

            // Handle file upload to Supabase storage
            if (product.attachment && product.attachment instanceof File) {
                try {
                    // Generate unique file name
                    const fileExt = product.attachment.name.split('.').pop();
                    const fileName = `${nextIndentNumber}_${Date.now()}.${fileExt}`;
                    
                    // Upload to Supabase storage
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('indent_attachment')
                        .upload(fileName, product.attachment);

                    if (uploadError) {
                        throw uploadError;
                    }

                    // Get public URL
                    const { data: urlData } = supabase.storage
                        .from('indent_attachment')
                        .getPublicUrl(fileName);

                    attachmentUrl = urlData.publicUrl;
                } catch (uploadError) {
                    console.error('File upload failed:', uploadError);
                    attachmentUrl = 'Upload Failed';
                }
            }
const now = new Date();
const isSunday = now.getDay() === 0;

            const row: Partial<IndentSheet> = {
                timestamp: new Date().toLocaleString("en-CA", { 
      timeZone: "Asia/Kolkata", 
      hour12: false 
    }).replace(',', ''),
                // indent_number: nextIndentNumber,
                indenter_name: data.indenterName,
                department: product.department,
                area_of_use: product.areaOfUse,
                group_head: product.groupHead,
                product_name: product.productName,
                quantity: product.quantity,
                uom: product.uom,
                firm_name: product.firmName,
                specifications: product.specifications || '',
                indent_status: data.indentStatus,
                no_day: product.numberOfDays,
                attachment: attachmentUrl,
                
             planned1: isSunday 
  ? new Date(now.setDate(now.getDate() + 1)).toLocaleString("en-CA", { 
      timeZone: "Asia/Kolkata", 
      hour12: false 
    }).replace(',', '')
  : now.toLocaleString("en-CA", { 
      timeZone: "Asia/Kolkata", 
      hour12: false 
    }).replace(',', ''),
              
            };

            rows.push(row);
        }

        // Insert into Supabase table
        const { data: insertData, error: insertError } = await supabase
            .from('indent')
            .insert(rows);

        if (insertError) {
            throw insertError;
        }

        // Refresh the local data
        setTimeout(() => updateIndentSheet(), 1000);

        toast.success('Indent created successfully');

        // Reset form
        form.reset({
            indenterName: '',
            indentStatus: undefined,
            products: [
                {
                    attachment: undefined,
                    uom: '',
                    firmName: '',
                    productName: '',
                    specifications: '',
                    quantity: 1,
                    areaOfUse: '',
                    numberOfDays: 1,
                    groupHead: '',
                    department: '',
                },
            ],
        });

        // Reset search terms
        setSearchTerms({
            department: '',
            groupHead: '',
            productName: '',
            uom: '',
            firmName: ''
        });

    } catch (error) {
        console.error('Error in onSubmit:', error);
        toast.error('Error while creating indent! Please try again');
    }
}

    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    // Common search input component
    const SearchInput = ({ 
        value, 
        onChange, 
        placeholder 
    }: { 
        value: string; 
        onChange: (value: string) => void; 
        placeholder: string; 
    }) => (
        <div className="flex items-center border-b px-3 pb-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="flex h-10 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
        </div>
    );

    return (
        <div>
            <Heading heading="Indent Form" subtext="Create new Indent">
                <ClipboardList size={50} className="text-primary" />
            </Heading>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6 p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <FormField
                            control={form.control}
                            name="indenterName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Indenter Name
                                        <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter indenter name" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="indentStatus"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Indent Status
                                        <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Critical">Critical</SelectItem>
                                            <SelectItem value="None Critical">
                                                None Critical
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Products</h2>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    append({
                                        department: '',
                                        groupHead: '',
                                        productName: '',
                                        quantity: 1,
                                        uom: '',
                                        firmName: '',
                                        areaOfUse: '',
                                        numberOfDays: 1,
                                        attachment: undefined,
                                        specifications: '',
                                    })
                                }
                            >
                                Add Product
                            </Button>
                        </div>

                        {fields.map((field, index) => {
                            const groupHead = products[index]?.groupHead;
                            const productOptions = options?.groupHeads[groupHead] || [];

                            return (
                                <div
                                    key={field.id}
                                    className="flex flex-col gap-4 border p-4 rounded-lg"
                                >
                                    <div className="flex justify-between">
                                        <h3 className="text-md font-semibold">
                                            Product {index + 1}
                                        </h3>
                                        <Button
                                            variant="destructive"
                                            type="button"
                                            onClick={() => fields.length > 1 && remove(index)}
                                            disabled={fields.length === 1}
                                        >
                                            <Trash />
                                        </Button>
                                    </div>
                                    <div className="grid gap-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Department Field */}
                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.department`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Location
                                                            <span className="text-destructive">*</span>
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Select department" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SearchInput
                                                                    value={searchTerms.department}
                                                                    onChange={(value) => handleSearchChange('department', value)}
                                                                    placeholder="Search departments..."
                                                                />
                                                                {options?.departments
                                                                    ?.filter((dep) =>
                                                                        dep.toLowerCase().includes(searchTerms.department.toLowerCase())
                                                                    )
                                                                    .map((dep, i) => (
                                                                        <SelectItem key={i} value={dep}>
                                                                            {dep}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Group Head Field */}
                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.groupHead`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Group Head
                                                            <span className="text-destructive">*</span>
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Select group head" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SearchInput
                                                                    value={searchTerms.groupHead}
                                                                    onChange={(value) => handleSearchChange('groupHead', value)}
                                                                    placeholder="Search group heads..."
                                                                />
                                                                {Object.keys(options?.groupHeads || {})
                                                                    .filter((dep) =>
                                                                        dep.toLowerCase().includes(searchTerms.groupHead.toLowerCase())
                                                                    )
                                                                    .map((dep, i) => (
                                                                        <SelectItem key={i} value={dep}>
                                                                            {dep}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Area of Use Field */}
                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.areaOfUse`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Area Of Use
                                                            <span className="text-destructive">*</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter area of use"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Product Name Field */}
                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.productName`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Product Name
                                                            <span className="text-destructive">*</span>
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                            disabled={!groupHead}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Select product" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SearchInput
                                                                    value={searchTerms.productName}
                                                                    onChange={(value) => handleSearchChange('productName', value)}
                                                                    placeholder="Search products..."
                                                                />
                                                                {productOptions
                                                                    .filter((dep) =>
                                                                        dep.toLowerCase().includes(searchTerms.productName.toLowerCase())
                                                                    )
                                                                    .map((dep, i) => (
                                                                        <SelectItem key={i} value={dep}>
                                                                            {dep}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Quantity Field */}
                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.quantity`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Quantity
                                                            <span className="text-destructive">*</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                {...field}
                                                                disabled={!groupHead}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            {/* UOM Field */}
                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.uom`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            UOM
                                                            <span className="text-destructive">*</span>
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                            disabled={!groupHead}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Select UOM" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SearchInput
                                                                    value={searchTerms.uom}
                                                                    onChange={(value) => handleSearchChange('uom', value)}
                                                                    placeholder="Search UOM..."
                                                                />
                                                                {(options?.uoms || [])
                                                                    .filter((uom) =>
                                                                        uom.toLowerCase().includes(searchTerms.uom.toLowerCase())
                                                                    )
                                                                    .map((uom, i) => (
                                                                        <SelectItem key={i} value={uom}>
                                                                            {uom}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Number of Days Field */}
                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.numberOfDays`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Numbers of Days
                                                            <span className="text-destructive">*</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                {...field}
                                                                disabled={!groupHead}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Firm Name Field */}
                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.firmName`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Firm Name
                                                            <span className="text-destructive">*</span>
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                            disabled={!groupHead}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Select Firm Name" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SearchInput
                                                                    value={searchTerms.firmName}
                                                                    onChange={(value) => handleSearchChange('firmName', value)}
                                                                    placeholder="Search Firm Name..."
                                                                />
                                                                {(options?.firms || [])
                                                                    .filter((firm) =>
                                                                        firm.toLowerCase().includes(searchTerms.firmName.toLowerCase())
                                                                    )
                                                                    .map((firm, i) => (
                                                                        <SelectItem key={i} value={firm}>
                                                                            {firm}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Attachment Field */}
                                        <FormField
                                            control={form.control}
                                            name={`products.${index}.attachment`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Attachment</FormLabel>
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

                                        {/* Specifications Field */}
                                        <FormField
                                            control={form.control}
                                            name={`products.${index}.specifications`}
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <FormLabel>Specifications</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Enter specifications"
                                                            className="resize-y"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div>
                        <Button
                            className="w-full"
                            type="submit"
                            disabled={form.formState.isSubmitting}
                        >
                            {form.formState.isSubmitting && (
                                <Loader size={20} color="white" aria-label="Loading Spinner" />
                            )}
                            Create Indent
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};