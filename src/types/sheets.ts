export type Sheet = 'INDENT' | 'RECEIVED' | 'MASTER' | 'USER' | 'PO MASTER' | "INVENTORY" | "ISSUE" | "STORE IN" | "TALLY ENTRY" | "PC REPORT" | "Fullkitting" | "Payment History" ;

export type IndentSheet = {
    issuedStatus: any;
    timestamp: string;
    indent_number: string;
    firm_name: string;
    indenter_name: string;
    department: string;
    area_of_use: string;
    group_head: string;
    product_name: string;
    quantity: number;
    uom: string;
    specifications: string;
    indent_approved_by: string;
    indent_type: string;
    attachment: string;
     indent_status: string;
    no_day: number;
    planned1: string;
    actual1: string;
    time_delay1: string;
    vendor_type: string;
    approved_quantity: number;
    planned2: string;
    actual2: string;
    time_delay2: string;
    vendor_name1: string;
    select_rate_type1: string;
    rate1: number;
    with_tax_or_not1: string;
    tax_value1: string;
    payment_term1: string;
 whatsapp_number1: string;
 email_id1: string;
    vendor_name2: string;
      select_rate_type2: string;
    rate2: number;
      with_tax_or_not2: string;
        tax_value2: string;
    payment_term2: string;
    whatsapp_number2: string;
 email_id2: string;
    vendor_name3: string;
     select_rate_type3: string;
    rate3: number;
     with_tax_or_not3: string;
        tax_value3: string;
    payment_term3: string;
     whatsapp_number3: string;
 email_id3: string;
 product_code: string;
    comparison_sheet: string;
    planned3: string;
    actual3: string;
    time_delay3: string;
    approved_vendor_name: string;
    approved_rate: number;
     with_tax_or_not4: string;
        tax_value4: string;
    approved_payment_term: string;
    approved_date: string;
    planned4: string;
    actual4: string;
    time_delay4: string;
    po_number: string;
    po_copy: string;
    payment_term: string;
    planned5: string;
    actual5: string;
    time_delay: string;
     pending_po_qty: number;
    status: string;
    po_qty: string;
    total_qty: number;
    received_qty: number;
    // receive_status: string;
    // planned6: string;
    // actual6: string;
    // time_delay6: string;
    approved_by: string;
    approval_date: string;
    issued_quantity: number;
    notes: string;
    planned7: string;
    actual7: string;
    time_delay7: string;
    bill_status: string;
    bill_number: string;
    qty: number;
    lead_time_to_lift_material: string;
    type_of_bill: string;
    bill_amount: number;
    discount_amount: number;
    // payment_type: string;
    advance_amount_if_any: number;
    photo_of_bill: string;
   
   

     rowIndex: string;
    // issue_status: string;
    make_payment_link: string;
    lifting_status: string;
     pending_lift_qty: number
    firm_name_match: string;
    po_requred: string; 
    vendor_rate: number;
    vendor_amount: number;
    delivery_date: string;
     payment_type: string;

    // pendingLiftQty: number;
   
    // advanceIfAny: string;
    


};

export type PaymentHistory = {
    id: string;
    timestamp: string;
    ap_payment_number?: string;
    status: string;
    unique_number?: string;
    fms_name?: string;
    pay_to?: string;
    amount_to_be_paid?: number;
    remarks?: string;
    any_attachments?: string;
    
    // Alternative field names
    // 'AP-Payment Number'?: string;
    // Status?: string;
    // 'Unique Number'?: string;
    // UniqueNumber?: string;
    // uniqueNumber?: string;
    // 'Fms Name'?: string;
    // 'Pay To'?: string;
    // 'Amount To Be Paid'?: number;
    // amountToBePaid?: number;
    // Remarks?: string;
    // 'Any Attachments'?: string;
};


