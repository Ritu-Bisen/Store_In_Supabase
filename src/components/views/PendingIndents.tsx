import { ListTodo } from 'lucide-react';
import Heading from '../element/Heading';
import { useSheets } from '@/context/SheetsContext';
import { useEffect, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/utils';
import DataTable from '../element/DataTable';
import { useAuth } from '@/context/AuthContext';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Pill } from '../ui/pill';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
    DialogHeader,
    DialogFooter,
    DialogClose,
} from '../ui/dialog';
import { postToSheet } from '@/lib/fetchers';
import { toast } from 'sonner';
import { PuffLoader as Loader } from 'react-spinners';
import supabase from '@/SupabaseClient';

interface PendingIndentsData {
    date: string;
    indentNo: string;
    product: string;
    quantity: number;
    rate: number;
    withTaxOrNot: string;
    uom: string;
    vendorName: string;
    paymentTerm: string;
    specifications: string;
    firmNameMatch: string;
    plannedDate: string;
}

interface HistoryIndentsData {
    date: string;
    indentNo: string;
    product: string;
    quantity: number;
    rate: number;
    withTaxOrNot: string;
    uom: string;
    vendorName: string;
    paymentTerm: string;
    specifications: string;
    firmNameMatch: string;
    poRequired: string;
    poRequiredStatus: 'Yes' | 'No';
    plannedDate: string;
}

