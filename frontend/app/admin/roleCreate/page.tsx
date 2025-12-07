'use client'
import axios from "axios";
import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
type RoleType = "SYSTEM" | "CUSTOM" | "PROJECT";

type PermissionCategoryKey =
  | "users"
  | "roles"
  | "analytics"
  | "settings"
  | "billing";

const PERMISSION_CONFIG: Record<PermissionCategoryKey, string[]> = {
  users: [
    "users:check:face",
    "users:check:manual",
    "users:settings:self",
    "users:settings:admin",
  ],
  roles: [
    "roles:create:manual",
    "roles:read:full",
    "roles:assign:self",
    "roles:delete:admin",
  ],
  analytics: [
    "analytics:read:basic",
    "analytics:export:full",
  ],
  settings: [
    "settings:read:self",
    "settings:update:admin",
  ],
  billing: [
    "billing:read:basic",
    "billing:refund:admin",
    "billing:charge:system",
  ],
};

type ToastType = "success" | "error";


const CORE_ROLE_LIST = [
  "doctor",
  "employee",
  "agent",
  "marketing_agent",
  "receptionist",
  "patient",
  "lab_owner"
];

type CategoryState = {
  enabled: boolean;
  actions: string[];
};

type PermissionsState = Record<PermissionCategoryKey, CategoryState>;

type RoleFormState = {
  key: string;
  name: string;
  description: string;
  roleType: RoleType;
  coreProfile: boolean;
  permissions: PermissionsState;
};

const initialPermissions: PermissionsState = {
  users: { enabled: false, actions: [] },
  roles: { enabled: false, actions: [] },
  analytics: { enabled: false, actions: [] },
  settings: { enabled: false, actions: [] },
  billing: { enabled: false, actions: [] },
};

