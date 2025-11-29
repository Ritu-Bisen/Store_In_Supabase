import { Package2 } from 'lucide-react';
import Heading from '../element/Heading';
import { useSheets } from '@/context/SheetsContext';
import { useEffect, useState } from 'react';
import type { ColumnDef, Row } from '@tanstack/react-table';
import DataTable from '../element/DataTable';
import type { TallyEntrySheet } from '@/types';
import { useAuth } from '@/context/AuthContext';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { toast } from 'sonner';
import { PuffLoader as Loader } from 'react-spinners';
import supabase from '@/SupabaseClient';

export default function PcReportTable() {
  const { tallyEntrySheet, poMasterLoading, updateAll } = useSheets();
  const [data, setData] = useState<TallyEntrySheet[]>([]);
  const [selectedRow, setSelectedRow] = useState<TallyEntrySheet | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const { user } = useAuth();

  // Update table data whenever tallyEntrySheet changes
  useEffect(() => {
    if (!tallyEntrySheet) return;
    
    console.log("Raw Tally Entry Sheet:", tallyEntrySheet);
    
    // Pehle firm name se filter karo (case-insensitive)
    const filteredByFirm = tallyEntrySheet.filter(item => {
      const userFirm = user.firm_name_match?.toLowerCase() || '';
      const itemFirm = item.firm_name_match?.toLowerCase() || '';
      return userFirm === "all" || itemFirm === userFirm;
    });
    
    // Filter the data according to planned5 has value and actual5 is empty/null
    const filteredData = filteredByFirm.filter(
      (row) => 
        (row.planned5 !== null && row.planned5 !== undefined && row.planned5 !== '') && 
        (row.actual5 === null || row.actual5 === undefined || row.actual5 === '')
    );

    console.log("Filtered Tally Entry Sheet:", filteredData);
    setData(filteredData);
  }, [tallyEntrySheet, user.firm_name_match]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!openDialog) {
      form.reset({ status: undefined });
    }
  }, [openDialog]);

  // Validation schema
  const schema = z.object({
    status: z.enum(['okey', 'not okey']),
  });

  // Form setup
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: undefined,
    },
  });

  // Handle form submission
  async function onSubmit(values: z.infer<typeof schema>) {
    if (!selectedRow) {
      toast.error('No row selected!');
      return;
    }

    try {
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

      // Update Supabase table directly
      const { data: updateData, error } = await supabase
        .from('tally_entry')
        .update({
          actual5:  new Date().toLocaleString("en-CA", { 
      timeZone: "Asia/Kolkata", 
      hour12: false 
    }).replace(',', ''),
          status5: values.status,
          // updated_at: new Date().toISOString(),
        })
        .eq('indent_number', selectedRow.indent_number || selectedRow.indent_no);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Update successful:', updateData);
      toast.success(`Status updated for Indent ${selectedRow.indent_number || selectedRow.indent_no}`);

      // Close dialog and refresh data
      setOpenDialog(false);
      setTimeout(() => updateAll(), 1000);

    } catch (err) {
      console.error('Error in onSubmit:', err);
      toast.error('Failed to update');
    }
  }

  function onError(e: any) {
    console.log(e);
    toast.error('Please fill all required fields');
  }

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

  // Columns for TallyEntrySheet
const columns: ColumnDef<TallyEntrySheet>[] = [
  {
    id: 'actions',
    header: 'Action',
    cell: ({ row }: { row: Row<TallyEntrySheet> }) => {
      const rowData = row.original;
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedRow(rowData);
              }}
            >
              Action
            </Button>
          </DialogTrigger>
        </Dialog>
      );
    },
  },
    { accessorKey: 'indent_number', header: 'Indent Number' },
    { accessorKey: 'firm_name_match', header: 'Firm Name' },
    { 
      accessorKey: 'indent_date', 
      header: 'Indent Date',
      cell: ({ row }) => formatDate(row.original.indent_date)
    },
    { 
      accessorKey: 'purchase_date', 
      header: 'Purchase Date',
      cell: ({ row }) => formatDate(row.original.purchase_date)
    },
    { 
      accessorKey: 'material_in_date', 
      header: 'Material In Date',
      cell: ({ row }) => formatDate(row.original.material_in_date)
    },
    { accessorKey: 'product_name', header: 'Product Name' },
    { accessorKey: 'bill_no', header: 'Bill No' },
    { accessorKey: 'qty', header: 'Quantity' },
    { accessorKey: 'party_name', header: 'Party Name' },
    { accessorKey: 'bill_amt', header: 'Bill Amount' },
    {
      accessorKey: 'bill_image',
      header: 'Bill Image',
      cell: ({ row }) => {
        const image = row.original.bill_image;
        return image && image.trim() !== '' ? (
          <a href={image} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            View
          </a>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
    { accessorKey: 'bill_received_later', header: 'Bill Received Later' },
    { accessorKey: 'not_received_bill_no', header: 'Not Received Bill No' },
    { accessorKey: 'location', header: 'Location' },
    { accessorKey: 'type_of_bills', header: 'Type Of Bills' },
    {
      accessorKey: 'product_image',
      header: 'Product Image',
      cell: ({ row }) => {
        const image = row.original.product_image;
        return image && image.trim() !== '' ? (
          <a href={image} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            View
          </a>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
    { accessorKey: 'area', header: 'Area' },
    { accessorKey: 'indented_for', header: 'Indented For' },
    { accessorKey: 'approved_party_name', header: 'Approved Party Name' },
    { accessorKey: 'rate', header: 'Rate' },
    { accessorKey: 'indent_qty', header: 'Indent Qty' },
    { accessorKey: 'total_rate', header: 'Total Rate' },
  ];

 return (
  <div>
    <Heading heading="Again Auditing" subtext="">
      <Package2 size={50} className="text-primary" />
    </Heading>

    {data.length > 0 ? (
      <DataTable
        data={data}
        columns={columns}
        searchFields={['product_name', 'indent_number', 'party_name', 'bill_no']}
        dataLoading={poMasterLoading}
        className='h-[80dvh]'
      />
    ) : (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-muted-foreground">No pending again auditing entries found</p>
      </div>
    )}

    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      {selectedRow && (
        <DialogContent className="sm:max-w-[425px]">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="space-y-5"
              >
                <DialogHeader>
                  <DialogTitle>
                    Update Status for Indent {selectedRow.indent_number || selectedRow.indent_no}
                  </DialogTitle>
                </DialogHeader>

                <div className="bg-muted p-4 rounded-md grid gap-3">
                  <h3 className="text-lg font-bold">Entry Details</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="space-y-1">
                      <p className="font-medium">Product Name</p>
                      <p className="text-sm font-light">
                        {selectedRow.product_name}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Party Name</p>
                      <p className="text-sm font-light">
                        {selectedRow.party_name}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Bill No</p>
                      <p className="text-sm font-light">
                        {selectedRow.bill_no}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 py-4">
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
                              <SelectItem value="okey">Okey</SelectItem>
                              <SelectItem value="not okey">Not Okey</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && (
                      <Loader
                        size={20}
                        color="white"
                        aria-label="Loading Spinner"
                      />
                    )}
                    Submit
                  </Button>
                </DialogFooter>
              </form>
            </Form>
         </DialogContent>
      )}
    </Dialog>
  </div>
);}