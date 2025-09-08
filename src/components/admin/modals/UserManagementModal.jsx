import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FaTimes, FaEdit, FaTrash, FaCheck, FaBan, FaPlus } from "react-icons/fa";
import apiService from "../../../services/api";

function UserManagementModal({ isOpen, onClose, onDataChanged }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userFilter, setUserFilter] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    confirm_password: "",
    role_id: "",
    group_id: "",
    aadhar_id: "",
    aadhar_document_path: "",
    aadhar_document_file: null,
    bank_account_number: "",
    bank_name: "",
    bank_branch: "",
    ifsc_code: "",
    // Member-specific fields
    monthly_income: "",
    emergency_contact: "",
    emergency_phone: ""
  });

  // Add state for field-specific errors and password visibility
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadRoles();
      loadGroups();
    }
  }, [isOpen]);

  useEffect(() => {
    if (userFilter?.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => {
        const searchTerm = userFilter.toLowerCase();
        const userName = (user.full_name || user.username || "").toLowerCase();
        const userEmail = (user.email || "").toLowerCase();
        const userRole = (user.roles?.[0]?.name || "").toLowerCase();
        
        return userName.includes(searchTerm) || 
               userEmail.includes(searchTerm) || 
               userRole.includes(searchTerm);
      });
      setFilteredUsers(filtered);
    }
  }, [userFilter, users]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getUsers();
      console.log("Loaded users data:", data);
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await apiService.getRoles();
      setRoles(data);
    } catch (error) {
      console.error("Error loading roles:", error);
      toast.error("Failed to load roles");
    }
  };

  const loadGroups = async () => {
    try {
      const data = await apiService.getGroups();
      setGroups(data);
    } catch (error) {
      console.error("Error loading groups:", error);
      toast.error("Failed to load groups");
    }
  };

  // Password validation function
  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  // Comprehensive form validation
  const validateForm = () => {
    const errors = {};
    
    // Required fields validation
    if (!userForm.username?.trim()) {
      errors.username = "Username is required";
    } else if (userForm.username.length < 3) {
      errors.username = "Username must be at least 3 characters long";
    }
    
    if (!userForm.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!userForm.full_name?.trim()) {
      errors.full_name = "Full name is required";
    }
    
    if (!editingUser && !userForm.password?.trim()) {
      errors.password = "Password is required for new users";
    } else if (userForm.password?.trim() && userForm.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    } else if (userForm.password?.trim()) {
      const passwordError = validatePassword(userForm.password);
      if (passwordError) {
        errors.password = passwordError;
      }
    }
    
    if (!editingUser && userForm.password !== userForm.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }
    
    if (!userForm.role_id) {
      errors.role_id = "Role is required";
    }
    
    // Aadhar ID validation
    if (userForm.aadhar_id?.trim() && !/^\d{12}$/.test(userForm.aadhar_id.replace(/\s/g, ''))) {
      errors.aadhar_id = "Aadhar ID must be exactly 12 digits";
    }
    
    // IFSC Code validation
    if (userForm.ifsc_code?.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(userForm.ifsc_code)) {
      errors.ifsc_code = "IFSC code must be 11 characters (e.g., SBIN0001234)";
    }
    
    // Aadhar document is required for ALL users
    // Note: We validate file selection, not upload completion
    if (!userForm.aadhar_document_file) {
      errors.aadhar_document = "Aadhar document is required for all users";
    }
    
    // Member-specific field validation
    if (userForm.role_id && roles.find(role => role.id === parseInt(userForm.role_id))?.name === 'member') {
      if (userForm.monthly_income && (isNaN(parseFloat(userForm.monthly_income)) || parseFloat(userForm.monthly_income) < 0)) {
        errors.monthly_income = "Monthly income must be a valid positive number";
      }
      
      if (userForm.emergency_phone?.trim() && !/^[6-9]\d{9}$/.test(userForm.emergency_phone.replace(/\s/g, ''))) {
        errors.emergency_phone = "Emergency phone must be a valid 10-digit Indian mobile number";
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setFieldErrors({});
    
    // Validate form
    if (!validateForm()) {
      toast.error("Please fix the errors below before submitting");
      return;
    }

    // Validate group assignment for members
    if (userForm.role_id && !editingUser) {
      const selectedRole = roles.find(role => role.id === parseInt(userForm.role_id));
      if (selectedRole && selectedRole.name === 'member' && !userForm.group_id) {
        setFieldErrors({...fieldErrors, group_id: "Group assignment is required for members"});
        toast.error("Group assignment is required for members");
        return;
      }
    }

    try {
      const userData = {
        username: userForm.username?.trim() || "",
        email: userForm.email?.trim() || "",
        full_name: userForm.full_name?.trim() || "",
        ...(userForm.password?.trim() && { password: userForm.password }),
        ...(userForm.role_id && { role_id: parseInt(userForm.role_id) }),
        // Additional user details - always include these fields
        aadhar_id: userForm.aadhar_id?.trim() || null,
        aadhar_document_path: "pending_upload", // Placeholder until file is uploaded
        bank_account_number: userForm.bank_account_number?.trim() || null,
        bank_name: userForm.bank_name?.trim() || null,
        bank_branch: userForm.bank_branch?.trim() || null,
        ifsc_code: userForm.ifsc_code?.trim() || null,
        // Member-specific fields
        monthly_income: userForm.monthly_income ? parseFloat(userForm.monthly_income) : null,
        emergency_contact: userForm.emergency_contact?.trim() || null,
        emergency_phone: userForm.emergency_phone?.trim() || null,
        // Group assignment for members
        group_id: userForm.group_id ? parseInt(userForm.group_id) : null
      };

      console.log("Sending user data:", userData);

      if (editingUser) {
        await apiService.updateUser(editingUser.id, userData);
        
        // Upload document if provided during edit
        if (userForm.aadhar_document_file) {
          try {
            await apiService.uploadUserDocument(editingUser.id, userForm.aadhar_document_file);
            toast.success("User and document updated successfully!");
          } catch (error) {
            console.error("Failed to upload document:", error);
            toast.error("User updated but document upload failed");
          }
        } else {
          toast.success("User updated successfully!");
        }
      } else {
        const newUser = await apiService.createUser(userData);
        
        // Upload document if provided
        if (userForm.aadhar_document_file) {
          try {
            await apiService.uploadUserDocument(newUser.id, userForm.aadhar_document_file);
            toast.success("User created and document uploaded successfully!");
          } catch (error) {
            console.error("Failed to upload document:", error);
            toast.error("User created but document upload failed. Please upload the document manually.");
          }
        } else {
          toast.error("Aadhar document is required for all users");
          return;
        }
        
        // Assign role to the newly created user
        if (userForm.role_id) {
          try {
            await apiService.assignRoleToUser(newUser.id, parseInt(userForm.role_id));
          } catch (error) {
            console.error("Failed to assign role to user:", error);
            toast.error("User created but role assignment failed");
          }
        }
        
        // If user is created with member role and group is selected, create member record
        if (userForm.role_id && userForm.group_id) {
          const selectedRole = roles.find(role => role.id === parseInt(userForm.role_id));
          if (selectedRole && selectedRole.name === 'member') {
            const memberData = {
              user_id: newUser.id,
              group_id: parseInt(userForm.group_id),
              member_code: `M${newUser.id.toString().padStart(4, '0')}`, // Generate member code
              joined_date: new Date().toISOString().split('T')[0],
              // Include member-specific fields
              monthly_income: userForm.monthly_income ? parseFloat(userForm.monthly_income) : null,
              emergency_contact: userForm.emergency_contact?.trim() || null,
              emergency_phone: userForm.emergency_phone?.trim() || null
            };
            await apiService.createMember(memberData);
            if (onDataChanged) {
              onDataChanged();
            }
            toast.success("User, role, and member created successfully!");
          } else {
            toast.success("User and role created successfully!");
          }
        } else {
          toast.success("User and role created successfully!");
        }
      }
      
      setShowUserForm(false);
      setEditingUser(null);
      setUserForm({
        username: "",
        email: "",
        full_name: "",
        password: "",
        confirm_password: "",
        role_id: "",
        group_id: "",
        aadhar_id: "",
        aadhar_document_path: "",
        aadhar_document_file: null,
        bank_account_number: "",
        bank_name: "",
        bank_branch: "",
        ifsc_code: "",
        // Member-specific fields
        monthly_income: "",
        emergency_contact: "",
        emergency_phone: ""
      });
      // Reload users to show the updated data
      await loadUsers();
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (error) {
      console.error("Error saving user:", error);
      
      // Handle specific field errors from backend
      if (error.message.includes("Username already registered")) {
        setFieldErrors({...fieldErrors, username: "Username already exists"});
        toast.error("Username already exists");
      } else if (error.message.includes("Email already registered")) {
        setFieldErrors({...fieldErrors, email: "Email already exists"});
        toast.error("Email already exists");
      } else if (error.message.includes("Aadhar ID already registered")) {
        setFieldErrors({...fieldErrors, aadhar_id: "Aadhar ID already exists"});
        toast.error("Aadhar ID already exists");
      } else if (error.message.includes("Aadhar document is required")) {
        setFieldErrors({...fieldErrors, aadhar_document: "Aadhar document is required for all users"});
        toast.error("Aadhar document is required for all users");
      } else if (error.message.includes("Group assignment is required for members")) {
        setFieldErrors({...fieldErrors, group_id: "Group assignment is required for members"});
        toast.error("Group assignment is required for members");
      } else {
      toast.error(error.message || "Failed to save user");
      }
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username || "",
      email: user.email || "",
      full_name: user.full_name || "",
      password: "",
      confirm_password: "",
      role_id: user.roles?.[0]?.id?.toString() || "",
      group_id: user.member?.group_id?.toString() || "",
      aadhar_id: user.aadhar_id || "",
      aadhar_document_path: user.aadhar_document_path || "",
      aadhar_document_file: null,
      bank_account_number: user.bank_account_number || "",
      bank_name: user.bank_name || "",
      bank_branch: user.bank_branch || "",
      ifsc_code: user.ifsc_code || "",
      // Member-specific fields
      monthly_income: user.monthly_income || "",
      emergency_contact: user.emergency_contact || "",
      emergency_phone: user.emergency_phone || ""
    });
    setShowUserForm(true);
  };

  const handleDeleteUser = async (userId) => {
    // Use toast for better confirmation instead of window.confirm
    toast((t) => (
      <div className="flex items-center space-x-4">
        <span>Are you sure you want to delete this user?</span>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              confirmDeleteUser(userId);
            }}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 10000
    });
  };

  const confirmDeleteUser = async (userId) => {
    try {
      await apiService.deleteUser(userId);
      toast.success("User deleted successfully!");
      await loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      if (user.is_active) {
        await apiService.deactivateUser(user.id);
        toast.success("User deactivated successfully!");
      } else {
        await apiService.activateUser(user.id);
        toast.success("User activated successfully!");
      }
      await loadUsers();
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error(error.message || "Failed to update user status");
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">User Management</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="h-6 w-6" />
          </button>
        </div>

        {/* Search and Add User */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              placeholder="Search users by name, email, or role..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => {
              setEditingUser(null);
              setUserForm({
                username: "",
                email: "",
                full_name: "",
                password: "",
                confirm_password: "",
                role_id: "",
                group_id: "",
                aadhar_id: "",
                aadhar_document_path: "",
                aadhar_document_file: null,
                bank_account_number: "",
                bank_name: "",
                bank_branch: "",
                ifsc_code: "",
                // Member-specific fields
                monthly_income: "",
                emergency_contact: "",
                emergency_phone: ""
              });
              setShowUserForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <FaPlus className="h-4 w-4" />
            Add User
          </button>
        </div>

        {/* User Form */}
        {showUserForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-4">
              {editingUser ? "Edit User" : "Create New User"}
            </h3>
            <form onSubmit={handleCreateUser}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.username ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {fieldErrors.username && (
                    <div className="mt-1 text-xs text-red-600">{fieldErrors.username}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {fieldErrors.email && (
                    <div className="mt-1 text-xs text-red-600">{fieldErrors.email}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={userForm.full_name}
                    onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {!editingUser && "*"}
                  </label>
                  <div className="relative">
                  <input
                      type={showPassword ? "text" : "password"}
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                    required={!editingUser}
                  />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <div className="mt-1 text-xs text-red-600">{fieldErrors.password}</div>
                  )}
                  {!editingUser && userForm.password && (
                    <div className="mt-1 text-xs">
                      <div className={`flex items-center gap-2 ${userForm.password.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
                        <span>{userForm.password.length >= 8 ? '✓' : '✗'}</span>
                        <span>At least 8 characters</span>
                      </div>
                      <div className={`flex items-center gap-2 ${/[A-Z]/.test(userForm.password) ? 'text-green-600' : 'text-red-600'}`}>
                        <span>{/[A-Z]/.test(userForm.password) ? '✓' : '✗'}</span>
                        <span>One uppercase letter</span>
                      </div>
                      <div className={`flex items-center gap-2 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(userForm.password) ? 'text-green-600' : 'text-red-600'}`}>
                        <span>{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(userForm.password) ? '✓' : '✗'}</span>
                        <span>One special character</span>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password {!editingUser && "*"}
                  </label>
                  <input
                    type="password"
                    value={userForm.confirm_password}
                    onChange={(e) => setUserForm({...userForm, confirm_password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!editingUser}
                  />
                  {!editingUser && userForm.confirm_password && (
                    <div className={`mt-1 text-xs ${userForm.password === userForm.confirm_password ? 'text-green-600' : 'text-red-600'}`}>
                      {userForm.password === userForm.confirm_password ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={userForm.role_id}
                    onChange={(e) => setUserForm({...userForm, role_id: e.target.value, group_id: ""})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                {userForm.role_id && roles.find(role => role.id === parseInt(userForm.role_id))?.name === 'member' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group Assignment *
                    </label>
                    <select
                      value={userForm.group_id}
                      onChange={(e) => {
                        setUserForm({...userForm, group_id: e.target.value});
                        // Clear error when group is selected
                        if (fieldErrors.group_id) {
                          setFieldErrors({...fieldErrors, group_id: null});
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        fieldErrors.group_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Select Group</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name} - {group.location}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.group_id && (
                      <div className="mt-1 text-xs text-red-600">{fieldErrors.group_id}</div>
                    )}
                  </div>
                )}

                {/* New fields for additional user details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhar ID
                  </label>
                  <input
                    type="text"
                    value={userForm.aadhar_id}
                    onChange={(e) => setUserForm({...userForm, aadhar_id: e.target.value})}
                    placeholder="12-digit Aadhar number"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.aadhar_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.aadhar_id && (
                    <div className="mt-1 text-xs text-red-600">{fieldErrors.aadhar_id}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhar Document *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setUserForm({
                          ...userForm, 
                          aadhar_document_path: file.name,
                          aadhar_document_file: file
                        });
                        // Clear error when file is selected
                        if (fieldErrors.aadhar_document) {
                          setFieldErrors({...fieldErrors, aadhar_document: null});
                        }
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${
                      fieldErrors.aadhar_document ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required={true}
                  />
                  {fieldErrors.aadhar_document && (
                    <div className="mt-1 text-xs text-red-600">{fieldErrors.aadhar_document}</div>
                  )}
                  {userForm.aadhar_document_path && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="text-xs text-green-600">
                        ✓ File selected: {userForm.aadhar_document_path}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUserForm({
                            ...userForm,
                            aadhar_document_path: "",
                            aadhar_document_file: null
                          });
                        }}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={userForm.bank_account_number}
                    onChange={(e) => setUserForm({...userForm, bank_account_number: e.target.value})}
                    placeholder="Bank account number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={userForm.bank_name}
                    onChange={(e) => setUserForm({...userForm, bank_name: e.target.value})}
                    placeholder="Bank name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Branch
                  </label>
                  <input
                    type="text"
                    value={userForm.bank_branch}
                    onChange={(e) => setUserForm({...userForm, bank_branch: e.target.value})}
                    placeholder="Bank branch"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={userForm.ifsc_code}
                    onChange={(e) => setUserForm({...userForm, ifsc_code: e.target.value})}
                    placeholder="11-character IFSC code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Member-specific fields - only show when member role is selected */}
                {userForm.role_id && roles.find(role => role.id === parseInt(userForm.role_id))?.name === 'member' && (
                  <>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-lg font-medium text-gray-900 mb-3">Member Information</h4>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Income (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={userForm.monthly_income}
                        onChange={(e) => setUserForm({...userForm, monthly_income: e.target.value})}
                        placeholder="Enter monthly income amount"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          fieldErrors.monthly_income ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {fieldErrors.monthly_income && (
                        <div className="mt-1 text-xs text-red-600">{fieldErrors.monthly_income}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        value={userForm.emergency_contact}
                        onChange={(e) => setUserForm({...userForm, emergency_contact: e.target.value})}
                        placeholder="Emergency contact person's name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emergency Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={userForm.emergency_phone}
                        onChange={(e) => setUserForm({...userForm, emergency_phone: e.target.value})}
                        placeholder="Emergency contact phone number"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          fieldErrors.emergency_phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {fieldErrors.emergency_phone && (
                        <div className="mt-1 text-xs text-red-600">{fieldErrors.emergency_phone}</div>
                      )}
                    </div>
                  </>
                )}

              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {editingUser ? "Update User" : "Create User"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserForm(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Table */}
        {isLoading ? (
          <div className="text-center py-4">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      {userFilter?.trim() === "" ? "No users found" : "No users match your search"}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || user.username}
                          </div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.roles?.[0]?.name ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {user.roles[0].name}
                          </span>
                        ) : (
                          <span className="text-gray-400">No role</span>
                        )}
                      </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         {user.member?.group?.name ? (
                           <span className="font-medium">{user.member.group.name}</span>
                         ) : (
                           <span className="text-gray-400">-</span>
                         )}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                           user.is_active 
                             ? "bg-green-100 text-green-800" 
                             : "bg-red-100 text-red-800"
                         }`}>
                           {user.is_active ? "Active" : "Inactive"}
                         </span>
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit User"
                          >
                            <FaEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className={`${
                              user.is_active 
                                ? "text-red-600 hover:text-red-900" 
                                : "text-green-600 hover:text-green-900"
                            }`}
                            title={user.is_active ? "Deactivate User" : "Activate User"}
                          >
                            {user.is_active ? <FaBan className="h-4 w-4" /> : <FaCheck className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredUsers.length} of {users.length} users
          {userFilter?.trim() !== "" && ` matching "${userFilter}"`}
        </div>
      </div>
    </div>
  );
}

export default UserManagementModal;
