import { useSheets } from '@/context/SheetsContext';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import DataTable from '../element/DataTable';
import { Button } from '../ui/button';
import { DollarSign } from 'lucide-react';
import Heading from '../element/Heading';
import { useAuth } from '@/context/AuthContext';

interface MakePaymentData {
    indent_no: string;
    bill_no: string;
    vendor_name: string;
    product_name: string;
    qty: number;
    bill_amount: number;
    advance_amount: number;
    payment_type: string;
    firm_name_match: string;
    make_payment_link: string;
}

interface StoreInItem {
    indent_no?: string;
    bill_no?: string;
    bill_amount?: number;
    advance_amount_if_any?: string | number;
}

interface IndentSheetItem {
    firm_name_match?: string;
    indent_number?: string;
    planned7?: any;
    actual7?: any;
    make_payment_link?: any;
    approved_vendor_name?: string;
    vendor_name1?: string;
    product_name?: string;
    quantity?: number;
    payment_type?: string;
}

export default function MakePayment() {
    const { indentSheet, indentLoading, storeInSheet } = useSheets();
    const [tableData, setTableData] = useState<MakePaymentData[]>([]);
    const { user } = useAuth();

    // Filter data and merge with STORE IN sheet
    useEffect(() => {
        const filteredByFirm = indentSheet.filter((sheet: IndentSheetItem) =>
            user.firm_name_match.toLowerCase() === "all" || sheet.firm_name_match === user.firm_name_match
        );

        // Create a map of STORE IN data by indent number for quick lookup
        const storeInMap = new Map(
            storeInSheet.map((item: StoreInItem) => [
                item.indent_no,
                {
                    bill_no: item.bill_no || '',
                    bill_amount: item.bill_amount || 0,
                    advance_amount: Number(item.advance_amount_if_any) || 0,
                }
            ])
        );

        setTableData(
            filteredByFirm
                .filter((sheet: IndentSheetItem) => {
                    const planned7IsNotNull = sheet.planned7 && sheet.planned7.toString().trim() !== '';
                    const actual7IsNull = !sheet.actual7 || sheet.actual7.toString().trim() === '';
                    const hasMakePaymentLink = sheet.make_payment_link?.toString().trim() !== '';
                    
                    return planned7IsNotNull && actual7IsNull && hasMakePaymentLink;
                })
                .map((sheet: IndentSheetItem) => {
                    const billData = storeInMap.get(sheet.indent_number) || { 
                        bill_no: '', 
                        bill_amount: 0,
                        advance_amount: 0
                    };
                    
                    return {
                        indent_no: sheet.indent_number || '',
                        bill_no: billData.bill_no,
                        vendor_name: sheet.approved_vendor_name || sheet.vendor_name1 || '',
                        product_name: sheet.product_name || '',
                        qty: sheet.quantity || 0,
                        bill_amount: billData.bill_amount,
                        advance_amount: billData.advance_amount,
                        payment_type: sheet.payment_type || '',
                        firm_name_match: sheet.firm_name_match || '',
                        make_payment_link: sheet.make_payment_link?.toString() || '',
                    };
                })
                .sort((a, b) => b.indent_no.localeCompare(a.indent_no))
        );

    }, [indentSheet, storeInSheet, user.firm_name_match]);

    // Handle Make Payment button click - Open specific Google Form link
     // Handle Make Payment button click with better debugging
     const handleMakePayment = (item: MakePaymentData) => {
        if (item.make_payment_link) {
            // Open the specific Google Form link in new tab
            window.open(item.make_payment_link, '_blank');
        } else {
            console.warn('No payment link available for indent:', item.indent_no);
        }
    };

    // Table columns
    const columns: ColumnDef<MakePaymentData>[] = [
        {
            header: 'Action',
            cell: ({ row }: { row: Row<MakePaymentData> }) => {
                const item = row.original;
                return (
                    <Button
                        variant="outline"
                        onClick={() => handleMakePayment(item)}
                        disabled={!item.make_payment_link}
                    >
                        Make Payment
                    </Button>
                );
            },
        },
        { accessorKey: 'indent_no', header: 'Indent No.' },
        { accessorKey: 'firm_name_match', header: 'Firm Name' },
        { accessorKey: 'bill_no', header: 'Bill No.' },
        { accessorKey: 'vendor_name', header: 'Vendor Name' },
        { accessorKey: 'product_name', header: 'Product Name' },
        { accessorKey: 'qty', header: 'Qty' },
        {
            accessorKey: 'bill_amount',
            header: 'Bill Amount',
            cell: ({ getValue }) => `₹${getValue() as number}`,
        },
        {
            accessorKey: 'advance_amount',
            header: 'Advance Amount',
            cell: ({ getValue }) => `₹${getValue() as number}`,
        },
        { accessorKey: 'payment_type', header: 'Payment Type' },
    ];

    return (
        <div>
            <Heading heading="Make Payment" subtext="Process advance payments">
                <DollarSign size={50} className="text-green-600" />
            </Heading>

            <DataTable
                data={tableData}
                columns={columns}
                searchFields={['indent_no', 'bill_no', 'vendor_name', 'product_name', 'firm_name_match']}
                dataLoading={indentLoading}
            />
        </div>
    );
}