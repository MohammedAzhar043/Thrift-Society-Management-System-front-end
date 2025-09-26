import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FaTimes, FaEdit, FaTrash, FaCheck, FaBan, FaPlus } from "react-icons/fa";
import apiService from "../../../services/api";
import useFormSubmission from "../../../hooks/useFormSubmission";

function UserManagementModal({ isOpen, onClose, onDataChanged }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userFilter, setUserFilter] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Form submission hook
  const { isSubmitting, error: submissionError, submitForm, resetForm, clearError } = useFormSubmission();

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
    nominee_name: "",
    nominee_phone: "",
    relation: "",
    bank_passbook_path: "",
    bank_passbook_file: null
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
      setUsers(data);
    } catch (error) {
      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>Failed to load users</span>
          <button
            onClick={() => {
              toast.dismiss(t.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0',
              marginLeft: '10px',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>
      ), {
        duration: 6000,
        position: "top-center",
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '12px 16px',
          fontSize: '14px',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await apiService.getRoles();
      setRoles(data);
    } catch (error) {
      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>Failed to load roles</span>
          <button
            onClick={() => {
              toast.dismiss(t.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0',
              marginLeft: '10px',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>
      ), {
        duration: 6000,
        position: "top-center",
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '12px 16px',
          fontSize: '14px',
        },
      });
    }
  };

  const loadGroups = async () => {
    try {
      const data = await apiService.getGroups();
      setGroups(data);
    } catch (error) {
      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>Failed to load groups</span>
          <button
            onClick={() => {
              toast.dismiss(t.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0',
              marginLeft: '10px',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>
      ), {
        duration: 6000,
        position: "top-center",
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '12px 16px',
          fontSize: '14px',
        },
      });
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
    
    // Password validation - required for both new users and editing
    if (!userForm.password?.trim()) {
      errors.password = editingUser ? "Password is required for updating user" : "Password is required for new users";
    } else if (userForm.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    } else {
      const passwordError = validatePassword(userForm.password);
      if (passwordError) {
        errors.password = passwordError;
      }
    }
    
    // Confirm password validation - required for both new users and editing
    if (!userForm.confirm_password?.trim()) {
      errors.confirm_password = editingUser ? "Confirm password is required for updating user" : "Confirm password is required for new users";
    } else if (userForm.password !== userForm.confirm_password) {
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
    // For new users: require file upload
    // For editing users: require either new file OR existing file path
    if (!editingUser && !userForm.aadhar_document_file) {
      errors.aadhar_document = "Aadhar document is required for all users";
    } else if (editingUser && !userForm.aadhar_document_file && !userForm.aadhar_document_path) {
      errors.aadhar_document = "Aadhar document is required for all users";
    }
    
    // Member-specific field validation
    if (userForm.role_id && roles.find(role => role.id === parseInt(userForm.role_id))?.name === 'member') {
      if (userForm.monthly_income && (isNaN(parseFloat(userForm.monthly_income)) || parseFloat(userForm.monthly_income) < 0)) {
        errors.monthly_income = "Monthly income must be a valid positive number";
      }
      
      if (userForm.nominee_phone?.trim() && !/^[6-9]\d{9}$/.test(userForm.nominee_phone.replace(/\s/g, ''))) {
        errors.nominee_phone = "Nominee phone must be a valid 10-digit Indian mobile number";
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setFieldErrors({});
    clearError();
    
    // Validate form
    if (!validateForm()) {
      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>Please fix the errors below before submitting</span>
          <button
            onClick={() => {
              toast.dismiss(t.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0',
              marginLeft: '10px',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>
      ), {
        duration: 6000,
        position: "top-center",
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '12px 16px',
          fontSize: '14px',
        },
      });
      return;
    }

    // Validate group assignment for members
    if (userForm.role_id && !editingUser) {
      const selectedRole = roles.find(role => role.id === parseInt(userForm.role_id));
      if (selectedRole && selectedRole.name === 'member' && !userForm.group_id) {
        setFieldErrors({...fieldErrors, group_id: "Group assignment is required for members"});
        toast((t) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span>Group assignment is required for members</span>
            <button
              onClick={() => {
                toast.dismiss(t.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '0',
                marginLeft: '10px',
                fontSize: '18px',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>
          </div>
        ), {
          duration: 6000,
          position: "top-center",
          style: {
            background: '#EF4444',
            color: '#fff',
            padding: '12px 16px',
            fontSize: '14px',
          },
        });
        return;
      }
    }

    await submitForm(async () => {
      const userData = {
        username: userForm.username?.trim() || "",
        email: userForm.email?.trim() || "",
        full_name: userForm.full_name?.trim() || "",
        ...(userForm.password?.trim() && { password: userForm.password }),
        ...(userForm.role_id && { role_id: parseInt(userForm.role_id) }),
        // Additional user details - always include these fields
        aadhar_id: userForm.aadhar_id?.trim() || null,
        aadhar_document_path: editingUser ? userForm.aadhar_document_path : "pending_upload", // Keep existing path for edit, placeholder for create
        bank_account_number: userForm.bank_account_number?.trim() || null,
        bank_name: userForm.bank_name?.trim() || null,
        bank_branch: userForm.bank_branch?.trim() || null,
        ifsc_code: userForm.ifsc_code?.trim() || null,
        // Member-specific fields
        monthly_income: userForm.monthly_income ? parseFloat(userForm.monthly_income) : null,
        nominee_name: userForm.nominee_name?.trim() || null,
        nominee_phone: userForm.nominee_phone?.trim() || null,
        nominee_relation: userForm.relation?.trim() || null,
        bank_passbook_path: editingUser ? userForm.bank_passbook_path : (userForm.bank_passbook_path?.trim() || null), // Keep existing path for edit
        // Group assignment for members
        group_id: userForm.group_id ? parseInt(userForm.group_id) : null
      };


      if (editingUser) {
        await apiService.updateUser(editingUser.id, userData);
        
        // Upload documents if provided during edit
        let documentsUploaded = 0;
        let totalDocuments = 0;
        
        if (userForm.aadhar_document_file) {
          totalDocuments++;
          try {
            await apiService.uploadUserDocument(editingUser.id, userForm.aadhar_document_file);
            documentsUploaded++;
          } catch (error) {
            toast((t) => (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>Aadhar document upload failed. Please upload manually.</span>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '0',
                    marginLeft: '10px',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}
                >
                  ✕
                </button>
              </div>
            ), {
              duration: 6000,
              position: "top-center",
              style: {
                background: '#EF4444',
                color: '#fff',
                padding: '12px 16px',
                fontSize: '14px',
              },
            });
          }
        }
        
        if (userForm.bank_passbook_file) {
          totalDocuments++;
          try {
            await apiService.uploadBankPassbook(editingUser.id, userForm.bank_passbook_file);
            documentsUploaded++;
          } catch (error) {
            toast((t) => (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>Bank passbook upload failed. Please upload manually.</span>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '0',
                    marginLeft: '10px',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}
                >
                  ✕
                </button>
              </div>
            ), {
              duration: 6000,
              position: "top-center",
              style: {
                background: '#EF4444',
                color: '#fff',
                padding: '12px 16px',
                fontSize: '14px',
              },
            });
          }
        }
        
        // Update member record if user is a member
        if (editingUser.member && userForm.role_id) {
          const selectedRole = roles.find(role => role.id === parseInt(userForm.role_id));
          if (selectedRole && selectedRole.name === 'member') {
            try {
              const memberData = {
                monthly_income: userForm.monthly_income ? parseFloat(userForm.monthly_income) : null,
                nominee_name: userForm.nominee_name?.trim() || null,
                nominee_phone: userForm.nominee_phone?.trim() || null,
                nominee_relation: userForm.relation?.trim() || null
              };
              await apiService.updateMember(editingUser.member.id, memberData);
            } catch (error) {
              toast((t) => (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span>User updated but member record update failed</span>
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      padding: '0',
                      marginLeft: '10px',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ), {
                duration: 6000,
                position: "top-center",
                style: {
                  background: '#EF4444',
                  color: '#fff',
                  padding: '12px 16px',
                  fontSize: '14px',
                },
              });
            }
          }
        }
        
        // Show success message
        const successMessage = documentsUploaded > 0 
          ? `User updated successfully with ${documentsUploaded} document(s) uploaded!`
          : "User updated successfully!";
        toast.success(successMessage);
      } else {
        const newUser = await apiService.createUser(userData);
        
        // Upload documents if provided
        let documentsUploaded = 0;
        let totalDocuments = 0;
        
        if (userForm.aadhar_document_file) {
          totalDocuments++;
          try {
            await apiService.uploadUserDocument(newUser.id, userForm.aadhar_document_file);
            documentsUploaded++;
          } catch (error) {
            toast((t) => (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>Aadhar document upload failed. Please upload manually.</span>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '0',
                    marginLeft: '10px',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}
                >
                  ✕
                </button>
              </div>
            ), {
              duration: 6000,
              position: "top-center",
              style: {
                background: '#EF4444',
                color: '#fff',
                padding: '12px 16px',
                fontSize: '14px',
              },
            });
          }
        } else {
          toast((t) => (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>Aadhar document is required for all users</span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0',
                  marginLeft: '10px',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>
          ), {
            duration: 6000,
            position: "top-center",
            style: {
              background: '#EF4444',
              color: '#fff',
              padding: '12px 16px',
              fontSize: '14px',
            },
          });
          return;
        }
        
        if (userForm.bank_passbook_file) {
          totalDocuments++;
          try {
            await apiService.uploadBankPassbook(newUser.id, userForm.bank_passbook_file);
            documentsUploaded++;
          } catch (error) {
            toast((t) => (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>Bank passbook upload failed. Please upload manually.</span>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '0',
                    marginLeft: '10px',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}
                >
                  ✕
                </button>
              </div>
            ), {
              duration: 6000,
              position: "top-center",
              style: {
                background: '#EF4444',
                color: '#fff',
                padding: '12px 16px',
                fontSize: '14px',
              },
            });
          }
        }
        
        // Assign role to the newly created user
        if (userForm.role_id) {
          try {
            await apiService.assignRoleToUser(newUser.id, parseInt(userForm.role_id));
          } catch (error) {
            toast((t) => (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>User created but role assignment failed</span>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '0',
                    marginLeft: '10px',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}
                >
                  ✕
                </button>
              </div>
            ), {
              duration: 6000,
              position: "top-center",
              style: {
                background: '#EF4444',
                color: '#fff',
                padding: '12px 16px',
                fontSize: '14px',
              },
            });
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
              nominee_name: userForm.nominee_name?.trim() || null,
              nominee_phone: userForm.nominee_phone?.trim() || null,
              nominee_relation: userForm.relation?.trim() || null
            };
            await apiService.createMember(memberData);
            if (onDataChanged) {
              onDataChanged();
            }
          }
        }
        
        // Show final success message
        const successMessage = documentsUploaded > 0 
          ? `User created successfully with ${documentsUploaded} document(s) uploaded!`
          : "User created successfully!";
        toast.success(successMessage);
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
        nominee_name: "",
        nominee_phone: "",
        relation: "",
        bank_passbook_path: "",
        bank_passbook_file: null
      });
      // Reload users to show the updated data
      await loadUsers();
      if (onDataChanged) {
        onDataChanged();
      }
    }, {
      onError: (error) => {
        
        // Handle specific field errors from backend
        if (error.message.includes("Username already registered")) {
          setFieldErrors({...fieldErrors, username: "Username already exists"});
          toast((t) => (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>Username already exists</span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0',
                  marginLeft: '10px',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>
          ), {
            duration: 6000,
            position: "top-center",
            style: {
              background: '#EF4444',
              color: '#fff',
              padding: '12px 16px',
              fontSize: '14px',
            },
          });
        } else if (error.message.includes("Email already registered")) {
          setFieldErrors({...fieldErrors, email: "Email already exists"});
          toast((t) => (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>Email already exists</span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0',
                  marginLeft: '10px',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>
          ), {
            duration: 6000,
            position: "top-center",
            style: {
              background: '#EF4444',
              color: '#fff',
              padding: '12px 16px',
              fontSize: '14px',
            },
          });
        } else if (error.message.includes("Aadhar ID already registered")) {
          setFieldErrors({...fieldErrors, aadhar_id: "Aadhar ID already exists"});
          toast((t) => (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>Aadhar ID already exists</span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0',
                  marginLeft: '10px',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>
          ), {
            duration: 6000,
            position: "top-center",
            style: {
              background: '#EF4444',
              color: '#fff',
              padding: '12px 16px',
              fontSize: '14px',
            },
          });
        } else if (error.message.includes("Aadhar document is required")) {
          setFieldErrors({...fieldErrors, aadhar_document: "Aadhar document is required for all users"});
          toast((t) => (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>Aadhar document is required for all users</span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0',
                  marginLeft: '10px',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>
          ), {
            duration: 6000,
            position: "top-center",
            style: {
              background: '#EF4444',
              color: '#fff',
              padding: '12px 16px',
              fontSize: '14px',
            },
          });
        } else if (error.message.includes("Group assignment is required for members")) {
          setFieldErrors({...fieldErrors, group_id: "Group assignment is required for members"});
          toast((t) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span>Group assignment is required for members</span>
            <button
              onClick={() => {
                toast.dismiss(t.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '0',
                marginLeft: '10px',
                fontSize: '18px',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>
          </div>
        ), {
          duration: 6000,
          position: "top-center",
          style: {
            background: '#EF4444',
            color: '#fff',
            padding: '12px 16px',
            fontSize: '14px',
          },
        });
        } else {
          toast((t) => (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>{error.message || "Failed to save user"}</span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0',
                  marginLeft: '10px',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>
          ), {
            duration: 6000,
            position: "top-center",
            style: {
              background: '#EF4444',
              color: '#fff',
              padding: '12px 16px',
              fontSize: '14px',
            },
          });
        }
      }
    });
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username || "",
      email: user.email || "",
      full_name: user.full_name || "",
      password: "", // Leave empty so user must enter new password
      confirm_password: "", // Leave empty so user must enter new password
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
      nominee_name: user.nominee_name || "",
      nominee_phone: user.nominee_phone || "",
      relation: user.member?.nominee_relation || "",
      bank_passbook_path: user.bank_passbook_path || "",
      bank_passbook_file: null
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
      
      // Handle specific error messages from backend with dismiss functionality
      if (error.message && error.message.includes("active loans")) {
        toast((t) => (
          <div className="flex items-center space-x-4 bg-red-600 text-white p-4 rounded-lg shadow-lg">
            <span className="flex-1">Cannot delete user with active loans. Please close all loans first.</span>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-white hover:text-red-200 text-xl font-bold ml-2 transition-colors duration-200"
            >
              ×
            </button>
          </div>
        ), {
          duration: 8000,
          position: "top-center",
        });
      } else if (error.message && error.message.includes("foreign key constraint")) {
        toast((t) => (
          <div className="flex items-center space-x-4 bg-red-600 text-white p-4 rounded-lg shadow-lg">
            <span className="flex-1">Cannot delete user due to existing loan records. Please contact system administrator.</span>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-white hover:text-red-200 text-xl font-bold ml-2 transition-colors duration-200"
            >
              ×
            </button>
          </div>
        ), {
          duration: 8000,
          position: "top-center",
        });
      } else if (error.message && error.message.includes("constraint")) {
        toast((t) => (
          <div className="flex items-center space-x-4 bg-red-600 text-white p-4 rounded-lg shadow-lg">
            <span className="flex-1">Cannot delete user due to existing records. Please check for active loans or other dependencies.</span>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-white hover:text-red-200 text-xl font-bold ml-2 transition-colors duration-200"
            >
              ×
            </button>
          </div>
        ), {
          duration: 8000,
          position: "top-center",
        });
      } else if (error.response?.status === 400) {
        toast((t) => (
          <div className="flex items-center space-x-4 bg-red-600 text-white p-4 rounded-lg shadow-lg">
            <span className="flex-1">Cannot delete user. This user may have active loans or other dependencies.</span>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-white hover:text-red-200 text-xl font-bold ml-2 transition-colors duration-200"
            >
              ×
            </button>
          </div>
        ), {
          duration: 8000,
          position: "top-center",
        });
      } else if (error.response?.status === 404) {
        toast((t) => (
          <div className="flex items-center space-x-4 bg-red-600 text-white p-4 rounded-lg shadow-lg">
            <span className="flex-1">User not found. It may have been deleted by another user.</span>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-white hover:text-red-200 text-xl font-bold ml-2 transition-colors duration-200"
            >
              ×
            </button>
          </div>
        ), {
          duration: 8000,
          position: "top-center",
        });
      } else if (error.response?.status === 403) {
        toast((t) => (
          <div className="flex items-center space-x-4 bg-red-600 text-white p-4 rounded-lg shadow-lg">
            <span className="flex-1">You don't have permission to delete this user.</span>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-white hover:text-red-200 text-xl font-bold ml-2 transition-colors duration-200"
            >
              ×
            </button>
          </div>
        ), {
          duration: 8000,
          position: "top-center",
        });
      } else {
        toast((t) => (
          <div className="flex items-center space-x-4 bg-red-600 text-white p-4 rounded-lg shadow-lg">
            <span className="flex-1">{error.message || "Failed to delete user. Please try again."}</span>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-white hover:text-red-200 text-xl font-bold ml-2 transition-colors duration-200"
            >
              ×
            </button>
          </div>
        ), {
          duration: 8000,
          position: "top-center",
        });
      }
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
      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>{error.message || "Failed to update user status"}</span>
          <button
            onClick={() => {
              toast.dismiss(t.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0',
              marginLeft: '10px',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>
      ), {
        duration: 6000,
        position: "top-center",
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '12px 16px',
          fontSize: '14px',
        },
      });
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
        nominee_name: "",
        nominee_phone: "",
        relation: "",
        bank_passbook_path: "",
        bank_passbook_file: null
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
              {/* User Information Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  User Information
                </h4>
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
                    Password *
                  </label>
                  <div className="relative">
                  <input
                      type={showPassword ? "text" : "password"}
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                    required
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
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={userForm.confirm_password}
                    onChange={(e) => setUserForm({...userForm, confirm_password: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.confirm_password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {fieldErrors.confirm_password && (
                    <div className="mt-1 text-xs text-red-600">{fieldErrors.confirm_password}</div>
                  )}
                  {userForm.confirm_password && (
                    <div className={`mt-1 text-xs ${userForm.password === userForm.confirm_password ? 'text-green-600' : 'text-red-600'}`}>
                      {userForm.password === userForm.confirm_password ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </div>
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
                </div>
              </div>

              {/* Role & Assignment Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Role & Assignment
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </div>

              {/* Documentation Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Documentation
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {editingUser && userForm.aadhar_document_path && (
                    <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center text-green-700">
                        <span className="text-sm">✓ File selected: {userForm.aadhar_document_path}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setUserForm({
                              ...userForm,
                              aadhar_document_path: "",
                              aadhar_document_file: null
                            });
                          }}
                          className="ml-2 text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
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
                    required={!editingUser}
                  />
                  {fieldErrors.aadhar_document && (
                    <div className="mt-1 text-xs text-red-600">{fieldErrors.aadhar_document}</div>
                  )}
                </div>
                </div>
              </div>

              {/* Banking Information Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Banking Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Passbook *
                    </label>
                    {editingUser && userForm.bank_passbook_path && (
                      <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center text-green-700">
                          <span className="text-sm">✓ File selected: {userForm.bank_passbook_path}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setUserForm({
                                ...userForm,
                                bank_passbook_path: "",
                                bank_passbook_file: null
                              });
                            }}
                            className="ml-2 text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setUserForm({
                            ...userForm, 
                            bank_passbook_path: file.name,
                            bank_passbook_file: file
                          });
                          // Clear error when file is selected
                          if (fieldErrors.bank_passbook) {
                            setFieldErrors({...fieldErrors, bank_passbook: null});
                          }
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${
                        fieldErrors.bank_passbook ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required={!editingUser}
                    />
                    {fieldErrors.bank_passbook && (
                      <div className="mt-1 text-xs text-red-600">{fieldErrors.bank_passbook}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Member Information Section - only show when member role is selected */}
                {userForm.role_id && roles.find(role => role.id === parseInt(userForm.role_id))?.name === 'member' && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    Member Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        Nominee Name
                      </label>
                      <input
                        type="text"
                        value={userForm.nominee_name}
                        onChange={(e) => setUserForm({...userForm, nominee_name: e.target.value})}
                        placeholder="Nominee's full name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nominee Phone Number
                      </label>
                      <input
                        type="tel"
                        value={userForm.nominee_phone}
                        onChange={(e) => setUserForm({...userForm, nominee_phone: e.target.value})}
                        placeholder="Nominee's phone number"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          fieldErrors.nominee_phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {fieldErrors.nominee_phone && (
                        <div className="mt-1 text-xs text-red-600">{fieldErrors.nominee_phone}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relation with Nominee
                      </label>
                      <select
                        value={userForm.relation}
                        onChange={(e) => setUserForm({...userForm, relation: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Relation</option>
                        <option value="son">Son</option>
                        <option value="daughter">Daughter</option>
                        <option value="husband">Husband</option>
                        <option value="wife">Wife</option>
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="brother">Brother</option>
                        <option value="sister">Sister</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
              </div>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-white rounded-md flex items-center ${
                    isSubmitting 
                      ? 'bg-green-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {isSubmitting ? (editingUser ? 'Updating...' : 'Creating...') : (editingUser ? 'Update User' : 'Create User')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserForm(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-white rounded-md ${
                    isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
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
