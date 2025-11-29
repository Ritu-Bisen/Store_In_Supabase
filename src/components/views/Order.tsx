import { Package2 } from 'lucide-react';
import Heading from '../element/Heading';
import { useSheets } from '@/context/SheetsContext';
import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import DataTable from '../element/DataTable';
import { Pill } from '../ui/pill';
import { useAuth } from '@/context/AuthContext';

interface HistoryData {
    poNumber: string;
    poCopy: string;
    vendorName: string;
    preparedBy: string;
    approvedBy: string;
    totalAmount: number;
    status: 'Revised' | 'Not Received' | 'Received' | 'Unknown';
}

// Enhanced status calculation that handles both sheet and database data
const calculateStatus = (
    poNumber: string | undefined, 
    indentSheet: any[], 
    receivedSheet: any[]
): 'Revised' | 'Not Received' | 'Received' | 'Unknown' => {
    if (!poNumber) return 'Unknown';
    
    try {
        const safeIndentSheet = Array.isArray(indentSheet) ? indentSheet : [];
        const safeReceivedSheet = Array.isArray(receivedSheet) ? receivedSheet : [];
        
        // Check for PO number in various field names
        const isInIndentSheet = safeIndentSheet.some((record: any) => 
            record?.poNumber === poNumber || 
            record?.po_number === poNumber ||
            record?.po_no === poNumber
        );
            
        const isInReceivedSheet = safeReceivedSheet.some((record: any) => 
            record?.poNumber === poNumber || 
            record?.po_number === poNumber ||
            record?.po_no === poNumber
        );
        
        if (isInIndentSheet) {
            return isInReceivedSheet ? 'Received' : 'Not Received';
        }
        return 'Revised';
    } catch (error) {
        console.warn('Error calculating status:', error);
        return 'Unknown';
    }
};

export default function POHistory() {
    const { poMasterLoading, poMasterSheet, indentSheet, receivedSheet, updatePoMasterSheet } = useSheets();
    const { user } = useAuth();
    const [historyData, setHistoryData] = useState<HistoryData[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const processHistoryData = () => {
            try {
                setError(null);
                const safePoMasterSheet = Array.isArray(poMasterSheet) ? poMasterSheet : [];
                
                console.log('Processing PO Master data:', safePoMasterSheet.length, 'records');
                
                // Filter by firm if user doesn't have "all" access
                const filteredByFirm = user?.firm_name_match?.toLowerCase() === "all" 
                    ? safePoMasterSheet 
                    : safePoMasterSheet.filter((sheet: any) => 
                          sheet?.firm_name_match === user?.firm_name_match
                      );
                
                const processedData: HistoryData[] = filteredByFirm.map((sheet: any) => ({
                    approvedBy: sheet?.approvedBy || sheet?.approved_by || '-',
                    poCopy: sheet?.pdf || sheet?.po_copy || '',
                    poNumber: sheet?.po_number || sheet?.poNumber || '-',
                    preparedBy: sheet?.preparedBy || sheet?.prepared_by || '-',
                    totalAmount: Number(sheet?.total_po_amount || sheet?.totalPoAmount || 0),
                    vendorName: sheet?.party_name || sheet?.vendorName || '-',
                    status: calculateStatus(sheet?.po_number || sheet?.poNumber, indentSheet, receivedSheet)
                }));
                
                setHistoryData(processedData);
                
            } catch (error) {
                console.error('❌ Error processing PO history data:', error);
                setError('Failed to process PO data');
                setHistoryData([]);
            }
        };

        processHistoryData();
    }, [indentSheet, poMasterSheet, receivedSheet, user?.firm_name_match]);

    // Refresh data function
    const handleRefresh = () => {
        updatePoMasterSheet();
    };

    // Memoized columns for better performance
    const historyColumns: ColumnDef<HistoryData>[] = useMemo(() => [
        { 
            accessorKey: 'poNumber', 
            header: 'PO Number',
            cell: ({ getValue }) => <div className="font-medium">{getValue() as string}</div>
        },
        {
            accessorKey: 'poCopy',
            header: 'PO Copy',
            cell: ({ row }) => {
                const attachment = row.original.poCopy;
                return attachment ? (
                    <a 
                        href={attachment} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline transition-colors"
                    >
                        View PDF
                    </a>
                ) : (
                    <span className="text-gray-400 text-sm">No PDF</span>
                );
            },
        },
        { 
            accessorKey: 'vendorName', 
            header: 'Vendor Name',
            cell: ({ getValue }) => <div className="truncate max-w-[200px]" title={getValue() as string}>
                {getValue() as string}
            </div>
        },
        { 
            accessorKey: 'preparedBy', 
            header: 'Prepared By',
            cell: ({ getValue }) => <div>{getValue() as string}</div>
        },
        { 
            accessorKey: 'approvedBy', 
            header: 'Approved By',
            cell: ({ getValue }) => <div>{getValue() as string}</div>
        },
        {
            accessorKey: 'totalAmount',
            header: 'Amount',
            cell: ({ row }) => {
                const amount = row.original.totalAmount || 0;
                return (
                    <div className="font-medium">
                        ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                );
            },
        },
        { 
            accessorKey: 'status', 
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                const variantMap = {
                    'Not Received': 'secondary',
                    'Received': 'primary',
                    'Revised': 'warning',
                    'Unknown': 'default'
                } as const;
                
                return (
                    <Pill variant={variantMap[status] || 'default'}>
                        {status}
                    </Pill>
                );
            }
        },
    ], []);

    // Loading state
    if (poMasterLoading && historyData.length === 0) {
        return (
            <div>
                <Heading heading="PO History" subtext="View purchase orders">
                    <Package2 size={50} className="text-primary" />
                </Heading>
                <div className="flex items-center justify-center h-[80dvh]">
                    <div className="text-lg text-gray-600">Loading PO history from database...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Heading 
                heading="PO History" 
                subtext="View purchase orders from database"
                action={
                    <button 
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Refresh Data
                    </button>
                }
            >
                <Package2 size={50} className="text-primary" />
            </Heading>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {historyData.length === 0 && !poMasterLoading ? (
                <div className="flex items-center justify-center h-[80dvh] border rounded-lg">
                    <div className="text-center text-gray-500">
                        <Package2 size={48} className="mx-auto mb-4 text-gray-400" />
                        <p className="text-lg">No purchase orders found</p>
                        <p className="text-sm">
                            {user?.firm_name_match?.toLowerCase() === "all" 
                                ? "There are no purchase orders in the database." 
                                : `No purchase orders found for ${user?.firm_name_match}.`
                            }
                        </p>
                        <button 
                            onClick={handleRefresh}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Refresh Data
                        </button>
                    </div>
                </div>
            ) : (
                <DataTable
                    data={historyData}
                    columns={historyColumns}
                    searchFields={['vendorName', 'poNumber', 'preparedBy', 'approvedBy']}
                    dataLoading={poMasterLoading}
                    className='h-[80dvh]'
                    searchPlaceholder="Search by vendor, PO number, or person..."
                />
            )}
        </div>
    );
}