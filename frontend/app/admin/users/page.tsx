"use client";

import { useEffect, useState } from "react";
import { userService } from "@/services/user.service";
import { roleService, Role, AssignRoleRequest } from "@/services/role.service";
import { permissionService, Permission } from "@/services/permission.service";
import { AuthUser } from "@/services/auth.service";
import {
    Users,
    Plus,
    Search,
    Shield,
    Mail,
    Phone,
    X,
    Check,
    Filter,
    Coins
} from "lucide-react";
import UserActionsMenu from "@/components/shared/UserActionsMenu";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [permissionSearch, setPermissionSearch] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
    const [transferUser, setTransferUser] = useState<AuthUser | null>(null);
    const [transferAmount, setTransferAmount] = useState("");
    const [transferLoading, setTransferLoading] = useState(false);
    const [transferError, setTransferError] = useState("");
    const [transferSuccess, setTransferSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [createError, setCreateError] = useState("");
    const [assignError, setAssignError] = useState("");

    const [createForm, setCreateForm] = useState({
        name: "",
        phone: "",
        dashboard: "user",
        roles: [] as string[],
        permissions: [] as string[],
    });

    const [assignRoleForm, setAssignRoleForm] = useState<AssignRoleRequest>({
        userId: "",
        roles: [],
        permissions: [],
        dashboard: "user"
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [usersRes, rolesRes, permRes] = await Promise.all([
                userService.getAllUsers(),
                roleService.getAllRoles(),
                permissionService.getAll(),
            ]);
            if (usersRes.success) setUsers(usersRes.data);
            if (rolesRes.success) setRoles(rolesRes.data);
            if (permRes.success) setPermissions(permRes.data);
        } catch (err) {
            console.error("Failed to load data", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateUser(e: React.FormEvent) {
        e.preventDefault();
        setCreateError("");
        setSubmitting(true);
        try {
            await userService.createUser({
                ...createForm,
                roles: createForm.roles.slice(0, 1)
            });
            setShowCreateModal(false);
            resetCreateForm();
            loadData();
        } catch (err) {
            setCreateError(getApiErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleAssignRole(e: React.FormEvent) {
        e.preventDefault();
        setAssignError("");
        setSubmitting(true);
        try {
            await roleService.assignRole({
                ...assignRoleForm,
                roles: (assignRoleForm.roles || []).slice(0, 1)
            });
            setShowAssignRoleModal(false);
            setSelectedUser(null);
            resetAssignRoleForm();
            loadData();
        } catch (err) {
            setAssignError(getApiErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleTransferSubmit(e: React.FormEvent) {
        e.preventDefault();
        setTransferError("");
        setTransferSuccess("");
        setTransferLoading(true);
        
        // Validate amount
        const amount = Number(transferAmount);
        if (isNaN(amount) || amount <= 0) {
            setTransferError("Please enter a valid amount");
            setTransferLoading(false);
            return;
        }

        try {
            // Dynamic import with error handling
            let rmcoinService;
            try {
                const module = await import("@/services/rmcoin.service");
                rmcoinService = module.rmcoinService;
            } catch (importError) {
                console.error("Failed to import rmcoin.service:", importError);
                setTransferError("Service unavailable. Please try again.");
                setTransferLoading(false);
                return;
            }

            const userId = transferUser?._id || transferUser?.id;
            if (!userId) {
                setTransferError("Invalid user ID");
                setTransferLoading(false);
                return;
            }

            const res = await rmcoinService.adminTransferToUser(userId, amount);
            
            if (res?.data?.success) {
                setTransferSuccess("Transfer successful!");
                // Clear form after success
                setTimeout(() => {
                    setShowTransferModal(false);
                    setTransferUser(null);
                    setTransferAmount("");
                }, 1500);
                loadData();
            } else {
                throw new Error(res?.data?.message || "Transfer failed");
            }
        } catch (err: any) {
            console.error("Transfer error:", err);
            setTransferError(err?.message || "Transfer failed. Please try again.");
        } finally {
            setTransferLoading(false);
        }
    }

    const resetCreateForm = () => {
        setCreateForm({
            name: "",
            phone: "",
            dashboard: "user",
            roles: [],
            permissions: [],
        });
    };

    const resetAssignRoleForm = () => {
        setAssignRoleForm({
            userId: "",
            roles: [],
            permissions: [],
            dashboard: "user"
        });
    };

    const openAssignRoleModal = (user: AuthUser) => {
        const primaryRole = user.roles?.[0];
        setSelectedUser(user);
        setAssignRoleForm({
            userId: user._id || user.id || "",
            roles: primaryRole ? [primaryRole] : [],
            permissions: user.permissions || [],
            dashboard: user.dashboard || "user"
        });
        setShowAssignRoleModal(true);
    };

    const openTransferModal = (user: AuthUser) => {
        setTransferUser(user);
        setTransferAmount("");
        setTransferError("");
        setTransferSuccess("");
        setShowTransferModal(true);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.phone && user.phone.includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRole = !roleFilter || (user.roles && user.roles.includes(roleFilter));

        return matchesSearch && matchesRole;
    });

    const filteredPermissions = permissions.filter((perm) => {
        if (!permissionSearch.trim()) return true;
        const q = permissionSearch.toLowerCase();
        return perm.label.toLowerCase().includes(q) || perm.key.toLowerCase().includes(q) || perm.category.toLowerCase().includes(q);
    });

    const permissionsByCategory = filteredPermissions.reduce<Record<string, Permission[]>>((acc, perm) => {
        if (!acc[perm.category]) acc[perm.category] = [];
        acc[perm.category].push(perm);
        return acc;
    }, {});

    const toggleRole = (roleKey: string) => {
        setAssignRoleForm(prev => {
            const isSame = prev.roles?.[0] === roleKey;
            const nextRoles = isSame ? [] : [roleKey];
            const rolePerms = roles.find(r => r.key === roleKey)?.permissions || [];
            return {
                ...prev,
                roles: nextRoles,
                permissions: isSame ? [] : [...rolePerms],
            };
        });
    };

    const toggleAssignPermission = (permKey: string) => {
        setAssignRoleForm(prev => ({
            ...prev,
            permissions: prev.permissions?.includes(permKey)
                ? prev.permissions.filter(p => p !== permKey)
                : [...(prev.permissions || []), permKey]
        }));
    };

    const selectAllAssignPermissions = () => {
        setAssignRoleForm(prev => ({
            ...prev,
            permissions: permissions.map(p => p.key),
        }));
    };

    const clearAssignPermissions = () => {
        setAssignRoleForm(prev => ({
            ...prev,
            permissions: [],
        }));
    };

    const toggleCreateRole = (roleKey: string) => {
        setCreateForm(prev => {
            const isSame = prev.roles[0] === roleKey;
            const nextRoles = isSame ? [] : [roleKey];
            const rolePerms = roles.find(r => r.key === roleKey)?.permissions || [];
            return {
                ...prev,
                roles: nextRoles,
                permissions: isSame ? [] : [...rolePerms],
            };
        });
    };

    const toggleCreatePermission = (permKey: string) => {
        setCreateForm(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permKey)
                ? prev.permissions.filter(p => p !== permKey)
                : [...prev.permissions, permKey]
        }));
    };

    const selectAllCreatePermissions = () => {
        setCreateForm(prev => ({
            ...prev,
            permissions: permissions.map(p => p.key),
        }));
    };

    const clearCreatePermissions = () => {
        setCreateForm(prev => ({
            ...prev,
            permissions: [],
        }));
    };

    const activeCount = users.filter((u) => u.isActive !== false).length;

    return (
        <div className="min-w-0 w-full overflow-x-hidden">
            <div className="space-y-6 pb-16 max-w-[1600px]">
                {/* Header + CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight truncate">
                            User Management
                        </h1>
                        <p className="text-gray-500 font-medium mt-1 text-sm sm:text-base">
                            Manage users, roles, and permissions.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center justify-center gap-2 bg-cyan-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-cyan-700 transition shadow-md active:scale-[0.98] shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        Add User
                    </button>
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total</p>
                        <p className="text-xl font-black text-gray-900 mt-0.5">{users.length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Active</p>
                        <p className="text-xl font-black text-emerald-600 mt-0.5">{activeCount}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm col-span-2 sm:col-span-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Filtered</p>
                        <p className="text-xl font-black text-cyan-600 mt-0.5">{filteredUsers.length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm col-span-2 sm:col-span-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Roles</p>
                        <p className="text-xl font-black text-gray-900 mt-0.5">{roles.length}</p>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3 sm:gap-4 min-w-0">
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                        <input
                            type="text"
                            placeholder="Search name, email, phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full min-w-0 pl-10 pr-3 py-2.5 sm:py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none text-sm sm:text-base font-medium text-gray-700"
                        />
                    </div>
                    <div className="relative shrink-0 sm:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full pl-10 pr-8 py-2.5 sm:py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none text-sm font-semibold text-gray-700 cursor-pointer appearance-none"
                        >
                            <option value="">All roles</option>
                            {roles.map((role) => (
                                <option key={role._id} value={role.key}>{role.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Mobile: card list | Desktop: table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-w-0">
                    {loading ? (
                        <div className="p-4 md:p-6 space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="px-4 md:px-6 py-16 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto flex items-center justify-center mb-3">
                                <Users className="text-gray-300" size={28} />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">No users found</h3>
                            <p className="text-sm text-gray-500 mt-1">Try different search or filters.</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile: cards */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {filteredUsers.map((user, idx) => (
                                    <div
                                        key={user._id || user.id || user.email || user.phone || idx}
                                        className="p-4 hover:bg-gray-50/50 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                {user.name && user.name.trim() ? user.name.charAt(0).toUpperCase() : "N/A"}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-gray-900 truncate">{user.name && user.name.trim() ? user.name : "N/A"}</p>
                                                        {user.phone && (
                                                            <p className="text-xs text-gray-600 truncate flex items-center gap-1 mt-0.5">
                                                                <Phone size={12} className="shrink-0 text-gray-400" />
                                                                {user.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="shrink-0 ml-2">
                                                        <UserActionsMenu 
                                                            user={user} 
                                                            onRoleClick={openAssignRoleModal} 
                                                            setTransferModal={openTransferModal} 
                                                        />
                                                    </div>
                                                </div>
                                                {user.email && (
                                                    <p className="text-xs text-gray-600 truncate flex items-center gap-1 mt-0.5">
                                                        <Mail size={12} className="shrink-0 text-gray-400" />
                                                        {user.email}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {user.roles?.length ? (
                                                        user.roles.map((r, i) => (
                                                            <span key={i} className="px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded-md text-[10px] font-bold uppercase">
                                                                {r}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase">
                                                        {user.dashboard || "user"}
                                                    </span>
                                                    {user.isActive !== false ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600">
                                                            <Check size={10} />
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600">Inactive</span>
                                                    )}
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-yellow-50 text-yellow-700 ml-1" title="RMDoctoCoin">
                                                        <Coins size={12} className="text-yellow-600" />
                                                        {user.rmcredit ?? 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop: table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left min-w-[800px]">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/80">
                                            <th className="px-4 lg:px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-500">User</th>
                                            <th className="px-4 lg:px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-500">Contact</th>
                                            <th className="px-4 lg:px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-500">Roles</th>
                                            <th className="px-4 lg:px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-500">Dashboard</th>
                                            <th className="px-4 lg:px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-500">Status</th>
                                            <th className="px-4 lg:px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-500">RMDoctoCoin</th>
                                            <th className="px-4 lg:px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-500 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredUsers.map((user, idx) => (
                                            <tr
                                                key={user._id || user.id || user.email || user.phone || idx}
                                                className="hover:bg-gray-50/70 transition-colors"
                                            >
                                                <td className="px-4 lg:px-6 py-4">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                            {user.name && user.name.trim() ? user.name.charAt(0).toUpperCase() : "N/A"}
                                                        </div>
                                                        <p className="font-bold text-gray-900 truncate">{user.name && user.name.trim() ? user.name : "N/A"}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 lg:px-6 py-4">
                                                    <div className="space-y-0.5 min-w-0">
                                                        {user.email && (
                                                            <p className="text-sm font-medium text-gray-600 truncate max-w-[180px]" title={user.email}>
                                                                <Mail size={10} className="inline text-gray-400 mr-1" />
                                                                {user.email}
                                                            </p>
                                                        )}
                                                        <p className="text-sm font-medium text-gray-600 truncate max-w-[180px]" title={user.phone}>
                                                            <Phone size={10} className="inline text-gray-400 mr-1" />
                                                            {user.phone}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-4 lg:px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roles?.length ? (
                                                            user.roles.map((r, i) => (
                                                                <span key={i} className="px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded-md text-[10px] font-bold uppercase">
                                                                    {r}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-gray-400">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 lg:px-6 py-4">
                                                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-bold uppercase">
                                                        {user.dashboard || "user"}
                                                    </span>
                                                </td>
                                                <td className="px-4 lg:px-6 py-4">
                                                    {user.isActive !== false ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                            <Check size={10} />
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-600">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 lg:px-6 py-4">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-bold bg-yellow-50 text-yellow-700" title="RMDoctoCoin">
                                                        <Coins size={14} className="text-yellow-600" />
                                                        {user.rmcredit ?? 0}
                                                    </span>
                                                </td>
                                                <td className="px-4 lg:px-6 py-4 text-right">
                                                    <UserActionsMenu 
                                                        user={user} 
                                                        onRoleClick={openAssignRoleModal} 
                                                        setTransferModal={openTransferModal} 
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-linear-to-r from-white via-cyan-50/60 to-white shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-600/20">
                                    <Plus size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Create New User</h2>
                                    <p className="text-sm font-medium text-gray-500">Create a profile with roles and permissions.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                                className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all hover:shadow-md shrink-0"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="flex-1 flex flex-col overflow-hidden">
                            {createError && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 text-sm px-8 py-3 mx-8 mt-4 rounded-2xl shrink-0">
                                    <X size={16} />
                                    <span>{createError}</span>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto px-8 py-6">
                                <div className="space-y-8">
                                    <div className="grid lg:grid-cols-2 gap-8">
                                        <div className="bg-gray-50/80 rounded-[28px] p-6 space-y-5 border border-gray-100">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Profile</p>
                                                <h3 className="text-lg font-black text-gray-900">Basic information</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">
                                                        Full Name <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        required
                                                        value={createForm.name}
                                                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                                        className="w-full bg-white border border-gray-200 focus:border-cyan-500 rounded-2xl py-3.5 px-5 outline-none transition-all font-semibold text-gray-800"
                                                        placeholder="John Doe"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">
                                                        Phone Number <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        required
                                                        type="tel"
                                                        value={createForm.phone}
                                                        onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                                                        className="w-full bg-white border border-gray-200 focus:border-cyan-500 rounded-2xl py-3.5 px-5 outline-none transition-all font-semibold text-gray-800"
                                                        placeholder="+1234567890"
                                                    />
                                                    <p className="text-xs text-gray-400 mt-1 ml-1">User will receive OTP on this number for login</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Dashboard Access</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {["user", "admin", "agent"].map((key) => (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            onClick={() => setCreateForm(prev => ({ ...prev, dashboard: key }))}
                                                            className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${createForm.dashboard === key ? "bg-cyan-600 text-white border-cyan-600" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"}`}
                                                        >
                                                            {key.charAt(0).toUpperCase() + key.slice(1)}
                                                        </button>
                                                    ))}
                                                    <select
                                                        value={createForm.dashboard}
                                                        onChange={(e) => setCreateForm({ ...createForm, dashboard: e.target.value })}
                                                        className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold bg-white text-gray-700"
                                                    >
                                                        <option value="doctor">Doctor</option>
                                                        <option value="marketing_agent">Marketing Agent</option>
                                                        <option value="receptionist">Receptionist</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-[28px] p-6 space-y-6 border border-gray-100">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Access Control</p>
                                                <h3 className="text-lg font-black text-gray-900">Roles & permissions</h3>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Roles</label>
                                                        <span className="text-[10px] font-bold text-gray-400">{createForm.roles.length}/1 selected</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                                                    {roles.map(role => (
                                                        <button
                                                            key={role._id}
                                                            type="button"
                                                            onClick={() => toggleCreateRole(role.key)}
                                                            className={`flex items-center justify-between w-full px-3 py-2 rounded-xl border text-sm font-semibold transition ${createForm.roles.includes(role.key)
                                                                ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                                                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"}`}
                                                        >
                                                            <span>{role.name}</span>
                                                            <span className="text-[10px] text-gray-400 font-bold">{role.permissions.length}</span>
                                                        </button>
                                                    ))}
                                                    {roles.length === 0 && (
                                                        <div className="col-span-2 text-sm text-gray-400">No roles available yet.</div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Permissions</label>
                                                        <span className="text-[10px] font-bold text-gray-400">{createForm.permissions.length} selected</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] font-bold text-cyan-700">
                                                        <button type="button" onClick={selectAllCreatePermissions} className="hover:underline">Select all</button>
                                                        <span className="text-gray-300">•</span>
                                                        <button type="button" onClick={clearCreatePermissions} className="hover:underline">Clear</button>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        value={permissionSearch}
                                                        onChange={(e) => setPermissionSearch(e.target.value)}
                                                        placeholder="Search permissions..."
                                                        className="w-full mb-3 bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm outline-none focus:border-cyan-500"
                                                    />
                                                </div>
                                                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                                    {Object.entries(permissionsByCategory).map(([category, perms]) => (
                                                        <div key={category} className="border border-gray-100 rounded-2xl p-3 bg-white">
                                                            <div className="text-[11px] font-black uppercase tracking-wider text-gray-500 mb-2 flex items-center justify-between">
                                                                <span>{category}</span>
                                                                <span className="text-[10px] text-gray-400 font-bold">{perms.length} perms</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {perms.map(perm => {
                                                                    const active = createForm.permissions.includes(perm.key);
                                                                    return (
                                                                        <button
                                                                            key={perm.key}
                                                                            type="button"
                                                                            onClick={() => toggleCreatePermission(perm.key)}
                                                                            className={`px-3 py-1.5 text-[11px] rounded-xl border transition-all ${active
                                                                                ? "bg-cyan-50 border-cyan-500 text-cyan-700"
                                                                                : "bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300"}`}
                                                                            title={perm.key}
                                                                        >
                                                                            {perm.label}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {permissions.length === 0 && (
                                                        <div className="text-sm text-gray-400">No permissions loaded.</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0 px-8 py-6 border-t border-gray-100 bg-gray-50/50">
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                                        className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-black uppercase tracking-[0.15em] text-sm hover:bg-gray-50 transition shadow-sm active:scale-[0.98]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-3 bg-cyan-600 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-sm hover:bg-cyan-700 transition shadow-lg shadow-cyan-600/30 disabled:opacity-50 active:scale-[0.98]"
                                    >
                                        {submitting ? "Creating..." : "Create User"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Role Modal */}
            {showAssignRoleModal && selectedUser && (
                <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-600/20">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Manage Roles</h2>
                                    <p className="text-sm font-medium text-gray-500">Assign roles to {selectedUser.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setShowAssignRoleModal(false); setSelectedUser(null); resetAssignRoleForm(); }}
                                className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all hover:shadow-md"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAssignRole} className="p-6 sm:p-8 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-6">
                            {assignError && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-2xl">
                                    <X size={16} />
                                    <span>{assignError}</span>
                                </div>
                            )}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Roles</label>
                                            <span className="text-[10px] font-bold text-gray-400">{assignRoleForm.roles?.length || 0}/1 selected</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                                            {roles.map(role => (
                                                <button
                                                    key={role._id}
                                                    type="button"
                                                    onClick={() => toggleRole(role.key)}
                                                    className={`flex items-center justify-between w-full px-3 py-2 rounded-xl border text-sm font-semibold transition ${assignRoleForm.roles?.includes(role.key)
                                                        ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                                                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"}`}
                                                >
                                                    <span>{role.name}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold">{role.permissions.length}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 mb-1 block">Dashboard</label>
                                        <div className="flex flex-wrap gap-2">
                                            {["user", "admin", "agent"].map((key) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setAssignRoleForm(prev => ({ ...prev, dashboard: key }))}
                                                    className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${assignRoleForm.dashboard === key ? "bg-cyan-600 text-white border-cyan-600" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"}`}
                                                >
                                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                                </button>
                                            ))}
                                            <select
                                                value={assignRoleForm.dashboard}
                                                onChange={(e) => setAssignRoleForm({ ...assignRoleForm, dashboard: e.target.value })}
                                                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold bg-white text-gray-700"
                                            >
                                                <option value="doctor">Doctor</option>
                                                <option value="marketing_agent">Marketing Agent</option>
                                                <option value="receptionist">Receptionist</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Permissions</label>
                                            <span className="text-[10px] font-bold text-gray-400">{assignRoleForm.permissions?.length || 0} selected</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-cyan-700">
                                            <button type="button" onClick={selectAllAssignPermissions} className="hover:underline">Select all</button>
                                            <span className="text-gray-300">•</span>
                                            <button type="button" onClick={clearAssignPermissions} className="hover:underline">Clear</button>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            value={permissionSearch}
                                            onChange={(e) => setPermissionSearch(e.target.value)}
                                            placeholder="Search permissions"
                                            className="w-full mb-3 bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                        {Object.entries(permissionsByCategory).map(([category, perms]) => (
                                            <div key={category} className="border border-gray-100 rounded-2xl p-3 bg-white">
                                                <div className="text-[11px] font-black uppercase tracking-wider text-gray-500 mb-2 flex items-center justify-between">
                                                    <span>{category}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold">{perms.length} perms</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {perms.map(perm => {
                                                        const active = assignRoleForm.permissions?.includes(perm.key);
                                                        return (
                                                            <button
                                                                key={perm.key}
                                                                type="button"
                                                                onClick={() => toggleAssignPermission(perm.key)}
                                                                className={`px-3 py-1.5 text-[11px] rounded-xl border transition-all ${active
                                                                    ? "bg-cyan-50 border-cyan-500 text-cyan-700"
                                                                    : "bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300"}`}
                                                            >
                                                                {perm.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                        {permissions.length === 0 && (
                                            <div className="text-sm text-gray-400">No permissions loaded.</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-3 bg-cyan-600 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-sm hover:bg-cyan-700 transition shadow-lg shadow-cyan-600/30 disabled:opacity-50 active:scale-[0.98]"
                                >
                                    {submitting ? "Updating..." : "Update Roles"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transfer RM Coin Modal - Now properly placed at the end */}
            {showTransferModal && transferUser && (
                <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-sm md:max-w-md flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-linear-to-r from-white via-cyan-50/60 to-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                                    <Coins size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Transfer RM Coins</h2>
                                    <p className="text-xs font-medium text-gray-500">
                                        Send coins to {transferUser.name && transferUser.name.trim() ? transferUser.name : "N/A"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { 
                                    setShowTransferModal(false); 
                                    setTransferUser(null); 
                                    setTransferAmount(""); 
                                    setTransferError(""); 
                                    setTransferSuccess(""); 
                                }}
                                className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all hover:shadow-md shrink-0"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleTransferSubmit} className="p-6">
                            {transferError && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-2xl mb-4">
                                    <X size={16} />
                                    <span>{transferError}</span>
                                </div>
                            )}
                            
                            {transferSuccess && (
                                <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-3 rounded-2xl mb-4">
                                    <Check size={16} />
                                    <span>{transferSuccess}</span>
                                </div>
                            )}
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">
                                        Current Balance
                                    </label>
                                    <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                                        <span className="font-bold text-gray-900">{transferUser.rmcredit ?? 0} RM Coins</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">
                                        Amount to Transfer <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={transferAmount}
                                        onChange={e => setTransferAmount(e.target.value)}
                                        className="w-full bg-white border border-gray-200 focus:border-yellow-500 rounded-xl py-3 px-4 outline-none transition-all font-semibold text-gray-800"
                                        placeholder="Enter amount"
                                        disabled={transferLoading || !!transferSuccess}
                                    />
                                </div>
                                
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => { 
                                            setShowTransferModal(false); 
                                            setTransferUser(null); 
                                            setTransferAmount(""); 
                                        }}
                                        className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition"
                                        disabled={transferLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={transferLoading || !!transferSuccess}
                                        className="px-5 py-2.5 bg-yellow-500 text-white rounded-xl font-bold text-sm hover:bg-yellow-600 transition shadow-lg shadow-yellow-500/30 disabled:opacity-50 active:scale-[0.98]"
                                    >
                                        {transferLoading ? "Sending..." : transferSuccess ? "Sent!" : "Send Coins"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}