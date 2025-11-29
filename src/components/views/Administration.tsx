import { Eye, EyeClosed, MoreHorizontal, Pencil, ShieldUser, Trash, UserPlus } from 'lucide-react';
import Heading from '../element/Heading';
import { useEffect, useState } from 'react';
import { allPermissionKeys, type UserPermissions } from '@/types/sheets';
import type { ColumnDef } from '@tanstack/react-table';
import DataTable from '../element/DataTable';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { useAuth } from '@/context/AuthContext';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { PuffLoader as Loader } from 'react-spinners';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';
import { Pill } from '../ui/pill';
import supabase from '@/SupabaseClient';

interface UsersTableData {
    id: number;
    user_name: string;
    name: string;
    password: string;
    permissions: string[];
}

function camelToTitleCase(str: string): string {
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/^./, (char) => char.toUpperCase());
}

// Filter out non-boolean permission keys (store_issue and issue_data since they are strings)
const booleanPermissionKeys = allPermissionKeys.filter(
    key => key !== 'store_issue' && key !== 'issue_data' && key !== 'firm_name_match'
);

export default () => {
    const { user: currentUser } = useAuth();

    const [tableData, setTableData] = useState<UsersTableData[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UsersTableData | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!openDialog) {
            setSelectedUser(null);
            setShowPassword(false);
        }
    }, [openDialog]);

    async function fetchUsers() {
        setDataLoading(true);
        try {
            // Fetch from user table (correct table name)
            const { data, error } = await supabase
                .from('user')
                .select('*')
                .order('id', { ascending: true });

            if (error) {
                console.error('Error fetching users from Supabase:', error);
                toast.error('Failed to load users');
                setDataLoading(false);
                return;
            }

            console.log('Raw users data from Supabase:', data);

            if (!data || data.length === 0) {
                console.log('No users found in Supabase');
                setTableData([]);
                setDataLoading(false);
                return;
            }

            const usersData = data.map((user: any) => {
                console.log('Processing user:', user.user_name);
                
                // Get all boolean permissions that have "True" value (case-insensitive)
                const permissionKeys = booleanPermissionKeys.filter((key) => {
                    const value = user[key];
                    console.log(`Permission ${key}:`, value, typeof value);
                    
                    // Handle string "True" values (case-insensitive)
                    if (typeof value === 'string') {
                        const isTrue = value.toLowerCase() === 'true';
                        console.log(`  -> ${key} is ${isTrue ? 'TRUE' : 'FALSE'}`);
                        return isTrue;
                    }
                    // Handle boolean true
                    const isTrue = value === true;
                    console.log(`  -> ${key} is ${isTrue ? 'TRUE' : 'FALSE'}`);
                    return isTrue;
                });

                console.log(`Final permissions for ${user.user_name}:`, permissionKeys);

                return {
                    id: user.id,
                    user_name: user.user_name || 'N/A',
                    name: user.name || 'N/A',
                    password: user.password || '',
                    permissions: permissionKeys,
                };
            });

            console.log('Processed users data:', usersData);
            setTableData(usersData);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to load users');
        } finally {
            setDataLoading(false);
        }
    }

    useEffect(() => {
        fetchUsers();
    }, []);

    const columns: ColumnDef<UsersTableData>[] = [
        // { 
        //     accessorKey: 'id', 
        //     header: 'ID',
        //     cell: ({ row }) => <div className="font-medium">{row.original.id}</div>
        // },
        { 
            accessorKey: 'user_name', 
            header: 'Username',
            cell: ({ row }) => <div className="font-medium">{row.original.user_name}</div>
        },
        { 
            accessorKey: 'name', 
            header: 'Name',
            cell: ({ row }) => <div>{row.original.name}</div>
        },
        {
            accessorKey: 'permissions',
            header: 'Permissions',
            cell: ({ row }) => {
                const permissions = row.original.permissions;
                console.log(`Rendering permissions for ${row.original.user_name}:`, permissions);
                
                if (permissions.length === 0) {
                    return <span className="text-muted-foreground text-sm">No permissions</span>;
                }

                return (
                    <div className="flex justify-center">
                        <div className="flex flex-wrap gap-1 max-w-200">
                            {permissions.slice(0, 2).map((perm, i) => (
                                <Pill key={i} variant="secondary">
                                    {camelToTitleCase(perm)}
                                </Pill>
                            ))}
                            {permissions.length > 2 && (
                                <HoverCard>
                                    <HoverCardTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-6 px-2">
                                            +{permissions.length - 2}
                                        </Button>
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-auto max-w-300 p-3">
                                        <div className="flex flex-wrap gap-1">
                                            {permissions.map((perm, i) => (
                                                <Pill key={i} variant="secondary">
                                                    {camelToTitleCase(perm)}
                                                </Pill>
                                            ))}
                                        </div>
                                    </HoverCardContent>
                                </HoverCard>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const user = row.original;
                const isCurrentUser = user.user_name === currentUser?.user_name;
                const isAdmin = user.user_name === 'admin';

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild disabled={isAdmin || isCurrentUser}>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => {
                                    setSelectedUser(user);
                                    setOpenDialog(true);
                                }}
                                disabled={isAdmin}
                            >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Permissions
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={async () => {
                                    if (isAdmin || isCurrentUser) {
                                        toast.error('Cannot delete this user');
                                        return;
                                    }

                                    try {
                                        // Delete from user table
                                        const { error } = await supabase
                                            .from('user')
                                            .delete()
                                            .eq('id', user.id);

                                        if (error) {
                                            throw error;
                                        }

                                        toast.success(`Deleted ${user.name} successfully`);
                                        fetchUsers();
                                    } catch (error) {
                                        console.error('Failed to delete user:', error);
                                        toast.error('Failed to delete user');
                                    }
                                }}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete User
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const schema = z.object({
        name: z.string().min(1, 'Name is required'),
        user_name: z.string().min(1, 'Username is required'),
        password: z.string().min(1, 'Password is required'),
        permissions: z.array(z.string()),
    });

    const form = useForm<z.infer<typeof schema>>({ 
        resolver: zodResolver(schema),
        defaultValues: {
            user_name: '',
            name: '',
            password: '',
            permissions: [],
        }
    });

    useEffect(() => {
        if (selectedUser) {
            console.log('Setting form for selected user:', selectedUser);
            form.reset({
                user_name: selectedUser.user_name,
                name: selectedUser.name,
                password: selectedUser.password,
                permissions: selectedUser.permissions,
            });
        } else {
            form.reset({
                user_name: '',
                name: '',
                password: '',
                permissions: [],
            });
        }
    }, [selectedUser, form]);

    async function onSubmit(values: z.infer<typeof schema>) {
        // Check for duplicate username (only for new users or when username changed)
        if (!selectedUser || values.user_name !== selectedUser.user_name) {
            const usernameExists = tableData.some(user => 
                user.user_name.toLowerCase() === values.user_name.toLowerCase()
            );
            if (usernameExists) {
                toast.error('Username already exists');
                return;
            }
        }

        try {
            const userData: Record<string, any> = {
                user_name: values.user_name,
                name: values.name,
                password: values.password,
                store_issue: '', // Set default string values for non-boolean permissions
                issue_data: '',
                firm_name_match: '', // Add the firm_name_match field
            };

            // Set all boolean permissions - convert to string "True"/"False" to match your database
            booleanPermissionKeys.forEach((perm) => {
                userData[perm] = values.permissions.includes(perm) ? "True" : "False";
            });

            console.log('Submitting user data to Supabase:', userData);

            if (selectedUser) {
                // Update existing user in user table
                const { error } = await supabase
                    .from('user')
                    .update(userData)
                    .eq('id', selectedUser.id);

                if (error) throw error;
                toast.success('User updated successfully');
            } else {
                // Create new user in user table
                const { error } = await supabase
                    .from('user')
                    .insert([userData]);

                if (error) throw error;
                toast.success('User created successfully');
            }

            setOpenDialog(false);
            fetchUsers();
        } catch (error) {
            console.error('Failed to save user:', error);
            toast.error(`Failed to ${selectedUser ? 'update' : 'create'} user`);
        }
    }

    function onError(errors: any) {
        console.log('Form errors:', errors);
        toast.error('Please fill all required fields correctly');
    }

    return (
        <div className="p-6">
            <Heading
                heading="Administration"
                subtext="Manage permissions and users for the app"
            >
                <ShieldUser size={40} className="text-primary" />
            </Heading>

            <div className="mb-4 flex gap-2">
                <Button 
                    onClick={() => {
                        console.log('Current table data:', tableData);
                        console.log('All permission keys:', allPermissionKeys);
                        console.log('Boolean permission keys:', booleanPermissionKeys);
                        fetchUsers();
                    }} 
                    variant="outline" 
                    size="sm"
                >
                    Refresh & Debug
                </Button>
            </div>

     <div className="space-y-4">
    <Button
        onClick={() => {
            setOpenDialog(true);
            setSelectedUser(null);
        }}
        className="flex items-center gap-2"
    >
        <UserPlus size={16} />
        Create User
    </Button>
    
    <DataTable
        data={tableData}
        columns={columns}
        searchFields={['name', 'user_name']}
        dataLoading={dataLoading}
        className="h-[70dvh]"
    />
</div>

            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                            <DialogHeader>
                                <DialogTitle className="text-xl">
                                    {selectedUser ? 'Edit User' : 'Create New User'}
                                </DialogTitle>
                            </DialogHeader>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="user_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Username *</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="Enter username" 
                                                    {...field}
                                                    disabled={selectedUser?.user_name === 'admin'}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter full name"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password *</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? 'text' : 'password'}
                                                        placeholder="Enter password"
                                                        {...field}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? 
                                                            <EyeClosed className="h-4 w-4" /> : 
                                                            <Eye className="h-4 w-4" />
                                                        }
                                                    </Button>
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="permissions"
                                render={() => (
                                    <FormItem>
                                        <FormLabel className="text-base">Permissions</FormLabel>
                                        <div className="grid md:grid-cols-3 gap-3 p-4 border rounded-lg bg-muted/50">
                                            {booleanPermissionKeys.map((perm) => (
                                                <FormField
                                                    key={perm}
                                                    control={form.control}
                                                    name="permissions"
                                                    render={({ field }) => (
                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(perm)}
                                                                    onCheckedChange={(checked) => {
                                                                        const values = field.value || [];
                                                                        if (checked) {
                                                                            field.onChange([...values, perm]);
                                                                        } else {
                                                                            field.onChange(values.filter(p => p !== perm));
                                                                        }
                                                                    }}
                                                                    disabled={selectedUser?.user_name === 'admin' && perm === 'administrate'}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="text-sm font-normal cursor-pointer">
                                                                {camelToTitleCase(perm)}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="gap-2 sm:gap-0">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button 
                                    type="submit" 
                                    disabled={form.formState.isSubmitting}
                                    className="min-w-20"
                                >
                                    {form.formState.isSubmitting ? (
                                        <Loader size={20} color="white" />
                                    ) : (
                                        selectedUser ? 'Save Changes' : 'Create User'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
};