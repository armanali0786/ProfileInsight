import React, { useState , useRef} from "react";
import { Formik, Form, Field, ErrorMessage ,FormikProps } from "formik";
import * as Yup from "yup";
import { addUser, updateUser } from "../../indexedDB";
import toast, { Toaster } from 'react-hot-toast';
import EmailIcon from '../../assets/images/email-icon.png';
import EyeSlashIcon from '../../assets/images/eye-slash.png'; 
import EyeIcon from '../../assets/images/eye.png'; 
import PasswordIcon from '../../assets/images/password-icon.png';
import BuildingsIcon from '../../assets/images/buildings.png';
import UserListIcon from '../../assets/images/user-list.png';
import User2Icon from '../../assets/images/user2.png';
import closeIcon from '../../assets/images/close.png';
import { useNavigate } from "react-router-dom";
import LinkedinIcon from "../../assets/images/linkedin-icon.png";

interface SignUpFormValues {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignUp({
  userData,
}) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });
  const [showConfirmPassword, setShowConfirmPassword] = useState(!userData);

    /******------------------- initialValues for Validation of Registration User  -----------------------*******/
  const initialValues: SignUpFormValues = userData 
  ? { 
      firstName: userData.firstName || "", 
      lastName: userData.lastName || "", 
      companyName: userData.companyName || "", 
      email: userData.email || "", 
      password: "",
      confirmPassword: ""  
    } 
  : { 
      firstName: "", 
      lastName: "", 
      companyName: "", 
      email: "", 
      password: "", 
      confirmPassword: "" 
    };

    /*------------------  Validation for Registration User  ----------------------*/
    const createAccountSchema = Yup.object().shape({
      firstName: Yup.string().required("First Name is required."),
      lastName: Yup.string().required("Last Name is required."),
      companyName: Yup.string().required("Company Name is required."),
      email: Yup.string().email("Invalid Email Address").required("Email Address is required."),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters long.')
        .when([], {
          is: () => !userData, // Required only when userData is not present
          then: schema => schema.required('Password is required.'),
        }),
      confirmPassword: Yup.string()
        .when([], {
          is: () => !userData, // When userData is not present
          then: schema => schema
            .required('Confirm Password is required.')
            .oneOf([Yup.ref('password')], 'Passwords must match.'),
          otherwise: schema => schema
            .oneOf([Yup.ref('password')], 'Passwords must match.') // Match if userData is present
        })
        .nullable(), // Allows the field to be null when userData is present
    });
    
  /*------------------  Create Registration  ----------------------*/
  const handleCreateAccount = async (values) => {
    const { firstName, lastName, companyName, email, password } = values;
    try {
      if (userData) {
        if (!firstName || !lastName || !companyName || !email) {
          toast.error("All fields except password are required.");
          return;
        }  
        const finalPassword = password ? password : userData.password;
        await updateUser({
          userId: userData.userId,
          firstName,
          lastName,
          companyName,
          email,
          password: finalPassword,
          isVerified: true,
        });
        
        toast.success("Profile updated successfully!");
        setTimeout(() => {
          navigate(`/profile`);
        }, 2000);
      } else {
        // Create new account logic
        await addUser({ firstName, lastName, companyName, email, password, isVerified: false });
        const otp = Math.floor(1000 + Math.random() * 9000);
        localStorage.setItem(
          "RegistrationOtp",
          JSON.stringify({ otp: otp.toString(), email: email })
        );
        navigate(`/verify-otp`);
      }
    } catch (error) {
      console.error("Profile update error:", error);
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || "Error updating profile.");
      } else {
        toast.error(userData ? "Error updating profile." : "You already have an account.");
      }
    }
  };

  /*------------------  Toggle Password Visibility  ----------------------*/
  const togglePasswordVisibility = (field) => {
    setShowPassword((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  return (
    <>
      <div className="ScrollableContent !max-h-[calc(100vh-110px)]">
      <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 3000,
      }}
      />
        <Formik
        //  innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={createAccountSchema}
          onSubmit={handleCreateAccount}
          validateOnBlur={false}
          validateOnChange={false}
        >
          {({ values, handleChange }) => (
            <Form className="space-y-4 flex flex-col flex-grow">
              <div className=" flex flex-col my-auto gap-[30px]">
                <div className=' flex flex-col gap-2 mt-auto'>
                  <h1 className="text-BlackColor text-[20px] font-semibold text-center capitalize"> {userData ? "Update User Profile" : "Sign up to continue"}</h1>
                  <div className='text-light-blue text-xs text-center leading-[1.5]'>Fill the following form</div>
                </div>
                <div className="flex flex-col gap-[40px]">
                <div className=" flex flex-col gap-[25px]">
                  {/* <div className=" relative">
                    <label
                      htmlFor="name"
                      className="InputLabal"
                    >
                      First Name
                    </label>
                    <div className=" relative">
                    <Field
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="!pl-[32px] FromInput"
                      placeholder="John"
                      autocomplete="off"
                    />
                    <img src={User2Icon} className="left-0 absolute top-1/2 translate-y-[-50%] h18w18" />
                    </div>
                    <ErrorMessage
                      name="firstName"
                      component="div"
                      className="InputValidation"
                    />
                  </div> */}
                  {/* <div className=" relative">
                    <label
                      htmlFor="name"
                      className="InputLabal"
                    >
                      Last Name
                    </label>
                    <div className=" relative">
                    <Field
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="!pl-[32px] FromInput"
                      placeholder="Doe"
                      autocomplete="off"
                    />
                    <img src={UserListIcon} className="left-0 absolute top-1/2 translate-y-[-50%] h18w18" />
                    </div>
                    <ErrorMessage
                      name="lastName"
                      component="div"
                      className="InputValidation"
                    />
                  </div> */}
                  {/* <div className=" relative">
                    <label
                      htmlFor="name"
                      className="InputLabal"
                    >
                      Company Name
                    </label>
                    <div className=" relative">
                    <Field
                      type="text"
                      id="companyName"
                      name="companyName"
                      className="!pl-[32px] FromInput"
                      placeholder="Cipher Craft Private Limited."
                      autocomplete="off"
                    />
                    <img src={BuildingsIcon} className="left-0 absolute top-1/2 translate-y-[-50%] h18w18" />
                    </div>
                    <ErrorMessage
                      name="companyName"
                      component="div"
                      className="InputValidation"
                    />
                  </div> */}
                  <div className=" relative">
                    {/* <label
                      htmlFor="email"
                      className="InputLabal"
                    >
                      Email Address
                    </label> */}
                    <div className=" relative">
                    <Field
                      type="email"
                      id="email"
                      name="email"
                      className="FromInput"
                      placeholder="Enter your Email"
                      autocomplete="off"
                      disabled={!!userData}
                    />
                    {/* <img src={EmailIcon} className="left-[16px] absolute top-1/2 translate-y-[-50%] h18w18" /> */}
                    </div>
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="InputValidation"
                    />
                  </div>
                  {/* <div className=" relative">
                    <label
                      htmlFor="password"
                      className="InputLabal"
                    >
                      Password
                    </label>
                    <div className=" relative">
                    <Field
                      type={showPassword.password ? "text" : "password"}
                      id="password"
                      name="password"
                      className="!pl-[32px] !pr-[32px] FromInput"
                      placeholder="******"
                      autocomplete="off"
                      onChange={(e) => {
                        handleChange(e);
                        setShowConfirmPassword(!!e.target.value || !userData);
                      }}
                    />
                    <img src={PasswordIcon}  className="left-0 absolute top-1/2 translate-y-[-50%] h18w18" />
                    <button type="button" onClick={() => togglePasswordVisibility("password")} className="right-0 absolute top-1/2 translate-y-[-50%]">
                      {showPassword.password ? (
                          <img src={EyeIcon} className="h18w18" />
                        ) : (
                          <img src={EyeSlashIcon} className="h18w18" />
                        )}
                    </button>
                    </div>
                    {userData && !showConfirmPassword &&(<span className="text-yellow-500">Leave blank if do not want to change.</span>)}
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="InputValidation"
                    />
                  </div> */}
                  {/* { showConfirmPassword && (
                  <div className=" relative">
                    <label
                      htmlFor="confirm Password"
                      className="InputLabal"
                    >
                      Confirm Password
                    </label>
                    <div className=" relative">
                    <Field
                      type={showPassword.confirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      className="!pl-[32px] !pr-[32px] FromInput"
                      placeholder="******"
                      autocomplete="off"
                    />
                    <img src={PasswordIcon} className="left-0 absolute top-1/2 translate-y-[-50%] h18w18" />
                    <button type="button" onClick={() => togglePasswordVisibility("confirmPassword")}  className="right-0 absolute top-1/2 translate-y-[-50%]">
                      {showPassword.confirmPassword ? (
                          <img src={EyeIcon} className="h18w18" />
                        ) : (
                          <img src={EyeSlashIcon} className="h18w18" />
                        )}
                    </button>
                    </div>
                    <ErrorMessage
                      name="confirmPassword"
                      component="div"
                      className="InputValidation"
                    />
                  </div>
                  )} */}
                </div>
                <button className="linkedin-btn btn">
                    <img src={LinkedinIcon} className="w-[24px]" />
                    <span>Continue with Linkedin</span>
                  </button>
                </div>
              </div>
              {/* <button
                type="submit"
                className="w-full sign-in-btn btn"
                onClick={() => formikRef.current?.submitForm()}
              >
                  {userData ? "UPDATE PROFILE" : "CREATE ACCOUNT"}
              </button> */}
            </Form>
          )}
        </Formik>
      </div>
      { !userData && (
        <div className="Footer flex-col gap-[12px] pt-0">
          <div className='text-light-blue text-xs text-center leading-[1.5]'>Already have an account?</div>
          <button
          type="submit"
          className="w-full linkedin-btn btn font-semibold"
          onClick={() => navigate('/login')}
        >
          <span>Sign in</span>
        </button>
              {/* <button
                className="text-BlackColor-60 pt-[20px]"
                >
                  <span>Already have an account? </span>
                  <span className="text-BlackColor font-medium" 
                   onClick={() => navigate('/login')}
                  >Sign in</span>
              </button> */}
          </div>
        )
      }
    </>
  );
}
