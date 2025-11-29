import { fetchSheet } from '@/lib/fetchers';
import supabase from '@/SupabaseClient';
import type {
    IndentSheet,
    InventorySheet,
    MasterSheet,
    PoMasterSheet,
    ReceivedSheet,
    StoreInSheet,
    IssueSheet,
    TallyEntrySheet,
    PcReportSheet,
    FullkittingSheet,
    PaymentHistory,
} from '@/types';
import type { MasterSheetItem } from '@/types/sheets';

import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface SheetsState {
    updateReceivedSheet: () => void;
    updatePoMasterSheet: () => void;
    updateIndentSheet: () => void;
    updateAll: () => void;

    updateIssueSheet: () => void;
    issueSheet: IssueSheet[];
    issueLoading: boolean;
    sheets: StoreInSheet[];


    indentSheet: IndentSheet[];
    storeInSheet: StoreInSheet[];
    poMasterSheet: PoMasterSheet[];
    receivedSheet: ReceivedSheet[];
    inventorySheet: InventorySheet[];
    pcReportSheet: PcReportSheet[];
    masterSheet: MasterSheet | undefined;

    indentLoading: boolean;
    poMasterLoading: boolean;
    receivedLoading: boolean;
    inventoryLoading: boolean;
    allLoading: boolean;

    updateStoreInSheet: () => void;
    storeInLoading: boolean;

    tallyEntrySheet: TallyEntrySheet[];
    tallyEntryLoading: boolean;
    updateTallyEntrySheet: () => void;

    updatePcReportSheet: () => void;

    fullkittingSheet: FullkittingSheet[];
    fullkittingLoading: boolean;
    updateFullkittingSheet: () => void;

    // ✅ ADD PAYMENT HISTORY HERE
    paymentHistorySheet: PaymentHistory[];
    paymentHistoryLoading: boolean;
    updatePaymentHistorySheet: () => void;
}

const SheetsContext = createContext<SheetsState | null>(null);