export type ReceivedSheet = {
    timestamp: string;
    indentNumber: string;
    poDate: string;
    poNumber: string;
    vendor: string;
    receivedStatus: string;
    receivedQuantity: number;
    uom: string;
    photoOfProduct: string;
    warrantyStatus: string;
    endDate: string;
    billStatus: string;
    billNumber: string;
    billAmount: number;
    photoOfBill: string;
    anyTransportations: string;
    transporterName: string;
    transportingAmount: number;

    actual6: string;
    damageOrder: string;
    quantityAsPerBill: string;
    priceAsPerPo: string;
    remark: string;
};

export type InventorySheet = {
    group_head: string;
    item_name: string;
    uom: string;
    max_level: number;
    opening: number;
    individual_rate: number;
    indented: number;
    approved: number;
    purchase_quantity: number;
    out_quantity: number;
    current: number;
    total_price: number;
    color_code: string;
};


export type PoMasterSheet = {
    discountPercent: number;
    gstPercent: number;
    timestamp: string;
    party_name: string;
    po_number: string;
    internal_code: string;
    product: string;
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    gst: number;
    discount: number;
    amount: number;
    total_po_amount: number;
    // preparedBy: string;
    // approvedBy: string;
    pdf: string;
    quotation_number: string;
    quotation_date: string;
    enquiry_number: string;
    enquiry_date: string;
    term1: string;
    term2: string;
    term3: string;
    term4: string;
    term5: string;
    term6: string;
    term7: string;
    term8: string;
    term9: string;
    term10: string;
    delivery_days: number;
    delivery_type: string;
    firm_name_match: string;

};

export type Vendor = {
    vendorName: string;
    gstin: string;
    address: string;
    email: string;
};


// Update your type to match the actual database structure
export type MasterSheetItem = {
    id: number;
    vendor_name: string;
    payment_term: string; // Changed from payment_terms
    department: string;
    vendor_gstin: string;
    vendor_address: string;
    vendor_email: string;
    company_name: string;
    company_address: string;
    company_gstin: string;
    company_phone: string;
    billing_address: string;
    company_pan: string;
    destination_address: string;
    uom: string;
    firm_name: string;
    group_head: string; // Added this field
    item_name: string; // Added this field (product name)
    default_terms: string; // Added this field
    company_email: string; // Added this field
    person_name: string; // Added this field
    where: string; // Added this field
    fms_name: string; // Added this field
};

// If you need the aggregated structure, keep both types
export type MasterSheet = {
    items: MasterSheetItem[];
    vendorNames: string[];
    paymentTerms: string[];
    departments: string[];
    groupHeads: Record<string, string[]>;
    companyName: string;
    companyAddress: string;
    companyGstin: string;
    companyPhone: string;
    billingAddress: string;
    companyPan: string;
    destinationAddress: string;
    defaultTerms: string[];
    uoms: string[];
    firmsnames: string[];
    firms: string[];
    fmsNames: string[];
    firmCompanyMap: Record<string, { companyName: string; companyAddress: string; destinationAddress: string; }>;
};

// export type MasterSheet = {
//     vendors: Vendor[];
//     vendorNames: string[];
//     paymentTerms: string[];
//     departments: string[];
//     groupHeads: Record<string, string[]>; // category: items[]
//     companyName: string;
//     companyAddress: string;
//     companyGstin: string;
//     companyPhone: string;
//     billingAddress: string;
//     companyPan: string;
//     destinationAddress: string;
//     defaultTerms: string[];
//     uoms: string[];
//     firmsnames: string[];
//     firms: string[];
//     fmsNames: string[];
//     firmCompanyMap: Record<string, { companyName: string; companyAddress: string; destinationAddress: string; }>;
// };



