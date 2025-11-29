import Heading from '../element/Heading';
import {
    CalendarIcon,
    ClipboardList,
    LayoutDashboard,
    PackageCheck,
    Truck,
    Warehouse,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartTooltip, type ChartConfig } from '../ui/chart';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { ComboBox } from '../ui/combobox';
import supabase from '@/SupabaseClient';

function CustomChartTooltipContent({
    payload,
    label,
}: {
    payload?: { payload: { quantity: number; frequency: number } }[];
    label?: string;
}) {
    if (!payload?.length) return null;

    const data = payload[0].payload;

    return (
        <div className="rounded-md border bg-white px-3 py-2 shadow-sm text-sm">
            <p className="font-medium">{label}</p>
            <p>Quantity: {data.quantity}</p>
            <p>Frequency: {data.frequency}</p>
        </div>
    );
}

export default function Dashboard() {
    const [chartData, setChartData] = useState<
        {
            name: string;
            quantity: number;
            frequency: number;
        }[]
    >([]);
    const [topVendorsData, setTopVendors] = useState<
        {
            name: string;
            orders: number;
            quantity: number;
        }[]
    >([]);

    // Items
    const [indent, setIndent] = useState({ count: 0, quantity: 0 });
    const [purchase, setPurchase] = useState({ count: 0, quantity: 0 });
    const [out, setOut] = useState({ count: 0, quantity: 0 });
    const [alerts, setAlerts] = useState({ lowStock: 0, outOfStock: 0 });
    const [pendingApprovalCount, setPendingApprovalCount] = useState(0);

    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    const [filteredVendors, setFilteredVendors] = useState<string[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<string[]>([]);
    const [allVendors, setAllVendors] = useState<string[]>([]);
    const [allProducts, setAllProducts] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch data from Supabase
const fetchData = async () => {
    setLoading(true);
    try {
        // Fetch indent data
        let indentQuery = supabase.from('indent').select('*');
        
        if (startDate) {
            indentQuery = indentQuery.gte('timestamp', startDate.toISOString());
        }
        if (endDate) {
            indentQuery = indentQuery.lte('timestamp', endDate.toISOString());
        }

        const { data: indentData, error: indentError } = await indentQuery;
        if (indentError) throw indentError;

        // Fetch received data (keeping for reference, but not used for purchases now)
        let receivedQuery = supabase.from('received').select('*');
        
        if (startDate) {
            receivedQuery = receivedQuery.gte('timestamp', startDate.toISOString());
        }
        if (endDate) {
            receivedQuery = receivedQuery.lte('timestamp', endDate.toISOString());
        }

        const { data: receivedData, error: receivedError } = await receivedQuery;
        if (receivedError) throw receivedError;

        // Fetch issue data
        let issueQuery = supabase.from('issue').select('*');
        
        if (startDate) {
            issueQuery = issueQuery.gte('timestamp', startDate.toISOString());
        }
        if (endDate) {
            issueQuery = issueQuery.lte('timestamp', endDate.toISOString());
        }

        const { data: issueData, error: issueError } = await issueQuery;
        if (issueError) throw issueError;

        // Fetch store_in data for purchases
        let storeInQuery = supabase.from('store_in').select('*');
        
        if (startDate) {
            storeInQuery = storeInQuery.gte('timestamp', startDate.toISOString());
        }
        if (endDate) {
            storeInQuery = storeInQuery.lte('timestamp', endDate.toISOString());
        }

        const { data: storeInData, error: storeInError } = await storeInQuery;
        if (storeInError) throw storeInError;

        // Fetch inventory data
        const { data: inventoryData, error: inventoryError } = await supabase
            .from('inventory')
            .select('*');

        if (inventoryError) throw inventoryError;

        // Process the data with all tables
        processDashboardData(
            indentData || [], 
            receivedData || [], 
            inventoryData || [], 
            issueData || [],
            storeInData || []
        );

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    } finally {
        setLoading(false);
    }
};

const processDashboardData = (indentData: any[], receivedData: any[], inventoryData: any[], issueData: any[], storeInData: any[]) => {
    // Set all vendors and products
    const vendors = Array.from(new Set(indentData.map((item) => item.approved_vendor_name).filter(Boolean)));
    const products = Array.from(new Set(indentData.map((item) => item.product_name).filter(Boolean)));
    setAllVendors(vendors);
    setAllProducts(products);

    // Apply vendor and product filters
    let filteredIndents = indentData;
    let filteredReceived = receivedData;
    let filteredIssues = issueData;
    let filteredStoreIn = storeInData;

    if (filteredVendors.length > 0) {
        filteredIndents = filteredIndents.filter(item => 
            filteredVendors.includes(item.approved_vendor_name)
        );
        filteredReceived = filteredReceived.filter(item => 
            filteredVendors.includes(item.vendor)
        );
        filteredStoreIn = filteredStoreIn.filter(item => 
            filteredVendors.includes(item.vendor_name)
        );
    }

    if (filteredProducts.length > 0) {
        filteredIndents = filteredIndents.filter(item => 
            filteredProducts.includes(item.product_name)
        );
        filteredReceived = filteredReceived.filter(item => 
            filteredProducts.includes(item.product_name)
        );
        filteredIssues = filteredIssues.filter(item => 
            filteredProducts.includes(item.product_name)
        );
        filteredStoreIn = filteredStoreIn.filter(item => 
            filteredProducts.includes(item.product_name)
        );
    }

    // Calculate metrics
    // Total Approved Indents - with text to number conversion
    const approvedIndents = filteredIndents.filter(item => {
        const approvedQty = parseFloat(item.approved_quantity) || 0;
        return approvedQty > 0;
    });

    const totalApprovedQuantity = approvedIndents.reduce((sum, item) => {
        const approvedQty = parseFloat(item.approved_quantity) || 0;
        return sum + approvedQty;
    }, 0);

    // Pending Approval Count (planned1 not null and actual1 null)
    const pendingApprovals = filteredIndents.filter(item => 
        item.planned1 !== null && item.planned1 !== '' && item.actual1 === null
    );
    setPendingApprovalCount(pendingApprovals.length);

    // Total Purchases - from store_in table
    const totalPurchaseCount = filteredStoreIn.length; // Count of rows in store_in table
    
    const totalPurchasedQuantity = filteredStoreIn.reduce((sum, item) => {
        const storeInQty = parseFloat(item.qty) || 0;
        return sum + storeInQty;
    }, 0);

    // Total Issued - from issue table
    const totalIssuedCount = filteredIssues.length; // Count of rows in issue table
    
    const totalIssuedQuantity = filteredIssues.reduce((sum, item) => {
        const givenQty = parseFloat(item.quantity) || 0;
        return sum + givenQty;
    }, 0);

    // Top Products - using store_in data
    const productMap = new Map();
    filteredStoreIn.forEach(item => {
        const productName = item.product_name;
        if (productName) {
            const current = productMap.get(productName) || { freq: 0, quantity: 0 };
            const storeInQty = parseFloat(item.qty) || 0;
            productMap.set(productName, {
                freq: current.freq + 1,
                quantity: current.quantity + storeInQty
            });
        }
    });

    const topProducts = Array.from(productMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.freq - a.freq)
        .slice(0, 10);

    setChartData(topProducts.map(p => ({ 
        frequency: p.freq, 
        quantity: p.quantity, 
        name: p.name 
    })));

    // Top Vendors - using store_in data
    const vendorMap = new Map();
    filteredStoreIn.forEach(item => {
        const vendorName = item.vendor_name;
        if (vendorName) {
            const current = vendorMap.get(vendorName) || { orders: 0, quantity: 0 };
            const storeInQty = parseFloat(item.qty) || 0;
            vendorMap.set(vendorName, {
                orders: current.orders + 1,
                quantity: current.quantity + storeInQty
            });
        }
    });

    const topVendors = Array.from(vendorMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 10);

    setTopVendors(topVendors);

    // Set main metrics
    setIndent({ 
        quantity: totalApprovedQuantity, 
        count: approvedIndents.length 
    });
    
    setPurchase({ 
        quantity: totalPurchasedQuantity, 
        count: totalPurchaseCount 
    });
    
    setOut({ 
        quantity: totalIssuedQuantity, 
        count: totalIssuedCount 
    });

    // Inventory alerts
    const lowStockCount = inventoryData.filter(item => {
        const currentStock = parseFloat(item.current) || 0;
        return item.color_code?.toLowerCase() === 'red' && currentStock > 0;
    }).length;
    
    // Out of Stock - sum of given_qty from issue data
    const outOfStockSum = filteredIssues.reduce((sum, item) => {
        const givenQty = parseFloat(item.given_qty) || 0;
        return sum + givenQty;
    }, 0);
    
    setAlerts({ lowStock: lowStockCount, outOfStock: outOfStockSum });
};

    useEffect(() => {
        fetchData();
    }, [startDate, endDate, filteredVendors, filteredProducts]);

    const chartConfig = {
        quantity: {
            label: 'Quantity',
            color: 'var(--color-primary)',
        },
    } satisfies ChartConfig;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">Loading dashboard data...</div>
            </div>
        );
    }

    return (
        <div>
            <Heading heading="Dashboard" subtext="View your analytics">
                <LayoutDashboard size={50} className="text-primary" />
            </Heading>

            <div className="grid gap-3 m-3">
                <div className="gap-3 grid grid-cols-2 md:grid-cols-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                data-empty={!startDate}
                                className="data-[empty=true]:text-muted-foreground w-full min-w-0 justify-start text-left font-normal"
                            >
                                <CalendarIcon />
                                {startDate ? (
                                    format(startDate, 'PPP')
                                ) : (
                                    <span>Pick a start date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                        </PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                data-empty={!endDate}
                                className="data-[empty=true]:text-muted-foreground w-full min-w-0 justify-start text-left font-normal"
                            >
                                <CalendarIcon />
                                {endDate ? format(endDate, 'PPP') : <span>Pick a end date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                        </PopoverContent>
                    </Popover>
                    <ComboBox
                        multiple
                        options={allVendors.map((v) => ({ label: v, value: v }))}
                        value={filteredVendors}
                        onChange={setFilteredVendors}
                        placeholder="Select Vendors"
                    />
                    <ComboBox
                        multiple
                        options={allProducts.map((v) => ({ label: v, value: v }))}
                        value={filteredProducts}
                        onChange={setFilteredProducts}
                        placeholder="Select Products"
                    />
                </div>

                <div className="grid md:grid-cols-4 gap-3">
                    <Card className="bg-gradient-to-br from-transparent to-blue-500/10">
                        <CardContent>
                            <div className="text-blue-500 flex justify-between">
                                <p className="font-semibold">Total Approved Indents</p>
                                <ClipboardList size={18} />
                            </div>
                            <p className="text-3xl font-bold text-blue-800">{indent.count}</p>
                            {/* <div className="text-blue-500 flex justify-between">
                                <p className="text-sm ">Pending Approval</p>
                                <p className="font-semibold">{pendingApprovalCount}</p>
                            </div> */}
                            <div className="text-blue-500 flex justify-between">
                                <p className="text-sm ">Indented Quantity</p>
                                <p>{indent.quantity}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-transparent to-green-500/10">
                        <CardContent>
                            <div className="text-green-500 flex justify-between">
                                <p className="font-semibold">Total Purchases</p>
                                <Truck size={18} />
                            </div>
                            <p className="text-3xl font-bold text-green-800">{purchase.count}</p>
                            <div className="text-green-500 flex justify-between">
                                <p className="text-sm ">Purchased Quantity</p>
                                <p>{purchase.quantity}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-transparent to-orange-500/10">
                        <CardContent>
                            <div className="text-orange-500 flex justify-between">
                                <p className="font-semibold">Total Issued</p>
                                <PackageCheck size={18} />
                            </div>
                            <p className="text-3xl font-bold text-orange-800">{out.count}</p>
                            <div className="text-orange-500 flex justify-between">
                                <p className="text-sm ">Out Quantity</p>
                                <p>{out.quantity}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-transparent to-yellow-500/10 text-yellow-500 ">
                        <CardContent>
                            <div className="flex justify-between">
                                <p className="font-semibold">Out of Stock</p>
                                <Warehouse size={18} />
                            </div>
                            <p className="text-3xl font-bold text-yellow-800">
                                {alerts.outOfStock}
                            </p>
                            <div className="text-yellow-500 flex justify-between">
                                <p className="text-sm ">Low in Stock</p>
                                <p>{alerts.lowStock}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <Card className="w-[55%] md:min-w-150 flex-grow">
                        <CardHeader>
                            <CardTitle className="text-xl">Top Purchased Products</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer className="max-h-80 w-full" config={chartConfig}>
                                <BarChart
                                    accessibilityLayer
                                    data={chartData}
                                    layout="vertical"
                                    margin={{
                                        right: 16,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="barGradient"
                                            x1="0"
                                            y1="0"
                                            x2="1"
                                            y2="0"
                                        >
                                            <stop offset="100%" stopColor="#3b82f6" />
                                            <stop offset="0%" stopColor="#2563eb" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid horizontal={false} />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        tickFormatter={(value: any) => value.slice(0, 3)}
                                        hide
                                    />
                                    <XAxis dataKey="frequency" type="number" hide />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<CustomChartTooltipContent />}
                                    />
                                    <Bar
                                        dataKey="frequency"
                                        layout="vertical"
                                        fill="url(#barGradient)"
                                        radius={4}
                                    >
                                        <LabelList
                                            dataKey="name"
                                            position="insideLeft"
                                            offset={8}
                                            className="fill-(--color-background) font-semibold"
                                            fontSize={12}
                                        />
                                        <LabelList
                                            dataKey="frequency"
                                            position="insideRight"
                                            offset={8}
                                            className="fill-(--color-background) font-semibold"
                                            fontSize={12}
                                        />
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    <Card className="flex-grow min-w-60 w-[40%]">
                        <CardHeader>
                            <CardTitle className="text-xl">Top Vendors</CardTitle>
                        </CardHeader>
                        <CardContent className="text-base grid gap-2">
                            {topVendorsData.map((vendor, i) => (
                                <div className="flex justify-between" key={i}>
                                    <p className="font-semibold text-md">{vendor.name}</p>
                                    <div className="flex gap-5">
                                        <p>{vendor.orders} Orders</p>
                                        <p>{vendor.quantity} Items</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}