export default () => {
    const { indentSheet, indentLoading, updateIndentSheet } = useSheets();
    const { user } = useAuth();

    const [pendingTableData, setPendingTableData] = useState<PendingIndentsData[]>([]);
    const [historyTableData, setHistoryTableData] = useState<HistoryIndentsData[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedIndent, setSelectedIndent] = useState<PendingIndentsData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(()=>{
        console.log("Raw indentSheet data:", indentSheet);
    },[indentSheet])

    // Fetching pending table data - FIXED PROPERTY NAMES
    useEffect(() => {
        // Pehle firm name se filter karo (case-insensitive)
        const filteredByFirm = indentSheet.filter(sheet => 
            user.firm_name_match.toLowerCase() === "all" || sheet.firm_name === user.firm_name_match
        );
        
        setPendingTableData(
            filteredByFirm
                .filter((sheet: any) => {
                    return sheet.status === "Pending" && 
                        sheet.approved_vendor_name && 
                        sheet.approved_vendor_name.toString().trim() !== '' &&
                        (!sheet.po_requred || 
                        sheet.po_requred.toString().trim() === '' || 
                        sheet.po_requred.toString().trim() === 'undefined' ||
                        sheet.po_requred === null);
                })
                .map((sheet: any) => ({
                    date: formatDate(new Date(sheet.timestamp)),
                    indentNo: sheet.indent_number, // FIXED: indent_number
                    firmNameMatch: sheet.firm_name || '',
                    product: sheet.product_name, // FIXED: product_name
                    quantity: sheet.pending_po_qty || 0, // FIXED: pending_po_qty
                    rate: sheet.approved_rate || 0, // FIXED: approved_rate
                    withTaxOrNot: sheet.with_tax_or_not4 || 'Yes', // FIXED: with_tax_or_not4
                    uom: sheet.uom,
                    vendorName: sheet.approved_vendor_name, // FIXED: approved_vendor_name
                    paymentTerm: sheet.approved_payment_term, // FIXED: approved_payment_term
                    specifications: sheet.specifications || '',
                    plannedDate: sheet.planned4 || '',
                }))
                .sort((a, b) => b.indentNo.localeCompare(a.indentNo))
        );
    }, [indentSheet, user.firm_name_match]);

    // Fetching history table data - FIXED PROPERTY NAMES
    useEffect(() => {
        // Pehle firm name se filter karo (case-insensitive)
        const filteredByFirm = indentSheet.filter(sheet => 
            user.firm_name_match.toLowerCase() === "all" || sheet.firm_name === user.firm_name_match
        );
        
        setHistoryTableData(
            filteredByFirm
                .filter((sheet: any) => {
                    return sheet.po_requred && // FIXED: po_requred
                        sheet.po_requred.toString().trim() !== '' &&
                        (sheet.po_requred.toString().trim() === 'Yes' || sheet.po_requred.toString().trim() === 'No');
                })
                .map((sheet: any) => ({
                    date: formatDate(new Date(sheet.timestamp)),
                    indentNo: sheet.indent_number, // FIXED: indent_number
                    firmNameMatch: sheet.firm_name || '',
                    product: sheet.product_name, // FIXED: product_name
                    quantity: sheet.pending_po_qty || sheet.quantity || 0, // FIXED: pending_po_qty
                    rate: sheet.approved_rate || sheet.rate1 || 0, // FIXED: approved_rate
                    withTaxOrNot: sheet.with_tax_or_not4 || sheet.with_tax_or_not1 || 'Yes', // FIXED: with_tax_or_not4
                    uom: sheet.uom,
                    vendorName: sheet.approved_vendor_name || sheet.vendor_name1, // FIXED: approved_vendor_name and vendor_name1
                    paymentTerm: sheet.approved_payment_term || sheet.payment_term1, // FIXED: approved_payment_term and payment_term1
                    specifications: sheet.specifications || '',
                    poRequired: sheet.po_requred, // FIXED: po_requred
                    poRequiredStatus: sheet.po_requred.toString().trim() as 'Yes' | 'No', // FIXED: po_requred
                    plannedDate: sheet.planned4 || '',
                }))
                .sort((a, b) => b.indentNo.localeCompare(a.indentNo))
        );
    }, [indentSheet, user.firm_name_match]);

const handlePoRequired = async (response: 'Yes' | 'No') => {
    if (!selectedIndent) return;

    setIsSubmitting(true);

    try {
        // Find the matching row
        const matchingRow = indentSheet.find(
            (sheet: any) => sheet.indent_number === selectedIndent.indentNo
        );

        if (!matchingRow) {
            toast.error('Indent not found');
            setIsSubmitting(false);
            return;
        }

        // Build update payload
        const updatePayload: any = {
            po_requred: response
        };

        // --- Add actual4 only when po_requred = "No" ---
        if (response === "No") {
            let now = new Date();
            let istDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

            // If Sunday, add +1 day
            if (istDate.getDay() === 0) {
                istDate.setDate(istDate.getDate() + 1);
            }

            // Convert to YYYY-MM-DD HH:mm:ss (Supabase friendly)
            const actual4Timestamp = istDate
                .toLocaleString("en-CA", { hour12: false })
                .replace(",", "");

            updatePayload.actual4 = actual4Timestamp;
        }

        // Update in Supabase
        const { data, error } = await supabase
            .from("indent")
            .update(updatePayload)
            .eq("indent_number", selectedIndent.indentNo);

        if (error) {
            console.error("Supabase error:", error);
            toast.error("Failed to update PO Required status");
            return;
        }

        toast.success(`PO Required status updated to ${response}`);
        setOpenDialog(false);
        setSelectedIndent(null);

        setTimeout(updateIndentSheet, 1000);

    } catch (error) {
        console.error("Error updating PO Required:", error);
        toast.error("Failed to update PO Required status");
    } finally {
        setIsSubmitting(false);
    }
};


    // Creating pending table columns
    const pendingColumns: ColumnDef<PendingIndentsData>[] = [
        {
            header: 'Action',
            cell: ({ row }: { row: any }) => {
                const indent = row.original;
                return (
                    <div>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSelectedIndent(indent);
                                    setOpenDialog(true);
                                }}
                            >
                                PO Required
                            </Button>
                        </DialogTrigger>
                    </div>
                );
            },
        },
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string}</div>
        },
        {
            accessorKey: 'plannedDate',
            header: 'Planned Date',
            cell: ({ getValue }) => {
                const plannedDate = getValue() as string;
                return (
                    <div className="px-2">
                        {plannedDate ? formatDate(new Date(plannedDate)) : '-'}
                    </div>
                );
            }
        },
        {
            accessorKey: 'indentNo',
            header: 'Indent Number',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string}</div>
        },
        {
            accessorKey: 'firmNameMatch',
            header: 'Firm Name',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string}</div>
        },
        {
            accessorKey: 'product',
            header: 'Product',
            cell: ({ getValue }) => (
                <div className="max-w-[120px] break-words whitespace-normal px-1 text-sm">
                    {getValue() as string}
                </div>
            ),
        },
        {
            accessorKey: 'quantity',
            header: 'Pending PO Qty',
            cell: ({ getValue }) => <div className="px-2">{getValue() as number}</div>
        },
        {
            accessorKey: 'rate',
            header: 'Rate',
            cell: ({ row }) => (
                <div className="px-2">
                    &#8377;{row.original.rate}
                </div>
            ),
        },
        {
            accessorKey: 'withTaxOrNot',
            header: 'With Tax or Not',
            cell: ({ getValue }) => {
                const value = getValue() as string;
                return (
                    <div className="px-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            value === 'Yes' 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-orange-100 text-orange-800 border border-orange-200'
                        }`}>
                            {value}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'uom',
            header: 'UOM',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string}</div>
        },
        {
            accessorKey: 'vendorName',
            header: 'Vendor Name',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string}</div>
        },
        {
            accessorKey: 'paymentTerm',
            header: 'Payment Term',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string}</div>
        },
        {
            accessorKey: 'specifications',
            header: 'Specifications',
            cell: ({ getValue }) => (
                <div className="max-w-[150px] break-words whitespace-normal px-2 text-sm">
                    {getValue() as string}
                </div>
            ),
        },
    ];

    // Creating history table columns
    const historyColumns: ColumnDef<HistoryIndentsData>[] = [
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string}</div>
        },
        {
            accessorKey: 'plannedDate',
            header: 'Planned Date',
            cell: ({ getValue }) => {
                const plannedDate = getValue() as string;
                return (
                    <div className="px-2">
                        {plannedDate ? formatDate(new Date(plannedDate)) : '-'}
                    </div>
                );
            }
        },
        {
            accessorKey: 'indentNo',
            header: 'Indent Number',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string}</div>
        },
        {
            accessorKey: 'firmNameMatch',
            header: 'Firm Name',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string}</div>
        },
        {
            accessorKey: 'product',
            header: 'Product',
            cell: ({ getValue }) => (
                <div className="max-w-[120px] break-words whitespace-normal px-1 text-sm">
                    {getValue() as string}
                </div>
            ),
        },
        {
            accessorKey: 'quantity',
            header: 'Pending PO Qty',
            cell: ({ getValue }) => <div className="px-2">{getValue() as number}</div>
        },
        {
            accessorKey: 'rate',
            header: 'Rate',
            cell: ({ row }) => (
                <div className="px-2">
                    &#8377;{row.original.rate}
                </div>
            ),
        },
        {
            accessorKey: 'withTaxOrNot',
            header: 'With Tax or Not',
            cell: ({ getValue }) => {
                const value = getValue() as string;
                return (
                    <div className="px-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            value === 'Yes' 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-orange-100 text-orange-800 border border-orange-200'
                        }`}>
                            {value}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'uom',
            header: 'UOM',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string}</div>
        },
        {
            accessorKey: 'vendorName',
            header: 'Vendor Name',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string}</div>
        },
        {
            accessorKey: 'paymentTerm',
            header: 'Payment Term',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string}</div>
        },
        {
            accessorKey: 'specifications',
            header: 'Specifications',
            cell: ({ getValue }) => (
                <div className="max-w-[150px] break-words whitespace-normal px-2 text-sm">
                    {getValue() as string}
                </div>
            ),
        },
        {
            accessorKey: 'poRequiredStatus',
            header: 'PO Required',
            cell: ({ row }) => {
                const status = row.original.poRequiredStatus;
                
                if (status === 'No') {
                    return (
                        <div className="px-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                {status}
                            </span>
                        </div>
                    );
                } else {
                    return (
                        <div className="px-2">
                            <Pill variant="primary">{status}</Pill>
                        </div>
                    );
                }
            },
        },
    ];

    return (
        <div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <Tabs defaultValue="pending">
                    <Heading
                        heading="Pending POs"
                        subtext="View pending purchase orders and history"
                        tabs
                    >
                        <ListTodo size={50} className="text-primary" />
                    </Heading>
                    
                    <TabsContent value="pending">
                        <DataTable
                            data={pendingTableData}
                            columns={pendingColumns}
                            searchFields={['product', 'vendorName', 'paymentTerm', 'specifications','firmNameMatch']}
                            dataLoading={indentLoading}
                            className="h-[80dvh]"
                        />
                    </TabsContent>

                    <TabsContent value="history">
                        <DataTable
                            data={historyTableData}
                            columns={historyColumns}
                            searchFields={['product', 'vendorName', 'paymentTerm', 'specifications','firmNameMatch']}
                            dataLoading={indentLoading}
                            className="h-[80dvh]"
                        />
                    </TabsContent>
                </Tabs>

                {selectedIndent && (
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>PO Required Confirmation</DialogTitle>
                            <DialogDescription>
                                Please confirm PO requirement for this indent
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-3 bg-muted py-3 px-4 rounded-md">
                            <div className="space-y-1">
                                <p className="font-medium text-sm">Indent Number</p>
                                <p className="text-sm font-light">{selectedIndent.indentNo}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium text-sm">Firm Name</p>
                                <p className="text-sm font-light">{selectedIndent.firmNameMatch}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium text-sm">Vendor Name</p>
                                <p className="text-sm font-light">{selectedIndent.vendorName}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium text-sm">Product</p>
                                <p className="text-sm font-light">{selectedIndent.product}</p>
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <DialogClose asChild>
                                <Button variant="outline" disabled={isSubmitting}>
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button 
                                variant="destructive"
                                onClick={() => handlePoRequired('No')}
                                disabled={isSubmitting}
                            >
                                {isSubmitting && <Loader size={16} color="white" className="mr-2" />}
                                No
                            </Button>
                            <Button 
                                variant="default"
                                onClick={() => handlePoRequired('Yes')}
                                disabled={isSubmitting}
                            >
                                {isSubmitting && <Loader size={16} color="white" className="mr-2" />}
                                Yes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
};