export const SheetsProvider = ({ children }: { children: React.ReactNode }) => {
    const [indentSheet, setIndentSheet] = useState<IndentSheet[]>([]);
    const [storeSheet, setStoreInSheet] = useState<StoreInSheet[]>([]);
    const [receivedSheet, setReceivedSheet] = useState<ReceivedSheet[]>([]);
    const [poMasterSheet, setPoMasterSheet] = useState<PoMasterSheet[]>([]);
    const [inventorySheet, setInventorySheet] = useState<InventorySheet[]>([]);
    const [masterSheet, setMasterSheet] = useState<MasterSheet>();

    const [tallyEntrySheet, setTallyEntrySheet] = useState<TallyEntrySheet[]>([]);
    const [pcReportSheet, setPcReportSheet] = useState<PcReportSheet[]>([]);
    const [fullkittingSheet, setFullkittingSheet] = useState<FullkittingSheet[]>([]);
    const [fullkittingLoading, setFullkittingLoading] = useState(true);

    const [tallyEntryLoading, setTallyEntryLoading] = useState(true);

    const [issueSheet, setIssueSheet] = useState<IssueSheet[]>([]);
    const [issueLoading, setIssueLoading] = useState(true);

    const [indentLoading, setIndentLoading] = useState(true);
    const [poMasterLoading, setPoMasterLoading] = useState(true);
    const [receivedLoading, setReceivedLoading] = useState(true);
    const [inventoryLoading, setInventoryLoading] = useState(true);
    const [allLoading, setAllLoading] = useState(true);

    const [storeInLoading, setStoreInLoading] = useState(true);

    // ✅ ADD PAYMENT HISTORY STATE
    const [paymentHistorySheet, setPaymentHistorySheet] = useState<PaymentHistory[]>([]);
    const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(true);

   const sheets = storeSheet;

   async function updateStoreInSheet() {
        setStoreInLoading(true);
         try {
        const { data, error } = await supabase
            .from('store_in')
            .select('*');
          
        if (error) throw error;
             toast.success(`store_in data fetched successfully (${data?.length} records)`);
      
         setStoreInSheet(data as StoreInSheet[]);
    } catch (error) {
        console.error('Error fetching store_in data:', error);
        toast.error('Failed to fetch store_in data');
    } finally {
        setStoreInLoading(false);
    }
       
    }

  async function updateIssueSheet() {
    setIssueLoading(true);
    
    try {
        const { data, error } = await supabase
            .from('issue')
            .select('*');
          
        if (error) throw error;
             toast.success(`Issue data fetched successfully (${data?.length} records)`);
        setIssueSheet(data as IssueSheet[]);
    } catch (error) {
        console.error('Error fetching issue data:', error);
        toast.error('Failed to fetch issue data');
    } finally {
        setIssueLoading(false);
    }
}

   async function updateIndentSheet() {
        setIndentLoading(true);
         try {
        const { data, error } = await supabase
            .from('indent')
            .select('*');
          
        if (error) throw error;
             toast.success(`Indent data fetched successfully (${data?.length} records)`);
        setIndentSheet(data as IndentSheet[]);
    }  catch (error) {
        console.error('Error fetching issue data:', error);
        toast.error('Failed to fetch issue data');
    } finally {
        setIndentLoading(false);
    }     
    
    }

    function updateReceivedSheet() {
        setReceivedLoading(true);
        fetchSheet('RECEIVED').then((res) => {
            setReceivedSheet(res as ReceivedSheet[]);
            setReceivedLoading(false);
        });
    }

   async function updatePoMasterSheet() {
        setPoMasterLoading(true);
         try {
        const { data, error } = await supabase
            .from('po_master')
            .select('*');
          
        if (error) throw error;
             toast.success(`po master data fetched successfully (${data?.length} records)`);
         setPoMasterSheet(data as PoMasterSheet[]);
    }  catch (error) {
        console.error('Error fetching issue data:', error);
        toast.error('Failed to fetch issue data');
    } finally {
         setPoMasterLoading(false);
    }   
       
    }

   async function updateInventorySheet() {
        setInventoryLoading(true);
           try {
        const { data, error } = await supabase
            .from('inventory')
            .select('*');
          
        if (error) throw error;
             toast.success(`inventory data fetched successfully (${data?.length} records)`);
    setInventorySheet(data as InventorySheet[]);
    }  catch (error) {
        console.error('Error fetching inventory data:', error);
        toast.error('Failed to fetch inventory data');
    } finally {
       setInventoryLoading(false);
    } 
      
  
    }

async function updateMasterSheet() {
    try {
        const { data, error } = await supabase
            .from('master')
            .select('*');
          
        if (error) throw error;
        toast.success(`master data fetched successfully (${data?.length} records)`);
        
        // Transform the data
        const masterData: MasterSheetItem[] = data as MasterSheetItem[];
        
        // Helper function to get unique non-empty values
        const getUniqueValues = (items: any[], key: keyof MasterSheetItem) => {
            const values = items.map(item => item[key]).filter(value => 
                value !== null && value !== undefined && value !== '' && String(value).trim() !== ''
            );
            return [...new Set(values)] as string[];
        };

        // Helper function to get first non-empty value
        const getFirstValue = (items: any[], key: keyof MasterSheetItem) => {
            const item = items.find(item => item[key] && item[key] !== '');
            return item?.[key] || '';
        };

        // Build groupHeads mapping
        const groupHeads: Record<string, string[]> = {};
        masterData.forEach(item => {
            if (item.group_head && item.item_name) {
                const groupHead = String(item.group_head).trim();
                const itemName = String(item.item_name).trim();
                
                if (groupHead && itemName) {
                    if (!groupHeads[groupHead]) {
                        groupHeads[groupHead] = [];
                    }
                    if (!groupHeads[groupHead].includes(itemName)) {
                        groupHeads[groupHead].push(itemName);
                    }
                }
            }
        });

        // Build firmCompanyMap
        const firmCompanyMap: Record<string, { companyName: string; companyAddress: string; destinationAddress: string; }> = {};
        masterData.forEach(item => {
            if (item.firm_name && !firmCompanyMap[item.firm_name]) {
                firmCompanyMap[item.firm_name] = {
                    companyName: item.company_name || '',
                    companyAddress: item.company_address || '',
                    destinationAddress: item.destination_address || ''
                };
            }
        });

        const transformedData: MasterSheet = {
            items: masterData,
            vendorNames: getUniqueValues(masterData, 'vendor_name'),
            paymentTerms: getUniqueValues(masterData, 'payment_term'), // Using payment_term (singular)
            departments: getUniqueValues(masterData, 'department'),
            groupHeads: groupHeads,
            companyName: getFirstValue(masterData, 'company_name'),
            companyAddress: getFirstValue(masterData, 'company_address'),
            companyGstin: getFirstValue(masterData, 'company_gstin'),
            companyPhone: getFirstValue(masterData, 'company_phone'),
            billingAddress: getFirstValue(masterData, 'billing_address'),
            companyPan: getFirstValue(masterData, 'company_pan'),
            destinationAddress: getFirstValue(masterData, 'destination_address'),
            defaultTerms: getUniqueValues(masterData, 'default_terms'),
            uoms: getUniqueValues(masterData, 'uom'),
            firmsnames: getUniqueValues(masterData, 'firm_name'),
            firms: getUniqueValues(masterData, 'firm_name'),
            fmsNames: getUniqueValues(masterData, 'fms_name'),
            firmCompanyMap: firmCompanyMap
        };
        
        setMasterSheet(transformedData);
        
        // Enhanced debugging
        console.log('🔍 MASTER DATA DEBUG INFO:');
        console.log('Total items:', transformedData.items.length);
        console.log('Vendor names found:', transformedData.vendorNames.length);
        console.log('Payment terms found:', transformedData.paymentTerms.length, transformedData.paymentTerms.slice(0, 5));
        console.log('Departments found:', transformedData.departments.length, transformedData.departments.slice(0, 5));
        console.log('UOMs found:', transformedData.uoms.length, transformedData.uoms.slice(0, 5));
        console.log('Firms found:', transformedData.firms.length, transformedData.firms.slice(0, 5));
        console.log('Group heads found:', Object.keys(transformedData.groupHeads).length);
        console.log('All group heads:', Object.keys(transformedData.groupHeads));
        
        // Check first few items to see actual data structure
        console.log('📋 Sample master data (first 3 items):', masterData.slice(0, 3).map(item => ({
            department: item.department,
            payment_term: item.payment_term,
            uom: item.uom,
            firm_name: item.firm_name,
            group_head: item.group_head,
            item_name: item.item_name
        })));
        
    } catch (error) {
        console.error('Error fetching master data:', error);
        toast.error('Failed to fetch master data');
    } 
}

  async  function updateFullkittingSheet() {
        setFullkittingLoading(true);
           try {
        const { data, error } = await supabase
            .from('fullkitting')
            .select('*');
          
        if (error) throw error;
             toast.success(`fullkitting data fetched successfully (${data?.length} records)`);
     setFullkittingSheet(data as unknown as FullkittingSheet[]);
    }  catch (error) {
        console.error('Error fetching fullkitting data:', error);
        toast.error('Failed to fetch fullkitting data');
    } finally {
       setFullkittingLoading(false);
    } 
      
    }

   

    // ✅ ADD PAYMENT HISTORY FUNCTION
  async  function updatePaymentHistorySheet() {
        setPaymentHistoryLoading(true);
          try {
        const { data, error } = await supabase
            .from('payment_history')
            .select('*');
          
        if (error) throw error;
             toast.success(`fullkitting data fetched successfully (${data?.length} records)`);
     setPaymentHistorySheet(data as PaymentHistory[]);
    }  catch (error) {
        console.error('Error fetching fullkitting data:', error);
        toast.error('Failed to fetch fullkitting data');
    } finally {
      setPaymentHistoryLoading(false);
    } 
    }

    function updateAll() {
        setAllLoading(true);
        updateMasterSheet();
        updateReceivedSheet();
        updateIndentSheet();
        updatePoMasterSheet();
        updateInventorySheet();
        
        updateStoreInSheet();
        updateIssueSheet();
        updateTallyEntrySheet();
        updatePcReportSheet();
        updateFullkittingSheet();
        
        // ✅ ADD PAYMENT HISTORY TO UPDATE ALL
        updatePaymentHistorySheet();
        
        setAllLoading(false);
    }

    useEffect(() => {
        try {
            updateAll();
            toast.success('Fetched all the data');
        } catch (e) {
            toast.error('Something went wrong while fetching data');
        } finally {
        }
    }, []);

   async function updateTallyEntrySheet() {
        setTallyEntryLoading(true);
          try {
        const { data, error } = await supabase
            .from('tally_entry')
            .select('*');
          
        if (error) throw error;
             toast.success(`tally_entry data fetched successfully (${data?.length} records)`);
    setTallyEntrySheet(data as TallyEntrySheet[]);
    }  catch (error) {
        console.error('Error fetching tally_entry data:', error);
        toast.error('Failed to fetch tally_entry data');
    } finally {
     setTallyEntryLoading(false);
    } 
       
    }

async function updatePcReportSheet() {
    const { data, error } = await supabase
        .from("pc_report")
        .select("*")
.order("stage", { ascending: true });
    if (error) {
        console.error("Error fetching PC REPORT:", error);
        return;
    }

    setPcReportSheet(data as PcReportSheet[]);
}

    return (
        <SheetsContext.Provider
            value={{
                updateIndentSheet,
                updatePoMasterSheet,
                updateReceivedSheet,
                updateAll,
                indentSheet,
                sheets,
                poMasterSheet,
                inventorySheet,
                receivedSheet,
                indentLoading,
                masterSheet,
                poMasterLoading,
                receivedLoading,
                inventoryLoading,
                allLoading,
                storeInSheet: storeSheet,

                updateIssueSheet,
                issueSheet,
                issueLoading,

                updateStoreInSheet,
                storeInLoading,

                tallyEntrySheet,
                tallyEntryLoading,
                updateTallyEntrySheet,

                pcReportSheet,
                updatePcReportSheet,

                fullkittingSheet,
                fullkittingLoading,
                updateFullkittingSheet,

                // ✅ ADD PAYMENT HISTORY TO CONTEXT VALUE
                paymentHistorySheet,
                paymentHistoryLoading,
                updatePaymentHistorySheet,
            }}
        >
            {children}
        </SheetsContext.Provider>
    );
};

export const useSheets = () => useContext(SheetsContext)!;