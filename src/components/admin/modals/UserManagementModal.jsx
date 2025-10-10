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
    bank_passbook_file: null,
    // New enhanced member fields
    age: "",
    profession: "",
    father_husband_name: "",
    caste: "",
    photo: null,
    photo_url: ""
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
      const data = await apiService.getUsers(0, 1000);
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
    
    console.log("🔍 Validating form with data:", userForm);
    
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
    
    // IFSC Code validation - make it optional and more lenient
    if (userForm.ifsc_code?.trim()) {
      const ifscCode = userForm.ifsc_code.trim().toUpperCase();
      const cleanIfsc = ifscCode.replace(/\s/g, '');
      
      // Basic validation: should be alphanumeric and reasonable length
      if (cleanIfsc.length < 8 || cleanIfsc.length > 15 || !/^[A-Z0-9]+$/.test(cleanIfsc)) {
        errors.ifsc_code = "IFSC code should be 8-15 alphanumeric characters (e.g., SBIN0001234)";
      }
    }
    
    // Aadhar document validation - make it optional for now to avoid blocking user creation
    // For new users: require file upload
    // For editing users: require either new file OR existing file path
    if (!editingUser && !userForm.aadhar_document_file) {
      // Make this a warning instead of an error for now
      console.log("⚠️ Aadhar document not provided for new user - this is optional");
    } else if (editingUser && !userForm.aadhar_document_file && !userForm.aadhar_document_path) {
      // Make this a warning instead of an error for now
      console.log("⚠️ Aadhar document not provided for editing user - this is optional");
    }
    
    // Member-specific field validation
    if (userForm.role_id && roles.find(role => role.id === parseInt(userForm.role_id))?.name === 'member') {
      if (userForm.monthly_income && (isNaN(parseFloat(userForm.monthly_income)) || parseFloat(userForm.monthly_income) < 0)) {
        errors.monthly_income = "Monthly income must be a valid positive number";
      }
      
      if (userForm.nominee_phone?.trim() && !/^[6-9]\d{9}$/.test(userForm.nominee_phone.replace(/\s/g, ''))) {
        errors.nominee_phone = "Nominee phone must be a valid 10-digit Indian mobile number";
      }

      // New enhanced member field validations
      if (userForm.age && (isNaN(parseInt(userForm.age)) || parseInt(userForm.age) < 18 || parseInt(userForm.age) > 100)) {
        errors.age = "Age must be a valid number between 18 and 100";
      }
    }
    
    console.log("🔍 Validation errors found:", errors);
    console.log("🔍 Number of errors:", Object.keys(errors).length);
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setFieldErrors({});
    clearError();
    
    // Validate form
    console.log("🔍 About to validate form...");
    const isValid = validateForm();
    console.log("🔍 Form validation result:", isValid);
    
    if (!isValid) {
      console.log("❌ Form validation failed, showing error toast");
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
      console.log("🚀 Starting user creation process...");
      // Create user data - only include fields that are valid for UserCreate schema
      const userData = {
        username: userForm.username?.trim() || "",
        email: userForm.email?.trim() || "",
        full_name: userForm.full_name?.trim() || "",
        ...(userForm.password?.trim() && { password: userForm.password }),
        ...(userForm.role_id && { role_id: parseInt(userForm.role_id) }),
        // Additional user details - only include fields that exist in UserCreate schema
        aadhar_id: userForm.aadhar_id?.trim() || null,
        aadhar_document_path: editingUser ? userForm.aadhar_document_path : "pending_upload", // Keep existing path for edit, placeholder for create
        bank_account_number: userForm.bank_account_number?.trim() || null,
        bank_name: userForm.bank_name?.trim() || null,
        bank_branch: userForm.bank_branch?.trim() || null,
        ifsc_code: userForm.ifsc_code?.trim() || null,
        // User-level fields only
        monthly_income: userForm.monthly_income ? parseFloat(userForm.monthly_income) : null,
        nominee_name: userForm.nominee_name?.trim() || null,
        nominee_phone: userForm.nominee_phone?.trim() || null,
        nominee_relation: userForm.relation?.trim() || null,
        bank_passbook_path: editingUser ? userForm.bank_passbook_path : (userForm.bank_passbook_path?.trim() || null), // Keep existing path for edit
        // Group assignment for members
        group_id: userForm.group_id ? parseInt(userForm.group_id) : null,
        // Enhanced member fields - include in userData so they get passed to member creation
        age: userForm.age ? parseInt(userForm.age) : null,
        profession: userForm.profession?.trim() || null,
        father_husband_name: userForm.father_husband_name?.trim() || null,
        caste: userForm.caste?.trim() || null,
        photo_url: editingUser ? userForm.photo_url : (userForm.photo_url?.trim() || null)
      };

      // Create member data - only include member-specific fields
      const memberData = {
        // Member-specific fields that should be handled separately
        age: userForm.age ? parseInt(userForm.age) : null,
        profession: userForm.profession?.trim() || null,
        father_husband_name: userForm.father_husband_name?.trim() || null,
        caste: userForm.caste?.trim() || null,
        photo_url: editingUser ? userForm.photo_url : (userForm.photo_url?.trim() || null),
        // Group assignment
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
        
        // Upload member photo if provided during edit
        if (userForm.photo) {
          totalDocuments++;
          try {
            await apiService.uploadMemberPhoto(editingUser.member.id, userForm.photo);
            documentsUploaded++;
          } catch (error) {
            console.error('❌ Photo upload failed:', error);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);
            
            toast((t) => (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>Member photo upload failed: {error.message}. Please upload manually.</span>
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
                nominee_relation: userForm.relation?.trim() || null,
                // Include new enhanced member fields
                age: userForm.age ? parseInt(userForm.age) : null,
                profession: userForm.profession?.trim() || null,
                father_husband_name: userForm.father_husband_name?.trim() || null,
                caste: userForm.caste?.trim() || null,
                photo_url: userForm.photo_url?.trim() || null
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
        console.log("✅ User created successfully:", newUser);
        
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
        
        // Upload member photo if provided
        if (userForm.photo) {
          totalDocuments++;
          try {
            console.log('📸 Attempting photo upload...');
            console.log('📸 newUser:', newUser);
            console.log('📸 newUser.id:', newUser.id);
            
            if (!newUser || !newUser.id) {
              throw new Error('User not found or user ID is missing');
            }
            
            // Use the same approach as Aadhar and Bank Passbook - find member by user ID
            await apiService.uploadMemberPhotoByUserId(newUser.id, userForm.photo);
            documentsUploaded++;
            console.log('✅ Photo upload successful');
          } catch (error) {
            console.error('❌ Photo upload failed:', error);
            console.error('❌ Error message:', error.message);
            toast((t) => (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>Member photo upload failed: {error.message}. Please upload manually.</span>
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
        
        // Note: Member creation is now handled automatically by the backend
        // when creating a user with member role and group_id, so we don't need
        // to create a separate member record here anymore.
        
        // Show final success message
        const successMessage = documentsUploaded > 0 
          ? `User created successfully with ${documentsUploaded} document(s) uploaded!`
          : "User created successfully!";
        console.log("✅ User creation successful:", successMessage);
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
        bank_passbook_file: null,
        // New enhanced member fields
        age: "",
        profession: "",
        father_husband_name: "",
        caste: "",
        photo: null,
        photo_url: ""
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

  const handleEditUser = async (user) => {
    try {
      // Fetch complete user data to ensure we have all member information
      const completeUser = await apiService.getUser(user.id);
      setEditingUser(completeUser);
      setUserForm({
        username: completeUser.username || "",
        email: completeUser.email || "",
        full_name: completeUser.full_name || "",
        password: "", // Leave empty so user must enter new password
        confirm_password: "", // Leave empty so user must enter new password
        role_id: completeUser.roles?.[0]?.id?.toString() || "",
        group_id: completeUser.member?.group_id?.toString() || "",
        aadhar_id: completeUser.aadhar_id || "",
        aadhar_document_path: completeUser.aadhar_document_path || "",
        aadhar_document_file: null,
        bank_account_number: completeUser.bank_account_number || "",
        bank_name: completeUser.bank_name || "",
        bank_branch: completeUser.bank_branch || "",
        ifsc_code: completeUser.ifsc_code || "",
        // Member-specific fields
        monthly_income: completeUser.monthly_income || "",
        nominee_name: completeUser.nominee_name || "",
        nominee_phone: completeUser.nominee_phone || "",
        relation: completeUser.member?.nominee_relation || "",
        bank_passbook_path: completeUser.bank_passbook_path || "",
        bank_passbook_file: null,
        // New enhanced member fields
        age: completeUser.member?.age || "",
        profession: completeUser.member?.profession || "",
        father_husband_name: completeUser.member?.father_husband_name || "",
        caste: completeUser.member?.caste || "",
        photo: null,
        photo_url: completeUser.member?.photo_url || ""
      });
      setShowUserForm(true);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user data for editing');
    }
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">User Management</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200"
          >
            <FaTimes className="h-6 w-6" />
          </button>
        </div>

        {/* Search and Add User */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              placeholder="Search users by name, email, or role..."
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 shadow-sm text-sm sm:text-base"
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
                bank_passbook_file: null,
                // New enhanced member fields
                age: "",
                profession: "",
                father_husband_name: "",
                caste: "",
                photo: null,
                photo_url: ""
              });
              setShowUserForm(true);
            }}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <FaPlus className="h-4 w-4" />
            Add User
          </button>
        </div>

        {/* User Form */}
        {showUserForm && (
          <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FaPlus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {editingUser ? "Edit User" : "Create New User"}
                    </h3>
                    <p className="text-blue-100 text-sm">
                      {editingUser ? "Update user information and settings" : "Add a new user to the system"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUserForm(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200 cursor-pointer"
                  title="Close Form"
                >
                  <FaTimes className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6">
            <form onSubmit={handleCreateUser}>
              {/* User Information Section */}
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">User Information</h4>
                </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={userForm.username}
                      onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        fieldErrors.username ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400 focus:bg-white'
                      }`}
                      placeholder="Enter username"
                      required
                    />
                  </div>
                  {fieldErrors.username && (
                    <div className="mt-2 flex items-center text-sm text-red-600">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.username}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400 focus:bg-white'
                      }`}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  {fieldErrors.email && (
                    <div className="mt-2 flex items-center text-sm text-red-600">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.email}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={userForm.password}
                      onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        fieldErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400 focus:bg-white'
                      }`}
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <div className="mt-2 flex items-center text-sm text-red-600">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.password}
                    </div>
                  )}
                  {!editingUser && userForm.password && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                      <div className="space-y-1">
                        <div className={`flex items-center gap-2 text-sm ${userForm.password.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${userForm.password.length >= 8 ? 'bg-green-100' : 'bg-red-100'}`}>
                            {userForm.password.length >= 8 ? '✓' : '✗'}
                          </span>
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center gap-2 text-sm ${/[A-Z]/.test(userForm.password) ? 'text-green-600' : 'text-red-600'}`}>
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${/[A-Z]/.test(userForm.password) ? 'bg-green-100' : 'bg-red-100'}`}>
                            {/[A-Z]/.test(userForm.password) ? '✓' : '✗'}
                          </span>
                          <span>One uppercase letter</span>
                        </div>
                        <div className={`flex items-center gap-2 text-sm ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(userForm.password) ? 'text-green-600' : 'text-red-600'}`}>
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(userForm.password) ? 'bg-green-100' : 'bg-red-100'}`}>
                            {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(userForm.password) ? '✓' : '✗'}
                          </span>
                          <span>One special character</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={userForm.confirm_password}
                      onChange={(e) => setUserForm({...userForm, confirm_password: e.target.value})}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        fieldErrors.confirm_password ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400 focus:bg-white'
                      }`}
                      placeholder="Confirm password"
                      required
                    />
                  </div>
                  {fieldErrors.confirm_password && (
                    <div className="mt-2 flex items-center text-sm text-red-600">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.confirm_password}
                    </div>
                  )}
                  {userForm.confirm_password && (
                    <div className={`mt-2 flex items-center text-sm ${userForm.password === userForm.confirm_password ? 'text-green-600' : 'text-red-600'}`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs mr-2 ${userForm.password === userForm.confirm_password ? 'bg-green-100' : 'bg-red-100'}`}>
                        {userForm.password === userForm.confirm_password ? '✓' : '✗'}
                      </span>
                      {userForm.password === userForm.confirm_password ? 'Passwords match' : 'Passwords do not match'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={userForm.full_name}
                      onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 focus:bg-white"
                      placeholder="Enter full name"
                    />
                  </div>
                </div>
                </div>
              </div>

              {/* Role & Assignment Section */}
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Role & Assignment</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <select
                      value={userForm.role_id}
                      onChange={(e) => setUserForm({...userForm, role_id: e.target.value, group_id: ""})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 focus:bg-white appearance-none bg-white cursor-pointer"
                    >
                      <option value="">Select Role</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                {userForm.role_id && roles.find(role => role.id === parseInt(userForm.role_id))?.name === 'member' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Group Assignment *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <select
                        value={userForm.group_id}
                        onChange={(e) => {
                          setUserForm({...userForm, group_id: e.target.value});
                          // Clear error when group is selected
                          if (fieldErrors.group_id) {
                            setFieldErrors({...fieldErrors, group_id: null});
                          }
                        }}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 focus:bg-white appearance-none bg-white cursor-pointer ${
                          fieldErrors.group_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
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
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {fieldErrors.group_id && (
                      <div className="mt-2 flex items-center text-sm text-red-600">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {fieldErrors.group_id}
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>

              {/* Documentation Section */}
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Documentation</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aadhar ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={userForm.aadhar_id}
                      onChange={(e) => setUserForm({...userForm, aadhar_id: e.target.value})}
                      placeholder="12-digit Aadhar number"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 focus:bg-white ${
                        fieldErrors.aadhar_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {fieldErrors.aadhar_id && (
                    <div className="mt-2 flex items-center text-sm text-red-600">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.aadhar_id}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aadhar Document *
                  </label>
                  {editingUser && userForm.aadhar_document_path && (
                    <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between text-green-700">
                        <div className="flex items-center">
                          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium">File selected: {userForm.aadhar_document_path}</span>
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
                          className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors duration-200 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="relative">
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
                      className={`w-full px-4 py-3 border-2 border-dashed rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${
                        fieldErrors.aadhar_document ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required={!editingUser}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-gray-500 mt-1">Click to upload or drag and drop</p>
                      </div>
                    </div>
                  </div>
                  {fieldErrors.aadhar_document && (
                    <div className="mt-2 flex items-center text-sm text-red-600">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.aadhar_document}
                    </div>
                  )}
                </div>
                </div>
              </div>

              {/* Banking Information Section */}
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Banking Information</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Account Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={userForm.bank_account_number}
                      onChange={(e) => setUserForm({...userForm, bank_account_number: e.target.value})}
                      placeholder="Bank account number"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 focus:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={userForm.bank_name}
                      onChange={(e) => setUserForm({...userForm, bank_name: e.target.value})}
                      placeholder="Bank name"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 focus:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Branch
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={userForm.bank_branch}
                      onChange={(e) => setUserForm({...userForm, bank_branch: e.target.value})}
                      placeholder="Bank branch"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 focus:bg-white"
                    />
                  </div>
                </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IFSC Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={userForm.ifsc_code}
                        onChange={(e) => setUserForm({...userForm, ifsc_code: e.target.value})}
                        placeholder="11-character IFSC code"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 focus:bg-white"
                      />
                    </div>
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
                            className="ml-2 text-red-600 hover:text-red-800 text-sm cursor-pointer"
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

              {/* Enhanced Member Information Section - only show when member role is selected */}
                {userForm.role_id && roles.find(role => role.id === parseInt(userForm.role_id))?.name === 'member' && (
                <div className="mb-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Member Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Income (₹)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={userForm.monthly_income}
                          onChange={(e) => setUserForm({...userForm, monthly_income: e.target.value})}
                          placeholder="Enter monthly income amount"
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 focus:bg-white ${
                            fieldErrors.monthly_income ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {fieldErrors.monthly_income && (
                        <div className="mt-2 flex items-center text-sm text-red-600">
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors.monthly_income}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nominee Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={userForm.nominee_name}
                          onChange={(e) => setUserForm({...userForm, nominee_name: e.target.value})}
                          placeholder="Nominee's full name"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 focus:bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nominee Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <input
                          type="tel"
                          value={userForm.nominee_phone}
                          onChange={(e) => setUserForm({...userForm, nominee_phone: e.target.value})}
                          placeholder="Nominee's phone number"
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 focus:bg-white ${
                            fieldErrors.nominee_phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {fieldErrors.nominee_phone && (
                        <div className="mt-2 flex items-center text-sm text-red-600">
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors.nominee_phone}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relation with Nominee
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <select
                          value={userForm.relation}
                          onChange={(e) => setUserForm({...userForm, relation: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 focus:bg-white appearance-none bg-white cursor-pointer"
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
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <input
                          type="number"
                          min="18"
                          max="100"
                          value={userForm.age}
                          onChange={(e) => setUserForm({...userForm, age: e.target.value})}
                          placeholder="Enter age"
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 focus:bg-white ${
                            fieldErrors.age ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {fieldErrors.age && (
                        <div className="mt-2 flex items-center text-sm text-red-600">
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors.age}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profession/Occupation
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={userForm.profession}
                          onChange={(e) => setUserForm({...userForm, profession: e.target.value})}
                          placeholder="Enter profession or occupation"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 focus:bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Father's/Husband's Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={userForm.father_husband_name}
                          onChange={(e) => setUserForm({...userForm, father_husband_name: e.target.value})}
                          placeholder="Enter father's or husband's name"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 focus:bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Caste
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={userForm.caste}
                          onChange={(e) => setUserForm({...userForm, caste: e.target.value})}
                          placeholder="Enter caste"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 focus:bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Member Photo
                      </label>
                      {editingUser && userForm.photo_url && (
                        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between text-green-700">
                            <div className="flex items-center">
                              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-medium">Photo: {userForm.photo_url}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setUserForm({
                                  ...userForm,
                                  photo_url: "",
                                  photo: null
                                });
                              }}
                              className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors duration-200 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setUserForm({
                                ...userForm, 
                                photo_url: file.name,
                                photo: file
                              });
                            }
                          }}
                          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="text-center">
                            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-gray-500 mt-1">Click to upload photo or drag and drop</p>
                          </div>
                        </div>
                      </div>
                    </div>
              </div>
                </div>
              )}
              {/* Form Actions */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserForm(false);
                      setEditingUser(null);
                      resetForm();
                    }}
                    disabled={isSubmitting}
                    className={`px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg flex items-center justify-center transition-all duration-200 w-full sm:w-auto font-medium ${
                      isSubmitting 
                        ? 'cursor-not-allowed opacity-50' 
                        : 'hover:bg-gray-50 hover:border-gray-400 cursor-pointer shadow-sm hover:shadow-md'
                    }`}
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-3 text-white rounded-lg flex items-center justify-center transition-all duration-200 w-full sm:w-auto font-medium ${
                      isSubmitting 
                        ? 'bg-green-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105'
                    }`}
                  >
                    {isSubmitting && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    )}
                    {isSubmitting ? (
                      editingUser ? 'Updating User...' : 'Creating User...'
                    ) : (
                      <>
                        {editingUser ? (
                          <>
                            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Update User
                          </>
                        ) : (
                          <>
                            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create User
                          </>
                        )}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
            </div>
          </div>
        )}

        {/* Users Table - Desktop View */}
        {isLoading ? (
          <div className="text-center py-4">Loading users...</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Group
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        {userFilter?.trim() === "" ? "No users found" : "No users match your search"}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
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
                            <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full shadow-sm">
                              {user.roles[0].name}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">No role</span>
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
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                            user.is_active 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-blue-600 hover:text-blue-900 cursor-pointer transition-colors duration-200 p-2 rounded-lg hover:bg-blue-50"
                              title="Edit User"
                            >
                              <FaEdit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(user)}
                              className={`${
                                user.is_active 
                                  ? "text-red-600 hover:text-red-900 hover:bg-red-50" 
                                  : "text-green-600 hover:text-green-900 hover:bg-green-50"
                              } cursor-pointer transition-colors duration-200 p-2 rounded-lg`}
                              title={user.is_active ? "Deactivate User" : "Activate User"}
                            >
                              {user.is_active ? <FaBan className="h-4 w-4" /> : <FaCheck className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900 cursor-pointer transition-colors duration-200 p-2 rounded-lg hover:bg-red-50"
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

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  {userFilter?.trim() === "" ? "No users found" : "No users match your search"}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {user.full_name || user.username}
                        </h3>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                        <p className="text-xs text-gray-600 mt-1">{user.email}</p>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900 cursor-pointer transition-colors duration-200 p-2 rounded-lg hover:bg-blue-50"
                          title="Edit User"
                        >
                          <FaEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          className={`${
                            user.is_active 
                              ? "text-red-600 hover:text-red-900 hover:bg-red-50" 
                              : "text-green-600 hover:text-green-900 hover:bg-green-50"
                          } cursor-pointer transition-colors duration-200 p-2 rounded-lg`}
                          title={user.is_active ? "Deactivate User" : "Activate User"}
                        >
                          {user.is_active ? <FaBan className="h-4 w-4" /> : <FaCheck className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 cursor-pointer transition-colors duration-200 p-2 rounded-lg hover:bg-red-50"
                          title="Delete User"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.roles?.[0]?.name && (
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {user.roles[0].name}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                        user.is_active 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                      {user.member?.group?.name && (
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                          {user.member.group.name}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
        
        <div className="mt-4 sm:mt-6 px-3 sm:px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            <span className="font-medium">Showing {filteredUsers.length} of {users.length} users</span>
            {userFilter?.trim() !== "" && (
              <span className="ml-2 text-blue-600">
                matching "{userFilter}"
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserManagementModal;
