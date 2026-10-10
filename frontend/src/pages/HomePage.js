// HomePage.js - With integrated login AND registration modals on homepage
import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import './HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, logout, login } = useContext(AuthContext);

    // ========== LOGIN MODAL STATE ==========
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginFormData, setLoginFormData] = useState({
        username: '',
        password: ''
    });
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // ========== REGISTRATION MODAL STATE ==========
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [selectedRole, setSelectedRole] = useState('customer');
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
    const [registerError, setRegisterError] = useState('');
    const [registerLoading, setRegisterLoading] = useState(false);
    const [registerFormData, setRegisterFormData] = useState({
        email: '',
        phone: '',
        pharmacy_name: '',
        address: '',
        contract_type: '',
        password_hint: '',
        password: '',
        password2: ''
    });

    const registrationSteps = ['Account Information', 'Business Details', 'Security Setup'];

    // ========== CAROUSEL STATE ==========
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const autoIntervalRef = useRef(null);

    // Professional pharmacy images
    const slides = [
        {
            id: 1,
            image: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=1600&h=700&fit=crop&q=80",
            title: "Welcome to MediStore",
            subtitle: "Your trusted large pharmacy with thousands of medicines & health products"
        },
        {
            id: 2,
            image: "https://images.unsplash.com/photo-1576671081837-49000212a370?w=1600&h=700&fit=crop&q=80",
            title: "Pharmacist Caring for You",
            subtitle: "Our expert pharmacists provide personalized guidance for every customer"
        },
        {
            id: 3,
            image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1600&h=700&fit=crop&q=80",
            title: "Fully Stocked Medicine Store",
            subtitle: "Complete range of medicines, supplements and healthcare products in stock"
        },
        {
            id: 4,
            image: "https://images.unsplash.com/photo-1563213126-a4273aed2016?w=1600&h=700&fit=crop&q=80",
            title: "Professional Health Consultation",
            subtitle: "Get the right medication advice from our certified pharmacists"
        },
        {
            id: 5,
            image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=1600&h=700&fit=crop&q=80",
            title: "Big Pharmacy — All Under One Roof",
            subtitle: "From prescription drugs to everyday healthcare essentials, we have it all"
        }
    ];

    // ========== CAROUSEL FUNCTIONS ==========
    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, [slides.length]);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }, [slides.length]);

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    // Auto-slide every 4 seconds
    useEffect(() => {
        if (!isHovering) {
            autoIntervalRef.current = setInterval(() => {
                nextSlide();
            }, 4000);
        }
        return () => {
            if (autoIntervalRef.current) {
                clearInterval(autoIntervalRef.current);
            }
        };
    }, [isHovering, nextSlide]);

    // ========== LOGIN HANDLERS ==========
    const handleLoginClick = () => {
        setShowLoginModal(true);
        setLoginError('');
        setLoginFormData({ username: '', password: '' });
    };

    const handleCloseLoginModal = () => {
        setShowLoginModal(false);
        setLoginError('');
        setLoginFormData({ username: '', password: '' });
    };

    const handleLoginChange = (e) => {
        setLoginFormData({
            ...loginFormData,
            [e.target.name]: e.target.value
        });
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoginLoading(true);

        const result = await login(loginFormData.username, loginFormData.password);

        if (result.success) {
            if (result.user.user_type === 'seller') {
                toast.success('Login successful! Welcome seller!');
                setShowLoginModal(false);
                navigate('/seller/dashboard');
            } 
            else if (result.user.user_type === 'customer') {
                toast.success('Login successful! Welcome customer!');
                setShowLoginModal(false);
                navigate('/customer/browse');
            }
            else if (result.user.user_type === 'admin') {
                toast.success('Login successful! Welcome admin!');
                setShowLoginModal(false);
                navigate('/admin/dashboard');
            }
            else {
                setLoginError('Invalid user type');
                toast.error('Invalid user type');
            }
        } else {
            setLoginError(result.error);
            toast.error(result.error);
        }

        setLoginLoading(false);
    };

    // ========== REGISTRATION HANDLERS ==========
    const handleRegisterClick = () => {
        setShowRegisterModal(true);
        setRegisterError('');
        setActiveStep(0);
        setSelectedRole('customer');
        setRegisterFormData({
            email: '',
            phone: '',
            pharmacy_name: '',
            address: '',
            contract_type: '',
            password_hint: '',
            password: '',
            password2: ''
        });
    };

    const handleCloseRegisterModal = () => {
        setShowRegisterModal(false);
        setRegisterError('');
        setActiveStep(0);
    };

    const handleRoleChange = (role) => {
        setSelectedRole(role);
        setRegisterError('');
    };

    const handleRegisterChange = (e) => {
        setRegisterFormData({
            ...registerFormData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegisterNext = () => {
        if (activeStep === 0) {
            if (!registerFormData.email || !registerFormData.phone) {
                setRegisterError('Please fill all required fields');
                return;
            }
            if (!registerFormData.email.includes('@')) {
                setRegisterError('Please enter a valid email address');
                return;
            }
        }
        if (activeStep === 1) {
            if (!registerFormData.pharmacy_name || !registerFormData.address) {
                setRegisterError('Please fill all required fields');
                return;
            }
            if (selectedRole === 'customer' && !registerFormData.contract_type) {
                setRegisterError('Please select a contract type');
                return;
            }
        }
        setRegisterError('');
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleRegisterBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
        setRegisterError('');
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setRegisterError('');

        if (registerFormData.password !== registerFormData.password2) {
            setRegisterError('Passwords do not match');
            return;
        }

        if (registerFormData.password.length < 6) {
            setRegisterError('Password must be at least 6 characters long');
            return;
        }

        if (!registerFormData.password_hint) {
            setRegisterError('Please provide a password hint');
            return;
        }

        setRegisterLoading(true);
        try {
            const registrationData = {
                email: registerFormData.email,
                password_hint: registerFormData.password_hint,
                password: registerFormData.password,
                password2: registerFormData.password2,
                phone: registerFormData.phone,
                address: registerFormData.address,
                pharmacy_name: registerFormData.pharmacy_name
            };

            if (selectedRole === 'customer') {
                registrationData.contract_type = registerFormData.contract_type;
                await authAPI.registerCustomer(registrationData);
            } else {
                await authAPI.registerSeller(registrationData);
            }
            
            toast.success('Registration successful! Please login.');
            setShowRegisterModal(false);
            setShowLoginModal(true); // Optionally open login modal after registration
        } catch (err) {
            console.error('Registration error:', err);
            const errorData = err.response?.data;
            let errorMsg = 'Registration failed';
            
            if (errorData) {
                if (typeof errorData === 'object') {
                    const errors = [];
                    Object.keys(errorData).forEach(key => {
                        if (Array.isArray(errorData[key])) {
                            errors.push(`${key}: ${errorData[key].join(', ')}`);
                        } else if (typeof errorData[key] === 'object') {
                            errors.push(`${key}: ${JSON.stringify(errorData[key])}`);
                        } else {
                            errors.push(`${key}: ${errorData[key]}`);
                        }
                    });
                    errorMsg = errors.join(', ');
                } else if (typeof errorData === 'string') {
                    errorMsg = errorData;
                } else if (errorData.error) {
                    errorMsg = errorData.error;
                }
            }
            
            setRegisterError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setRegisterLoading(false);
        }
    };

    const getRegistrationStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <div className="reg-form-group">
                        <div className="reg-form-field">
                            <label>
                                <i className="fas fa-envelope"></i>
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={registerFormData.email}
                                onChange={handleRegisterChange}
                                placeholder="your@email.com"
                                required
                            />
                        </div>
                        <div className="reg-form-field">
                            <label>
                                <i className="fas fa-phone"></i>
                                Phone Number
                            </label>
                            <input
                                type="text"
                                name="phone"
                                value={registerFormData.phone}
                                onChange={handleRegisterChange}
                                placeholder="+1234567890"
                                required
                            />
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="reg-form-group">
                        <div className="reg-form-field">
                            <label>
                                <i className="fas fa-store"></i>
                                {selectedRole === 'seller' ? "Business Name" : "Pharmacy Name"}
                            </label>
                            <input
                                type="text"
                                name="pharmacy_name"
                                value={registerFormData.pharmacy_name}
                                onChange={handleRegisterChange}
                                placeholder={selectedRole === 'seller' ? "Enter your business name" : "Enter your pharmacy name"}
                                required
                            />
                        </div>
                        <div className="reg-form-field">
                            <label>
                                <i className="fas fa-location-dot"></i>
                                Address
                            </label>
                            <textarea
                                name="address"
                                rows="3"
                                value={registerFormData.address}
                                onChange={handleRegisterChange}
                                placeholder="Enter your full business address"
                                required
                            />
                        </div>
                        {selectedRole === 'customer' && (
                            <div className="reg-form-field">
                                <label>
                                    <i className="fas fa-file-contract"></i>
                                    Contract Type
                                </label>
                                <select
                                    name="contract_type"
                                    value={registerFormData.contract_type}
                                    onChange={handleRegisterChange}
                                    required
                                >
                                    <option value="">Select Contract Type</option>
                                    <option value="month-to-month"> Month-to-Month </option>
                                    <option value="1-year">1-Year Contract </option>
                                    <option value="2-year"> 2-Year Contract </option>
                                    <option value="prepaid"> Prepaid - Pay as you go</option>
                                    <option value="postpaid"> Postpaid - Pay at end of month</option>
                                </select>
                            </div>
                        )}
                    </div>
                );
            case 2:
                return (
                    <div className="reg-form-group">
                        <div className="reg-form-field">
                            <label>
                                <i className="fas fa-info-circle"></i>
                                Password Hint
                            </label>
                            <input
                                type="text"
                                name="password_hint"
                                value={registerFormData.password_hint}
                                onChange={handleRegisterChange}
                                placeholder="e.g., My favorite pet's name"
                                required
                            />
                            <small className="reg-hint">A hint to help you remember your password</small>
                        </div>
                        <div className="reg-form-field">
                            <label>
                                <i className="fas fa-key"></i>
                                Password
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showRegPassword ? 'text' : 'password'}
                                    name="password"
                                    value={registerFormData.password}
                                    onChange={handleRegisterChange}
                                    placeholder="Create a strong password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowRegPassword(!showRegPassword)}
                                >
                                    <i className={showRegPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                                </button>
                            </div>
                            <small className="reg-hint">Password must be at least 6 characters</small>
                        </div>
                        <div className="reg-form-field">
                            <label>
                                <i className="fas fa-key"></i>
                                Confirm Password
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showRegConfirmPassword ? 'text' : 'password'}
                                    name="password2"
                                    value={registerFormData.password2}
                                    onChange={handleRegisterChange}
                                    placeholder="Confirm your password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                                >
                                    <i className={showRegConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const handleLogout = () => { logout(); navigate('/'); };
    const handleDashboardClick = () => {
        if (user?.user_type === 'seller') {
            navigate('/seller/dashboard');
        } else {
            navigate('/customer/browse');
        }
    };

    return (
        <div className="home-page">

            {/* ===== HEADER ===== */}
            <header className="site-header">
                <div className="header-container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div className="logo-container">
                            <i className="fas fa-capsules logo-icon"></i>
                        </div>
                        <div>
                            <div className="logo-text">CUSTOMER CHURN PREDICTION SYSTEM</div>
                            <div className="logo-subtitle">Your Health First</div>
                        </div>
                    </div>

                    <div className="header-buttons">
                        {isAuthenticated ? (
                            <>
                                <button className="auth-button" onClick={handleDashboardClick}>
                                    <i className="fas fa-dashboard" style={{ marginRight: '8px' }}></i>
                                    Dashboard
                                </button>
                                <button className="auth-button seller-btn" onClick={handleLogout}>
                                    <i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }}></i>
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="auth-button" onClick={handleLoginClick}>
                                    <i className="fas fa-sign-in-alt" style={{ marginRight: '8px' }}></i>
                                    Login
                                </button>
                                <button className="auth-button seller-btn" onClick={handleRegisterClick}>
                                    <i className="fas fa-user-plus" style={{ marginRight: '8px' }}></i>
                                    Register
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* ===== LOGIN MODAL ===== */}
            {showLoginModal && (
                <div className="login-modal-overlay" onClick={handleCloseLoginModal}>
                    <div className="login-modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="login-modal-header">
                            <h2>Welcome Back</h2>
                            <button className="login-modal-close" onClick={handleCloseLoginModal}>&times;</button>
                        </div>
                        <p className="login-modal-subtitle">Login to your account</p>

                        {loginError && (
                            <div className="login-error-alert">
                                <i className="fas fa-exclamation-circle"></i>
                                <span>{loginError}</span>
                            </div>
                        )}

                        <form onSubmit={handleLoginSubmit} className="login-form">
                            <div className="login-form-group">
                                <label>
                                    <i className="fas fa-envelope"></i>
                                     Username
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={loginFormData.username}
                                    onChange={handleLoginChange}
                                    placeholder="Enter your  username"
                                    required
                                />
                            </div>

                            <div className="login-form-group">
                                <label>
                                    <i className="fas fa-key"></i>
                                    Password
                                </label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={loginFormData.password}
                                        onChange={handleLoginChange}
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                                    </button>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="login-submit-btn"
                                disabled={loginLoading}
                            >
                                {loginLoading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i>
                                        Logging in...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-sign-in-alt"></i>
                                        Login
                                    </>
                                )}
                            </button>

                            <div className="login-modal-footer">
                                <p>
                                    Don't have an account?{' '}
                                    <button 
                                        type="button"
                                        className="register-link"
                                        onClick={() => {
                                            handleCloseLoginModal();
                                            handleRegisterClick();
                                        }}
                                    >
                                        Register here
                                    </button>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== REGISTRATION MODAL ===== */}
            {showRegisterModal && (
                <div className="login-modal-overlay" onClick={handleCloseRegisterModal}>
                    <div className="register-modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="login-modal-header">
                            <h2>Create Your Account</h2>
                            <button className="login-modal-close" onClick={handleCloseRegisterModal}>&times;</button>
                        </div>
                        <p className="login-modal-subtitle">Join our Medical Shop and start ordering medicines </p>

                        {/* Role Selection Buttons */}
                        <div className="reg-role-buttons">
                            <button
                                className={`reg-role-btn ${selectedRole === 'customer' ? 'active' : ''}`}
                                onClick={() => handleRoleChange('customer')}
                            >
                                Customer
                            </button>
                            <button
                                className={`reg-role-btn ${selectedRole === 'seller' ? 'active' : ''}`}
                                onClick={() => handleRoleChange('seller')}
                            >
                                Seller
                            </button>
                        </div>

                        {registerError && (
                            <div className="login-error-alert">
                                <i className="fas fa-exclamation-circle"></i>
                                <span>{registerError}</span>
                            </div>
                        )}

                        {/* Stepper */}
                        <div className="reg-stepper">
                            {registrationSteps.map((label, index) => (
                                <div key={label} className={`reg-step ${activeStep === index ? 'active' : ''} ${activeStep > index ? 'completed' : ''}`}>
                                    <div className="reg-step-circle">{activeStep > index ? '✓' : index + 1}</div>
                                    <div className="reg-step-label">{label}</div>
                                    {index < registrationSteps.length - 1 && <div className="reg-step-line"></div>}
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleRegisterSubmit}>
                            {getRegistrationStepContent(activeStep)}

                            <div className="reg-buttons">
                                <button
                                    type="button"
                                    onClick={handleRegisterBack}
                                    disabled={activeStep === 0}
                                    className="reg-back-btn"
                                >
                                    Back
                                </button>
                                {activeStep === registrationSteps.length - 1 ? (
                                    <button
                                        type="submit"
                                        className="reg-submit-btn"
                                        disabled={registerLoading}
                                    >
                                        {registerLoading ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin"></i>
                                                Registering...
                                            </>
                                        ) : (
                                            'Register'
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleRegisterNext}
                                        className="reg-next-btn"
                                    >
                                        Next
                                    </button>
                                )}
                            </div>
                        </form>

                        <div className="login-modal-footer">
                            <p>
                                Already have an account?{' '}
                                <button 
                                    type="button"
                                    className="register-link"
                                    onClick={() => {
                                        handleCloseRegisterModal();
                                        handleLoginClick();
                                    }}
                                >
                                    Login here
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== CAROUSEL SECTION ===== */}
            <section
                className="carousel-section"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                <div className="carousel-container">
                    <div className="carousel-wrapper">
                        <div
                            className="carousel-slides"
                            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        >
                            {slides.map((slide) => (
                                <div key={slide.id} className="carousel-slide">
                                    <img
                                        src={slide.image}
                                        alt={slide.title}
                                        loading="lazy"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1600&h=700&fit=crop&q=80";
                                        }}
                                    />
                                    <div className="slide-overlay">
                                        <div className="slide-content">
                                            <h2>{slide.title}</h2>
                                            <p>{slide.subtitle}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="carousel-arrow carousel-arrow-left" onClick={prevSlide}>
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <button className="carousel-arrow carousel-arrow-right" onClick={nextSlide}>
                            <i className="fas fa-chevron-right"></i>
                        </button>

                        <div className="slide-counter">
                            {currentSlide + 1} / {slides.length}
                        </div>

                        <div className="carousel-dots">
                            {slides.map((_, idx) => (
                                <button
                                    key={idx}
                                    className={`carousel-dot ${currentSlide === idx ? 'active' : ''}`}
                                    onClick={() => goToSlide(idx)}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== FEATURES STRIP ===== */}
            <section className="features-strip">
                <div className="features-container">
                    <div className="feature-item">
                        <i className="fas fa-pills feature-icon"></i>
                        <span>10,000+ Medicines</span>
                    </div>
                    <div className="feature-divider"></div>
                    <div className="feature-item">
                        <i className="fas fa-user-md feature-icon"></i>
                        <span>Expert Pharmacists</span>
                    </div>
                    <div className="feature-divider"></div>
                    <div className="feature-item">
                        <i className="fas fa-truck feature-icon"></i>
                        <span>Fast Delivery</span>
                    </div>
                    <div className="feature-divider"></div>
                    <div className="feature-item">
                        <i className="fas fa-shield-alt feature-icon"></i>
                        <span>100% Genuine Products</span>
                    </div>
                </div>
            </section>

            {/* ===== PRODUCTS PREVIEW SECTION ===== */}
            <section className="products-preview">
                <div className="section-header">
                    <h2>Popular Health Products</h2>
                    <p>Trusted by thousands of customers</p>
                </div>
                <div className="products-grid">
                    {[
                        { name: "Vitamin C Complex", description: "Boost your immune system", price: "200frw", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop", badge: "Bestseller" },
                        { name: "First Aid Kit", description: "Essential medical supplies", price: "340fr", image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=300&fit=crop", badge: "Popular" },
                        { name: "Pain Relief Gel", description: "Fast acting relief", price: "500fr", image: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=400&h=300&fit=crop", badge: "Sale" },
                        { name: "Blood Pressure Monitor", description: "Track your health at home", price: "100fr", image: "https://images.unsplash.com/photo-1576671081837-49000212a370?w=400&h=300&fit=crop", badge: "New" }
                    ].map((product, index) => (
                        <div key={index} className="product-card">
                            <div className="product-image" style={{ backgroundImage: `url(${product.image})` }}>
                                <span className="product-badge">{product.badge}</span>
                            </div>
                            <div className="product-info">
                                <h3>{product.name}</h3>
                                <p>{product.description}</p>
                                <div className="product-price">
                                    <span className="price">{product.price}</span>
                                    <button className="add-to-cart">
                                        <i className="fas fa-shopping-cart"></i> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="footer">
                <p>&copy; 2026 Customer churn prediction system. All rights reserved.</p>
            </footer>

        </div>
    );
};

export default HomePage;