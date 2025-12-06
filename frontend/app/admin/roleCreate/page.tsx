'use client'
import React, { useState, useRef, useEffect } from "react";


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

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
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

  // Toggle parent category (select/unselect all actions)
  const toggleCategory = (category: PermissionCategoryKey) => {
    setForm((prev) => {
      const current = prev.permissions[category];
      const allActions = PERMISSION_CONFIG[category];
      const enabled = !current.enabled;

      const updatedCategory: CategoryState = {
        enabled,
        actions: enabled ? allActions : [],
      };

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [category]: updatedCategory,
        },
      };
    });
  };

  // Toggle individual action + auto-update parent enabled state
  const toggleAction = (category: PermissionCategoryKey, action: string) => {
    setForm((prev) => {
      const current = prev.permissions[category];
      let actions: string[];

      if (current.actions.includes(action)) {
        actions = current.actions.filter((a) => a !== action);
      } else {
        actions = [...current.actions, action];
      }

      const allActions = PERMISSION_CONFIG[category];
      const enabled = actions.length === allActions.length;

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [category]: {
            enabled,
            actions,
          },
        },
      };
    });
  };

  const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    setLoading(true);

    // ✅ FLATTEN ONLY VALUES (NO CATEGORY KEYS)
    const formattedPermissions = Object.values(form.permissions)
      .flatMap((category) => category.actions);
    console.log(formattedPermissions);
    // ✅ FINAL CLEAN PAYLOAD (WHAT YOU WANT)
    const payload = {
      key: form.key.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      roleType: form.roleType,
      coreProfile: form.coreProfile,
      permissions: formattedPermissions, // ✅ ONLY ARRAY OF VALUES
    };

    console.log("✅ FINAL PAYLOAD (CLEAN):", payload);

    // ✅ Send to Backend
    // const res = await fetch("/api/roles", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(payload),
    // });

    // const data = await res.json();

    // if (!res.ok) {
    //   throw new Error(data.message || "Failed to create role");
    // }

    alert("✅ Role created successfully!");

    // ✅ RESET FORM
    setForm({
      key: "",
      name: "",
      description: "",
      roleType: "CUSTOM",
      coreProfile: false,
      permissions: initialPermissions,
    });

  } catch (error: any) {
    console.error("❌ Role creation failed:", error);
    alert(error.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
};
  const prettyCategoryLabel = (key: PermissionCategoryKey) => {
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  return (
  <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-6">
    <div className="max-w-5xl mx-auto bg-white/85 backdrop-blur-xl rounded-3xl shadow-xl border border-cyan-100 p-10 transition-all">

      {/* Header */}
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-gray-800">
          Create New Role
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure access levels for hospital staff. Roles define what users are allowed to do.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">

        {/* ✅ BASIC INFO */}
        <div>
          <h3 className="text-sm font-semibold text-cyan-700 mb-4 uppercase tracking-wide">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Role Key */}
            <div className="group">
              <label className="text-sm font-medium text-gray-700">
                Role Key
              </label>
              <input
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition-all
                hover:border-cyan-300"
                placeholder="e.g. admin, hr_manager"
                value={form.key}
                onChange={(e) => handleChange("key", e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Unique system identifier. Cannot contain spaces.
              </p>
            </div>

            {/* Role Name */}
            <div className="group">
              <label className="text-sm font-medium text-gray-700">
                Role Name
              </label>
              <input
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all
                hover:border-blue-300"
                placeholder="Administrator"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Display name shown in the admin panel.
              </p>
            </div>
          </div>
        </div>

        {/* ✅ DESCRIPTION */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition-all
            hover:border-cyan-300"
            rows={3}
            placeholder="Describe what this role is responsible for..."
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Helps other admins understand the purpose of this role.
          </p>
        </div>

        {/* ✅ ROLE TYPE */}
<div>
  <h3 className="text-sm font-semibold text-cyan-700 mb-4 uppercase tracking-wide">
    Role Type
  </h3>

  <div ref={roleTypeRef} className="relative md:w-1/2">
    {/* Selected Box */}
    <button
      type="button"
      onClick={() => setRoleTypeOpen((prev) => !prev)}
      className="w-full flex items-center justify-between px-4 py-3 rounded-xl
      border border-gray-200 bg-white text-sm font-medium text-gray-800
      shadow-sm hover:border-cyan-400
      focus:ring-2 focus:ring-cyan-400 focus:outline-none transition"
    >
      <span>
        {form.roleType === "CUSTOM"
          ? "Custom"
          : "Core"}
      </span>
    <span
  className={`text-cyan-600 text-xs transition-transform duration-200 ${
    roleTypeOpen ? "rotate-180" : "rotate-0"
  }`}
>
  ▼
</span>
    </button>

    {/* Dropdown Menu */}
    {roleTypeOpen && (
      <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl
      border border-gray-200 bg-white shadow-xl animate-fadeIn">
        
        <div
          onClick={() => {
            handleChange("roleType", "CUSTOM");
            setRoleTypeOpen(false);
          }}
          className={`px-4 py-3 text-sm cursor-pointer transition
          ${form.roleType === "CUSTOM"
            ? "bg-cyan-50 text-cyan-700 font-semibold"
            : "hover:bg-gray-50"}`}
        >
          Core
        </div>

        <div
          onClick={() => {
            handleChange("roleType", "PROJECT");
            setRoleTypeOpen(false);
          }}
          className={`px-4 py-3 text-sm cursor-pointer transition
          ${form.roleType === "PROJECT"
            ? "bg-cyan-50 text-cyan-700 font-semibold"
            : "hover:bg-gray-50"}`}
        >
          Custom
        </div>
      </div>
    )}

    <p className="text-xs text-gray-500 mt-1 pl-1">
      Choose how flexible this role should be.
    </p>
  </div>
</div>



        {/* ✅ PERMISSIONS */}
<div>
  <h3 className="text-sm font-semibold text-cyan-700 mb-2 uppercase tracking-wide">
    Permissions
  </h3>

  <p className="text-xs text-gray-500 mb-5">
    Choose what actions this role can perform in each module.
  </p>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
    {(Object.keys(PERMISSION_CONFIG) as PermissionCategoryKey[]).map(
      (categoryKey) => {
        const categoryState = form.permissions[categoryKey];
        const actions = PERMISSION_CONFIG[categoryKey];
        const allSelected =
          categoryState.actions.length === actions.length;

        return (
          <div
            key={categoryKey}
            className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-cyan-50 p-5 shadow-sm transition hover:shadow-md hover:border-cyan-200"
          >
            {/* ✅ HEADER */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleCategory(categoryKey)}
                  className={`h-5 w-5 rounded-md border flex items-center justify-center text-xs transition
                    ${
                      allSelected
                        ? "bg-cyan-500 border-cyan-500 text-white shadow-sm"
                        : "bg-white border-gray-300 hover:border-cyan-400"
                    }`}
                >
                  {allSelected && "✓"}
                </button>

                <span className="font-semibold text-gray-800 tracking-wide text-sm">
                  {prettyCategoryLabel(categoryKey)}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setExpandedCategory((prev) =>
                    prev === categoryKey ? null : categoryKey
                  )
                }
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                {expandedCategory === categoryKey ? "Hide" : "View"}
              </button>
            </div>

            {/* ✅ ACTIONS */}
            {expandedCategory === categoryKey && (
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
                    <span className="capitalize tracking-wide">
                      {action.replace("_", " ")}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      }
    )}
  </div>
</div>


        {/* ✅ ACTION BUTTONS */}
        <div className="flex justify-end gap-4 pt-6">
          <button
            type="button"
            className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold shadow-lg transition"
          >
            Create Role
          </button>
        </div>

      </form>
    </div>
  </main>
);

};

export default CreateRoleForm;