const CreateRoleForm: React.FC = () => {
  const [form, setForm] = useState<RoleFormState>({
    key: "",
    name: "",
    description: "",
    roleType: "CUSTOM",
    coreProfile: false,
    permissions: initialPermissions,
  });

  const API_BASE_URL = "http://localhost:5000";

  const [expandedCategory, setExpandedCategory] =
    useState<PermissionCategoryKey | null>("users");

  const roleTypeRef = useRef<HTMLDivElement | null>(null);
  const [roleTypeOpen, setRoleTypeOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        roleTypeRef.current &&
        !roleTypeRef.current.contains(event.target as Node)
      ) {
        setRoleTypeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (
    field: keyof Omit<RoleFormState, "permissions">,
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const [toast, setToast] = useState<{
  show: boolean;
  message: string;
  type: ToastType;
}>({
  show: false,
  message: "",
  type: "success",
});

  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
  const storedToken = localStorage.getItem("token");
  setToken(storedToken);
}, []);




  const toggleCategory = (category: PermissionCategoryKey) => {
    setForm((prev) => {
      const current = prev.permissions[category];
      const allActions = PERMISSION_CONFIG[category];
      const enabled = !current.enabled;

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [category]: {
            enabled,
            actions: enabled ? allActions : [],
          },
        },
      };
    });
  };

  const toggleAction = (category: PermissionCategoryKey, action: string) => {
    setForm((prev) => {
      const current = prev.permissions[category];
      const actions = current.actions.includes(action)
        ? current.actions.filter((a) => a !== action)
        : [...current.actions, action];

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [category]: {
            enabled: actions.length === PERMISSION_CONFIG[category].length,
            actions,
          },
        },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const formattedPermissions = Object.values(form.permissions).flatMap(
    (category) => category.actions
  );

  const payload = {
    key: form.key.trim(),
    name: form.name.trim(),
    description: form.description.trim(),
    permissions: formattedPermissions,
    roleType: form.roleType,
    coreProfile: form.coreProfile,
  };

  if (!token) {
    setToast({
      show: true,
      message: "Authentication token missing. Please login again.",
      type: "error",
    });
    return;
  }

  try {
    const res = await axios.post(
      `${API_BASE_URL}/roles`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Role Created:", res.data);

    // ✅ ONLY THIS (let useEffect auto-close after 30s)
    setToast({
      show: true,
      message: "Role created successfully!",
      type: "success",
    });

    // ✅ RESET FORM
    setForm({
      key: "",
      name: "",
      description: "",
      roleType: "CUSTOM",
      coreProfile: false,
      permissions: initialPermissions,
    });

  } catch (err: any) {
    console.error("❌ Role creation error:", err);

    let message = "Something went wrong";

    if (err.response) {
      message =
        err.response.data?.message ||
        err.response.data?.error ||
        "Server error while creating role";
    } else if (err.request) {
      message = "Server not responding. Please try again later.";
    } else {
      message = err.message;
    }

    // ✅ ONLY THIS (let useEffect auto-close after 30s)
    setToast({
      show: true,
      message,
      type: "error",
    });
  }
};


useEffect(() => {
  if (!toast.show) return;

  const timer = setTimeout(() => {
    setToast({ show: false, message: "", type: toast.type });
  }, 3000);

  return () => clearTimeout(timer);
}, [toast.show, toast.message]);


  const prettyCategoryLabel = (key: PermissionCategoryKey) =>
    key.charAt(0).toUpperCase() + key.slice(1);

  return (
    <>
    <AnimatePresence>
  {toast.show && (
    <motion.div
      key={toast.message}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed top-6 right-6 z-[9999]"
    >
      <div
        className={`px-6 py-4 rounded-2xl shadow-2xl font-medium text-sm flex items-center gap-3
        ${toast.type === "success"
          ? "bg-green-500 text-white"
          : "bg-red-500 text-white"}`}
      >
        <span className="text-lg">
          {toast.type === "success" ? "✅" : "❌"}
        </span>
        {toast.message}
      </div>
    </motion.div>
  )}
</AnimatePresence>


  <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-100 p-6">
    <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-cyan-100 p-10">

      {/* ✅ HEADER */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            Create New Role
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure access control & permissions for users
          </p>
        </div>

        <div className="px-4 py-2 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold tracking-wide">
          ROLE MANAGEMENT
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">

        {/* ✅ ROLE KEY + ROLE TYPE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* ROLE KEY */}
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Role Key
            </label>
            <input
              className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 
              bg-white shadow-sm
              focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none
              transition hover:border-cyan-300"
              placeholder="e.g. admin, hr_manager"
              value={form.key}
              onChange={(e) => handleChange("key", e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Unique identifier (no spaces allowed)
            </p>
          </div>

          {/* ROLE TYPE */}
          <div ref={roleTypeRef} className="relative">
            <label className="text-sm font-semibold text-gray-700">
              Role Type
            </label>

            <button
              type="button"
              onClick={() => setRoleTypeOpen((p) => !p)}
              className="w-full mt-2 flex items-center justify-between px-4 py-3 rounded-xl
              border border-gray-200 bg-white text-sm font-medium text-gray-800
              shadow-sm hover:border-cyan-400
              focus:ring-2 focus:ring-cyan-400 focus:outline-none transition"
            >
              <span>
                {form.roleType === "SYSTEM" ? "Core Role" : "Custom Role"}
              </span>

              <span
                className={`text-cyan-600 text-xs transition-transform duration-200 ${
                  roleTypeOpen ? "rotate-180" : "rotate-0"
                }`}
              >
                ▼
              </span>
            </button>

            {roleTypeOpen && (
              <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl
              border border-gray-200 bg-white shadow-xl animate-fadeIn">

                <div
                  onClick={() => {
                    handleChange("roleType", "SYSTEM");
                    handleChange("coreProfile", true);
                    setRoleTypeOpen(false);
                  }}
                  className={`px-4 py-3 text-sm cursor-pointer transition
                  ${form.roleType === "SYSTEM"
                    ? "bg-cyan-50 text-cyan-700 font-semibold"
                    : "hover:bg-gray-50"}`}
                >
                  Core
                </div>

                <div
                  onClick={() => {
                    handleChange("roleType", "CUSTOM");
                    handleChange("coreProfile", false);
                    setRoleTypeOpen(false);
                  }}
                  className={`px-4 py-3 text-sm cursor-pointer transition
                  ${form.roleType === "CUSTOM"
                    ? "bg-cyan-50 text-cyan-700 font-semibold"
                    : "hover:bg-gray-50"}`}
                >
                  Custom
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ✅ ROLE NAME */}
        <div>
          <label className="text-sm font-semibold text-gray-700">
            Role Name
          </label>

          {form.roleType === "SYSTEM" ? (
            <select
              className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 
              bg-white shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none
              transition hover:border-blue-300"
              value={form.name}
              onChange={(e) => {
                handleChange("name", e.target.value);
                handleChange("key", e.target.value);
                handleChange("coreProfile", true);
              }}
            >
              <option value="">Select Core Role</option>
              {CORE_ROLE_LIST.map((role) => (
                <option key={role} value={role}>
                  {role.replace("_", " ").toUpperCase()}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 
              bg-white shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none
              transition hover:border-blue-300"
              placeholder="Administrator"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          )}
        </div>

        {/* ✅ DESCRIPTION */}
        <div>
          <label className="text-sm font-semibold text-gray-700">
            Description
          </label>
          <textarea
            className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 
            bg-white shadow-sm focus:ring-2 focus:ring-cyan-400 focus:outline-none
            transition hover:border-cyan-300"
            rows={3}
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Describe what this role is responsible for..."
          />
        </div>

        {/* ✅ PERMISSIONS */}
        <div>
          <h3 className="text-sm font-semibold text-cyan-700 mb-4 uppercase tracking-wide">
            Permissions
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(Object.keys(PERMISSION_CONFIG) as PermissionCategoryKey[]).map(
              (categoryKey) => {
                const categoryState = form.permissions[categoryKey];
                const actions = PERMISSION_CONFIG[categoryKey];

                return (
                  <div
                    key={categoryKey}
                    className="rounded-2xl border border-gray-100 
                    bg-gradient-to-br from-white to-cyan-50 p-5 
                    shadow-sm transition hover:shadow-md hover:border-cyan-200"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-gray-800 tracking-wide text-sm">
                        {prettyCategoryLabel(categoryKey)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleCategory(categoryKey)}
                        className={`h-5 w-5 rounded-md border flex items-center justify-center text-xs transition
                        ${
                          categoryState.enabled
                            ? "bg-cyan-500 border-cyan-500 text-white shadow-sm"
                            : "bg-white border-gray-300 hover:border-cyan-400"
                        }`}
                      >
                        {categoryState.enabled && "✓"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                      {actions.map((action) => (
                        <label
                          key={action}
                          className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-cyan-700 transition"
                        >
                          <input
                            type="checkbox"
                            checked={categoryState.actions.includes(action)}
                            onChange={() =>
                              toggleAction(categoryKey, action)
                            }
                            className="accent-cyan-500 h-4 w-4 rounded border-gray-300"
                          />
                          {action}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* ✅ SUBMIT */}
        <div className="flex justify-end pt-6">
          <button
            type="submit"
            className="px-10 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 
            hover:from-cyan-600 hover:to-blue-600 text-white font-semibold 
            shadow-lg transition-all"
          >
            Create Role
          </button>
        </div>

      </form>
    </div>
  </main>
  </>
);

};

export default CreateRoleForm;