export interface UserPermissions {
    id: number;
  user_name: string;
  password: string;
  name: string;
  administrate: boolean;
  store_issue: string;
  issue_data: string;
  inventory: boolean;
  create_indent: boolean;
  // Permissions fields
  create_po: boolean;
  indent_approval_view: boolean;
  indent_approval_action: boolean;
  update_vendor_view: boolean;
  update_vendor_action: boolean;
  three_party_approval_view: boolean;
  three_party_approval_action: boolean;
  receive_item_view: boolean;
  receive_item_action: boolean;
  store_out_approval_view: boolean;
  store_out_approval_action: boolean;
  pending_indents_view: boolean;
  orders_view: boolean;
  again_auditing: boolean;
  take_entry_by_telly: boolean;
  reaudit_data: boolean;
  rectify_the_mistake: boolean;
  audit_data: boolean;
  send_debit_note: boolean;
  return_material_to_party: boolean;
  exchange_materials: boolean;
  instead_of_quality_check_in_received_item: boolean;
  db_for_pc: boolean;
  bill_not_received: boolean;
  store_in: boolean;
  po_history: boolean;
  firm_name_match:string;
}

export const allPermissionKeys = [
    "administrate",
    "store_issue",          // was "storeIssue"
    "issue_data",           // was "issueData" 
    "inventory",
    "create_indent",        // was "createIndent"
    "create_po",            // was "createPo"
    "indent_approval_view", // was "indentApprovalView"
    "indent_approval_action", // was "indentApprovalAction"
    "update_vendor_view",   // was "updateVendorView"
    "update_vendor_action", // was "updateVendorAction"
    "three_party_approval_view", // was "threePartyApprovalView"
    "three_party_approval_action", // was "threePartyApprovalAction"
    "receive_item_view",    // was "receiveItemView"
    "receive_item_action",  // was "receiveItemAction"
    "store_out_approval_view", // was "storeOutApprovalView"
    "store_out_approval_action", // was "storeOutApprovalAction"
    "pending_indents_view", // was "pendingIndentsView"
    "orders_view",          // was "ordersView"
    "again_auditing",       // was "againAuditing"
    "take_entry_by_telly",  // was "takeEntryByTelly"
    "reaudit_data",         // was "reauditData"
    "rectify_the_mistake",  // was "rectifyTheMistake"
    "audit_data",           // was "auditData"
    "send_debit_note",      // was "sendDebitNote"
    "return_material_to_party", // was "returnMaterialToParty"
    "exchange_materials",   // was "exchangeMaterials"
    "instead_of_quality_check_in_received_item", // was "insteadOfQualityCheckInReceivedItem"
    "db_for_pc",            // was "dbForPc"
    "bill_not_received",    // was "billNotReceived"
    "store_in",             // was "storeIn"
    "po_history",           // was "poHistory"
    "firm_name_match",      // was "firmNameMatch"
] as const;



export type IssueSheet = {
    timestamp: string;
    //  rowIndex: number;
    issue_no: string;  // Changed from issueNumber to match "Issue No" -> issueNo
    issue_to: string;  // Maps to "Issue to" column
    uom: string;
    group_head: string;
    product_name: string;
    quantity: number;
    department: string;  // Maps to "Store Status" column  


    planned1?: string;
    actual1?: string;
    time_delay1?: string;
    status: string;
    given_qty?: number;    // Changed from givenQuantity to match "Given Qty" -> givenQty

    // Remove fields that don't exist in the sheet:
    // department, groupHead, specifications, etc.
}



