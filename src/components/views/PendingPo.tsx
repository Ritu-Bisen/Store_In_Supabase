import { CheckCircle } from 'lucide-react';
import Heading from '../element/Heading';
import { useSheets } from '@/context/SheetsContext';
import { useEffect, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/utils';
import DataTable from '../element/DataTable';
import { useAuth } from '@/context/AuthContext';
import { Pill } from '../ui/pill';

interface ApprovedPOData {
    date: string;
    plannedDate: string;
    indentNo: string;
    product: string;
    quantity: number;
    rate: number;
    uom: string;
    vendorName: string;
    paymentTerm: string;
    specifications: string;
    firmNameMatch: string;
    poRequired: string;
    poRequiredStatus: 'Yes';
}

export default function ApprovedPOs() {
    const { indentSheet, indentLoading } = useSheets();
    const { user } = useAuth();

    const [approvedTableData, setApprovedTableData] = useState<ApprovedPOData[]>([]);

    useEffect(() => {
        console.log("Raw indentSheet data:", indentSheet);
    }, [indentSheet]);

    // Fetching approved PO data (ONLY "Yes" entries)
    useEffect(() => {
        // Filter by firm name first
        const filteredByFirm = indentSheet.filter((sheet: any) => 
            user?.firm_name_match?.toLowerCase() === "all" || sheet.firm_name_match === user?.firm_name_match
        );
        
        console.log("Filtered by firm:", filteredByFirm.length);
        
        const mappedData = filteredByFirm
            .filter((sheet: any) => {
                // Show ONLY when po_requred has "Yes" value
                const hasYes = sheet.po_requred && 
                       sheet.po_requred.toString().trim().toLowerCase() === 'yes';
                
                console.log("PO Required check:", {
                    indentNo: sheet.indent_number,
                    po_requred: sheet.po_requred,
                    hasYes: hasYes
                });
                
                return hasYes;
            })
            .map((sheet: any) => {
                let formattedDate = '';
                let formattedPlannedDate = '';
                
                try {
                    if (sheet.timestamp) {
                        formattedDate = formatDate(new Date(sheet.timestamp));
                    }
                } catch (error) {
                    console.warn('Invalid timestamp format:', sheet.timestamp);
                }

                try {
                    if (sheet.planned4) {
                        formattedPlannedDate = formatDate(new Date(sheet.planned4));
                    }
                } catch (error) {
                    console.warn('Invalid planned date format:', sheet.planned4);
                }

                const data = {
                    date: formattedDate,
                    plannedDate: formattedPlannedDate,
                    indentNo: sheet.indent_number || '',
                    firmNameMatch: sheet.firm_name || '',
                    product: sheet.product_name || '',
                    quantity: Number(sheet.pending_po_qty) || Number(sheet.quantity) || 0,
                    rate: Number(sheet.approved_rate) || Number(sheet.rate1) || 0,
                    uom: sheet.uom || '',
                    vendorName: sheet.approved_vendor_name || sheet.vendor_name1 || '',
                    paymentTerm: sheet.approved_payment_term || sheet.payment_term1 || '',
                    specifications: sheet.specifications || '',
                    poRequired: sheet.po_requred?.toString() || '',
                    poRequiredStatus: 'Yes' as const,
                };

                console.log("Mapped data:", data);
                return data;
            })
            // Sort by indentNo in descending order
            .sort((a, b) => b.indentNo.localeCompare(a.indentNo));

        console.log("Final approved data:", mappedData);
        setApprovedTableData(mappedData);
    }, [indentSheet, user?.firm_name_match]);

    // Creating approved PO table columns
    const approvedColumns: ColumnDef<ApprovedPOData>[] = [
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'plannedDate',
            header: 'Planned Date',
            cell: ({ getValue }) => {
                const plannedDate = getValue() as string;
                return (
                    <div className="px-2">
                        {plannedDate || '-'}
                    </div>
                );
            }
        },
        {
            accessorKey: 'indentNo',
            header: 'Indent Number',
            cell: ({ getValue }) => <div className="px-2 font-medium">{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'firmNameMatch',
            header: 'Firm Name',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'product',
            header: 'Product',
            cell: ({ getValue }) => (
                <div className="max-w-[120px] break-words whitespace-normal px-1 text-sm">
                    {getValue() as string || '-'}
                </div>
            ),
        },
        {
            accessorKey: 'quantity',
            header: 'Pending PO Qty',
            cell: ({ getValue }) => <div className="px-2 text-center">{getValue() as number || 0}</div>
        },
        {
            accessorKey: 'rate',
            header: 'Rate',
            cell: ({ row }) => (
                <div className="px-2">
                    &#8377;{row.original.rate || 0}
                </div>
            ),
        },
        {
            accessorKey: 'uom',
            header: 'UOM',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'vendorName',
            header: 'Vendor Name',
            cell: ({ getValue }) => (
                <div className="max-w-[150px] break-words whitespace-normal px-2 text-sm">
                    {getValue() as string || '-'}
                </div>
            ),
        },
        {
            accessorKey: 'paymentTerm',
            header: 'Payment Term',
            cell: ({ getValue }) => (
                <div className="max-w-[120px] break-words whitespace-normal px-2 text-sm">
                    {getValue() as string || '-'}
                </div>
            ),
        },
        {
            accessorKey: 'specifications',
            header: 'Specifications',
            cell: ({ getValue }) => (
                <div className="max-w-[150px] break-words whitespace-normal px-2 text-sm">
                    {getValue() as string || '-'}
                </div>
            ),
        },
        {
            accessorKey: 'poRequiredStatus',
            header: 'PO Required',
            cell: ({ row }) => {
                const status = row.original.poRequiredStatus;
                return (
                    <div className="px-2">
                        <Pill variant="primary">{status}</Pill>
                    </div>
                );
            },
        },
    ];

    return (
        <div>
            <Heading 
                heading="Approved POs" 
                subtext={`View all approved purchase orders (PO Required: Yes) - ${approvedTableData.length} records found`}
            >
                <CheckCircle size={50} className="text-green-600" />
            </Heading>
            
            {approvedTableData.length === 0 && !indentLoading ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <CheckCircle size={64} className="text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Approved POs Found</h3>
                    <p className="text-gray-500 max-w-md">
                        No purchase orders with "PO Required: Yes" were found for your firm.
                    </p>
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg text-left">
                        <p className="text-sm text-blue-800">
                            <strong>Debug Info:</strong><br />
                            - User Firm: {user?.firm_name_match || 'Not set'}<br />
                            - Total Records: {indentSheet?.length || 0}<br />
                            - Loading: {indentLoading ? 'Yes' : 'No'}
                        </p>
                    </div>
                </div>
            ) : (
                <DataTable
                    data={approvedTableData}
                    columns={approvedColumns}
                    searchFields={['product', 'vendorName', 'paymentTerm', 'specifications', 'firmNameMatch', 'indentNo']}
                    dataLoading={indentLoading}
                    className="h-[80dvh]"
                />
            )}
        </div>
    );
}