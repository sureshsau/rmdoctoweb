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
    Calendar,
    X,
    Check,
    Ban,
    UserCog,
    Eye,
    EyeOff,
    Filter
} from "lucide-react";
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
    const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [createError, setCreateError] = useState("");
    const [assignError, setAssignError] = useState("");
    const [showCreatePassword, setShowCreatePassword] = useState(false);

    const [createForm, setCreateForm] = useState({
        name: "",
        phone: "",
        email: "",
        password: "",
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

    const resetCreateForm = () => {
        setCreateForm({
            name: "",
            phone: "",
            email: "",
            password: "",
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
        console.log(user);
        setSelectedUser(user);
        setAssignRoleForm({
            userId: user._id || user.id || "",
            roles: primaryRole ? [primaryRole] : [],
            permissions: user.permissions || [],
            dashboard: user.dashboard || "user"
        });
        setShowAssignRoleModal(true);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        // Single-select role for assignment: either pick this role or clear selection
        setAssignRoleForm(prev => {
            const isSame = prev.roles?.[0] === roleKey;
            const nextRoles = isSame ? [] : [roleKey];
            const rolePerms = roles.find(r => r.key === roleKey)?.permissions || [];
            return {
                ...prev,
                roles: nextRoles,
                // When selecting a role, set permissions to that role's defaults; when clearing, drop them.
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
        // Single-select role for new user: choose one or clear
        setCreateForm(prev => {
            const isSame = prev.roles[0] === roleKey;
            const nextRoles = isSame ? [] : [roleKey];
            const rolePerms = roles.find(r => r.key === roleKey)?.permissions || [];
            return {
                ...prev,
                roles: nextRoles,
                // Set permissions to chosen role's defaults; clear when none
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

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">User Management</h1>
                    <p className="text-gray-500 font-medium mt-1">Manage users, roles, and permissions across the platform.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-cyan-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-cyan-700 transition shadow-lg shadow-cyan-600/20 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Add User
                </button>
            </div>

            {/* Search & Filters */}
            <div className="bg-white p-4 rounded-[32px] shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition font-medium text-gray-700"
                    />
                </div>
                <div className="relative group">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-cyan-600 transition-colors" size={18} />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="pl-12 pr-10 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm appearance-none focus:ring-2 focus:ring-cyan-500 outline-none font-bold text-sm text-gray-700 transition-all cursor-pointer"
                    >
                        <option value="">All Roles</option>
                        {roles.map(role => (
                            <option key={role._id} value={role.key}>{role.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                <th className="px-8 py-6">User</th>
                                <th className="px-6 py-6">Contact</th>
                                <th className="px-6 py-6">Roles</th>
                                <th className="px-6 py-6">Dashboard</th>
                                <th className="px-6 py-6">Status</th>
                                <th className="px-8 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-8 py-6">
                                            <div className="h-4 bg-gray-50 rounded-lg w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-3xl mx-auto flex items-center justify-center mb-4">
                                            <Users className="text-gray-200" size={32} />
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900">No users found</h3>
                                        <p className="text-gray-500 font-medium">Try adjusting your search or filters.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-sm">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900">{user.name}</p>
                                                    {/* <p className="text-xs font-bold text-gray-400 flex items-center gap-1 mt-0.5">
                                                        <Calendar size={10} />
                                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                                    </p> */}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="space-y-1">
                                                {user.email && (
                                                    <p className="text-sm font-bold text-gray-600 flex items-center gap-2">
                                                        <Mail size={12} className="text-gray-400" />
                                                        {user.email}
                                                    </p>
                                                )}
                                                <p className="text-sm font-bold text-gray-600 flex items-center gap-2">
                                                    <Phone size={12} className="text-gray-400" />
                                                    {user.phone}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles && user.roles.length > 0 ? (
                                                    user.roles.map((role, idx) => (
                                                        <span key={idx} className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                            {role}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs font-bold text-gray-400">No roles</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wider">
                                                {user.dashboard || "user"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2">
                                                {user.isActive ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border-emerald-100">
                                                        <Check size={12} />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider bg-gray-50 text-gray-600 border-gray-100">
                                                        Inactive
                                                    </span>
                                                )}
                                                {/* {user.isBlocked && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600 border-red-100">
                                                        <Ban size={12} />
                                                        Blocked
                                                    </span>
                                                )} */}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => openAssignRoleModal(user)}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-cyan-600 hover:text-white hover:shadow-lg transition-all font-bold text-xs"
                                            >
                                                <UserCog size={14} />
                                                Manage Roles
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[44px] shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-white via-cyan-50/60 to-white">
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
                                className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all hover:shadow-md"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="p-8">
                            {createError && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-2xl mb-6">
                                    <X size={16} />
                                    <span>{createError}</span>
                                </div>
                            )}

                            <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-8">
                                <div className="grid lg:grid-cols-2 gap-8">
                                    <div className="bg-gray-50/80 rounded-[28px] p-6 space-y-5 border border-gray-100">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Profile</p>
                                            <h3 className="text-lg font-black text-gray-900">Basic information</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">Full Name</label>
                                                <input
                                                    required
                                                    value={createForm.name}
                                                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 focus:border-cyan-500 rounded-2xl py-3.5 px-5 outline-none transition-all font-semibold text-gray-800"
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">Phone</label>
                                                <input
                                                    required
                                                    type="tel"
                                                    value={createForm.phone}
                                                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 focus:border-cyan-500 rounded-2xl py-3.5 px-5 outline-none transition-all font-semibold text-gray-800"
                                                    placeholder="+1234567890"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">Email (Optional)</label>
                                                <input
                                                    type="email"
                                                    value={createForm.email}
                                                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 focus:border-cyan-500 rounded-2xl py-3.5 px-5 outline-none transition-all font-semibold text-gray-800"
                                                    placeholder="john@example.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">Password</label>
                                                <div className="relative">
                                                    <input
                                                        required
                                                        type={showCreatePassword ? "text" : "password"}
                                                        value={createForm.password}
                                                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                                        className="w-full bg-white border border-gray-200 focus:border-cyan-500 rounded-2xl py-3.5 pl-5 pr-12 outline-none transition-all font-semibold text-gray-800"
                                                        placeholder="Temporary password"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCreatePassword((prev) => !prev)}
                                                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-700"
                                                        aria-label={showCreatePassword ? "Hide password" : "Show password"}
                                                    >
                                                        {showCreatePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Dashboard</label>
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
                                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Access</p>
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
                                                    placeholder="Search permissions"
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

                                <div className="flex justify-end">
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
                <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
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

                        <form onSubmit={handleAssignRole} className="p-10 space-y-6">
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
        </div>
    );
}