export type StoreInSheet = {
    // rowIndex?: number;
    timestamp: string;
    lift_number: string;
    po_number: string;
     indent_no: string;
     
    bill_no: string;
    vendor_name: string;
    product_name: string;
     bill_status: string;

    qty: number;
    lead_time_to_lift_material: number;
    discount_amount: number;
    type_of_bill: string;
   bill_amount: number;
    
    payment_type: string;
    advance_amount_if_any: string;
    photo_of_bill: string;
    transportation_include: string;
    transporter_name: string;
    amount: number;
     vehicle_no: string;
    driver_name: string;
    driver_mobile_no: string;
     bill_remark: string;

      planned6: string;
    actual6: string;
    time_delay6: string;
 received_quantity: number;
    photo_of_product: string;
    damage_order: string;
    quantity_as_per_bill: number;
    remark: string;


    warranty_status: string;
    end_date_warrenty: string;
   
    sendDebitNote: string;
    receiving_status: string;
   
   

    unitOfMeasurement: string;
    priceAsPerPo: number;
    
    debitNoteCopy: string;



    planned7: string;
    actual7: string;
    time_delay7: string;
    status: string;
     bill_copy_attached: string;
    reason: string;
    send_debit_note: string;
 planned9: string;
    actual9: string;
    time_delay9: string;
debit_note_copy: string;
debit_note_number: string;

 planned11: string;
    actual11: string;
     time_delay: string;
    bill_status_new: string;
 bill_image_status: string;

  indent_date: string;
       indent_qty: string;
       purchase_date: string;
       material_date: string;
 party_name: string;
 location: string;
 area: string;
 not_bill_received_no: string;
 indent_for: string;
 approved_party_name: string;
 rate:string;
 total_rate: string;
bill_received2: string;


    planned8: string;
    actual8: string;
    delay8: string;
    statusPurchaser: string;
    // debitNoteCopy: string;
    returnCopy: string;
    planned10: string;
    actual10: string;
    timeDelay10: string;
    warrenty: string;
    billReceived: string;
    billAmount2: string;
    billImage: string;
    exchangeQty: string;
    billNumber2: string;
    po_date: string;
    poNumber: string;
    vendor: string; 
    indentNumber: string;
    product: string;
    uom: string;
    quantity: number;
    po_copy: string;
 materialStatus: string;


 lifting_status: string;
firm_name: string;
    firm_name_match: string;

}



export type TallyEntrySheet = {
    timestamp: string;
    indent_no: string;
    purchase_date: string;
    indent_date: string;
    indent_number: string;
    lift_number: string;
    po_number: string;
    material_in_date: string;
    product_name: string;
    bill_no: string;
    qty: number;
    party_name: string;
    bill_amt: number;
    bill_image: string;
    bill_received_later: string;
    not_received_bill_no: string;
    location: string;
    type_of_bills: string;
    product_image: string;
    area: string;
    indented_for: string;
    approved_party_name: string;
    rate: number;
    indent_qty: number;
    total_rate: number;
    planned1: string;
    actual1: string;
    delay1: string;
    status1: string;
    remarks1: string;
    planned2: string;
    actual2: string;
    delay2: string;
    status2: string;
    remarks2: string;
    planned3: string;
    actual3: string;
    delay3: string;
    status3: string;
    remarks3: string;
    planned4: string;
    actual4: string;
    delay4: string;
    status4: string;
    remarks4: string;
    planned5: string;
    actual5: string;
    status5: string;
    rowIndex: string;
    firm_name_match: string;
};

export type PcReportSheet = {
    stage: string;
    firmName?: string;
    totalPending: number | string;
    totalComplete: number | string;
    firmNameMatch?: string;
    pendingPmpl: string | number;
    pendingPurab: string | number;
    pendingPmmpl: string | number;
    pendingRefrasynth: string | number;
};


export type FullkittingSheet = {
    timestamp: string;
    indent_number: string;
    vendor_name: string;
    product_name: string;
    qty: number;
    bill_no: string;
    transporting_include: string;
    transporter_name: string;
    amount: number;
    vehicle_no: string;
    driver_name: string;
    driver_mobile_no: string;
    planned: string;
    actual: string;
    time_delay: string;
    fms_name: string;
    status?: string;
    vehicle_number?: string;
    from?: string;
    to?: string;
    material_load_details?: string;
    bilty_number?: number;
    rate_type?: string;
    amount1: number;
    bilty_image?: string;
    firm_name_match: string;
};