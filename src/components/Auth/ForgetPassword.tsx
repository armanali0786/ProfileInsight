import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import EmaiIcon from "../../assets/images/email-icon.png";
import PasswordIcon from "../../assets/images/password-icon.png";
import * as Yup from "yup";
import EyeSlashIcon from "../../assets/images/eye-slash.png";
import EyeIcon from "../../assets/images/eye.png";
import { getUser, updateUserPassword } from "../../indexedDB";
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from "react-router-dom";

export default function ForgetPassword({
  forgotPasswordSteps,
  setForgotPasswordSteps,
}) {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  // const [step, setStep] = useState(1);
  const [storedOtp, setStoredOtp] = useState(null);
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  /*------------------  Show & Hide Password Visibility  ----------------------*/
  const togglePasswordVisibility = (field) => {
    setShowPassword((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  /*------------------  Forgot Password Email Validation  ----------------------*/
  const forgotschema = Yup.object().shape({
    email: Yup.string()
      .email("Invalid Email Address.")
      .required("Email Address is required."),
  });

  /*------------------  Forgot Password Password Validation  ----------------------*/
  const forgotPasswordSchema = Yup.object().shape({
    // oldPassword: Yup.string()
    //   .min(8, "Password must be at least 8 characters long.")
    //   .matches(
    //     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    //     "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    //   )
    //   .required("Password is required."),
    newPassword: Yup.string()
      .min(6, "New Password must be at least 6 characters long.")
      .required("New Password is required."),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword")], "Confrim Passwords must match.")
      .required("Confirm Password is required."),
  });

  /*------------------  Forgot Password OTP Validation  ----------------------*/
  const otpSchema = Yup.object().shape({
    otp1: Yup.string()
      .matches(/^\d$/, "Must be a single digit.")
      .required("Required."),
    otp2: Yup.string()
      .matches(/^\d$/, "Must be a single digit.")
      .required("Required."),
    otp3: Yup.string()
      .matches(/^\d$/, "Must be a single digit.")
      .required("Required."),
    otp4: Yup.string()
      .matches(/^\d$/, "Must be a single digit.")
      .required("Required."),
  });

  /*------------------  SubmitEMail to get Otp   ----------------------*/
  const SubmitEmail = async (values, { setErrors }) => {
    const { email } = values;
    try {
      const user = await getUser(email);
      if (user && user.email === email) {
        const otp = Math.floor(1000 + Math.random() * 9000);
        // Store the OTP in local storage
        localStorage.setItem(
          "resetPasswordData",
          JSON.stringify({ otp: otp.toString(), email: email })
        );
        setForgotPasswordSteps(2);
        setErrorMessage("");
      } else {
        setErrorMessage("Invalid Email Address.");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Error fetching user.");
    }
  };

  /*------------------ Store Otp to LocalStorage  ----------------------*/
  useEffect(() => {
    // Retrieve the correct OTP from local storage
    const resetPasswordData = JSON.parse(
      localStorage.getItem("resetPasswordData")
    );
    const GeneratedOtp = resetPasswordData?.otp;
    setStoredOtp(GeneratedOtp);
  });

  /*------------------ Submit Otp and Validate Otp to Change Password  ----------------------*/
  const handleSubmitOtp = (values, { setSubmitting, setErrors }) => {
    const { otp1, otp2, otp3, otp4 } = values;
    // Check if any OTP field is empty
    if (!otp1 || !otp2 || !otp3 || !otp4) {
      setErrorMessage("Please enter a valid OTP.");
      setSubmitting(false);
      return;
    }
    const otp = `${otp1}${otp2}${otp3}${otp4}`;
    // Check if OTP is valid
    if (!/^\d{4}$/.test(otp)) {
      setErrorMessage("Please enter a valid OTP.");
      setSubmitting(false);
      return;
    }
    // Simulate OTP validation
    if (otp === storedOtp) {
      setErrorMessage("");
      setForgotPasswordSteps(3);
    } else {
      setErrorMessage("Invalid OTP, Please try again.");
    }
    setSubmitting(false);
  };

  /*------------------ Submit Password to Change New Password  ----------------------*/
  const handleSubmitNewPassword = async (
    values,
    { setSubmitting, setErrors }
  ) => {
    const { confirmPassword, newPassword } = values;
    const resetPasswordData = JSON.parse(
      localStorage.getItem("resetPasswordData")
    );
    const email = resetPasswordData?.email;

    try {
      const user = await getUser(email);
      if (!user) {
        setErrors({ email: "User not found." });
        setSubmitting(false);
        return;
      }
      const { password } = user;

      if (newPassword === password) {
        setErrorMessage(
          "New password cannot be the same as the previous used password."
        );
      } else if (newPassword !== confirmPassword) {
        setErrorMessage("Passwords must match.");
      } else {
        const updatedUser = { ...user, password: newPassword };
        await updateUserPassword(updatedUser);
        toast.success("Password Change Successfully.");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        localStorage.removeItem("resetPasswordData");
      }
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 3000,
      }}
      />
      <div className="ScrollableContent !max-h-[calc(100vh-62px)]">
        {/*-------------- Email Verification start --------------*/}
          <div
            //  className="gap-[30px] flex flex-col flex-grow"
            className={`gap-[30px] flex flex-col flex-grow ${
              forgotPasswordSteps === 1 ? "" : "hidden"
            }`}
          >
            <Formik
              initialValues={{ email: "" }}
              validationSchema={forgotschema}
              onSubmit={SubmitEmail}
              validateOnBlur={false}
              validateOnChange={false}
            >
              {({ isSubmitting }) => (
                <>
                  <Form className="flex flex-col gap-[30px] flex-grow">
                    <div className="gap-[30px] flex flex-col flex-grow my-auto">
                      {/* title Content start */}
                      <h1 className=" text-[28px] text-BlackColor leading-[40px] mt-auto">
                        Forgot Password?
                      </h1>
                      {/* title Content end  */}
                      {/* Forget Password? start */}
                      <div className=" mb-auto">
                        <label htmlFor="email" className="InputLabal">
                          Enter Your Email Address
                        </label>
                        <div className=" relative">
                          <Field
                            type="email"
                            id="email"
                            name="email"
                            className="FromInput !pl-[32px]"
                            placeholder="sample123@gmail.com"
                            autoComplete="off"
                          />
                          <img
                            src={EmaiIcon}
                            className="left-0 absolute top-1/2 translate-y-[-50%]"
                          />
                        </div>
                        <ErrorMessage
                          name="email"
                          component="div"
                          className="InputValidation"
                        />
                        {errorMessage && (
                          <div className="InputValidation text-center">
                            {errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Forget Password? end */}
                    <div className="Footer !px-0 flex flex-col gap-[20px] mt-0">
                      {/* SIGN IN button start  */}
                      <button type="submit" className="w-full sign-in-btn btn">
                        SUBMIT
                      </button>
                      {/* SIGN IN button end  */}
                    </div>
                  </Form>
                </>
              )}
            </Formik>
          </div>
        {/*-------------- Email Verification end  --------------*/}

        {/*-------------- OTP Screen Start --------------*/}
          <div
            // className="gap-[30px] flex flex-col flex-grow"
            className={`gap-[30px] flex flex-col flex-grow ${
              forgotPasswordSteps === 2 ? "" : "hidden"
            }`}
          >
            <Formik
              initialValues={{ otp1: "", otp2: "", otp3: "", otp4: "" }}
              validationSchema={otpSchema}
              onSubmit={handleSubmitOtp}
              validateOnBlur={false}
              validateOnChange={false}
            >
              {({ isSubmitting, errors, values }) => {
                return (
                  <Form className="flex flex-col gap-[30px] flex-grow">
                    {/* title Content start */}
                    <h1 className=" text-[28px] text-BlackColor leading-[40px] mt-auto">
                      OTP Code
                    </h1>
                    {/* title Content end  */}
                    <div>
                      <label htmlFor="email" className="InputLabel">
                        Please Enter a Valid OTP :- {storedOtp}
                      </label>
                      <div className="relative flex items-center justify-between gap-[20px]">
                        {[1, 2, 3, 4].map((num) => (
                          <Field
                            key={num}
                            type="text"
                            id={`otp${num}`}
                            name={`otp${num}`}
                            className="FromInput text-center"
                            placeholder=""
                            autoComplete="off"
                            maxLength={1}
                            onKeyUp={(e) => {
                              if (e.key === "Backspace") {
                                if (num > 1) {
                                  const prevField = document.getElementById(
                                    `otp${num - 1}`
                                  );
                                  if (prevField) {
                                    prevField.focus();
                                  }
                                }
                              } else if (e.key >= "0" && e.key <= "9") {
                                if (num < 4) {
                                  const nextField = document.getElementById(
                                    `otp${num + 1}`
                                  );
                                  if (nextField) {
                                    nextField.focus();
                                  }
                                }
                              }
                            }}
                            onInput={(e) => {
                              // Only allow number input
                              if (!/^[0-9]$/.test(e.target.value)) {
                                e.target.value = ""; // Clear invalid input
                              }
                            }}
                          />
                        ))}
                      </div>
                      {errorMessage && (
                        <div className="InputValidation text-center">
                          {errorMessage}
                        </div>
                      )}
                      <div className="text-right cursor-pointer mt-[30px]">
                        Resend OTP
                      </div>
                    </div>
                    <div className="Footer !px-0 flex flex-col gap-[20px] mt-auto">
                      <button type="submit" className="w-full sign-in-btn btn">
                        SUBMIT
                      </button>
                    </div>
                  </Form>
                );
              }}
            </Formik>
          </div>
        {/*-------------- OTP Screen End ------------------*/}

        {/*----------------- ForgetPassword start -----------------*/}
          <div
            // className="gap-[30px] flex flex-col flex-grow"
            className={`gap-[30px] flex flex-col flex-grow ${
              forgotPasswordSteps === 3 ? "" : "hidden"
            }`}
          >
            <Formik
              initialValues={{ confirmPassword: "", newPassword: "" }}
              validationSchema={forgotPasswordSchema}
              onSubmit={handleSubmitNewPassword}
              validateOnBlur={false}
              validateOnChange={false}
            >
              {({ isSubmitting }) => (
                <Form className="flex flex-col gap-[30px] flex-grow">
                  {/* { !forgotPasswordOpen && (
                    <div className="">
                      <label htmlFor="email" className="InputLabal">
                        Old Password
                      </label>
                      <div className=" relative">
                        <Field
                          type="password"
                          name="oldPassword"
                          className="FromInput !pl-[32px]"
                          placeholder="******"
                          autoComplete="off"
                        />
                        <img
                          src={PasswordIcon}
                          className="left-0 absolute top-1/2 translate-y-[-50%]"
                        />
                        <button type="button" className="right-0 absolute top-1/2 translate-y-[-50%]">
                        <img src={EyeIcon} className="h18w18" /> 
                        <img src={EyeSlashIcon} className="h18w18" />
                      </button>
                      </div>
                      <ErrorMessage
                        name="password"
                        component="div"
                        className="InputValidation"
                      />
                    </div>
                    )} */}
                  {/* title Content start */}
                  <div className="flex flex-col gap-[30px] my-auto">
                    <h1 className=" text-[28px] text-BlackColor leading-[40px]">
                      Forget Password?
                    </h1>
                    {/* title Content end  */}
                    <div className="">
                      <label htmlFor="email" className="InputLabal">
                        New Password
                      </label>
                      <div className=" relative">
                        <Field
                          type={showPassword.newPassword ? "text" : "password"}
                          name="newPassword"
                          className="!pl-[32px] !pr-[32px] FromInput"
                          placeholder="******"
                          autoComplete="off"
                        />
                        <img
                          src={PasswordIcon}
                          className="left-0 absolute top-1/2 translate-y-[-50%]"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("newPassword")}
                          className="right-0 absolute top-1/2 translate-y-[-50%]"
                        >
                          {showPassword.newPassword ? (
                            <img src={EyeIcon} className="h18w18" />
                          ) : (
                            <img src={EyeSlashIcon} className="h18w18" />
                          )}
                        </button>
                      </div>
                      <ErrorMessage
                        name="newPassword"
                        component="div"
                        className="InputValidation"
                      />
                    </div>
                    <div className="">
                      <label htmlFor="email" className="InputLabal">
                        Confirm Password
                      </label>
                      <div className=" relative">
                        <Field
                          type={
                            showPassword.confirmPassword ? "text" : "password"
                          }
                          name="confirmPassword"
                          className="!pl-[32px] !pr-[32px] FromInput"
                          placeholder="******"
                          autoComplete="off"
                        />
                        <img
                          src={PasswordIcon}
                          className="left-0 absolute top-1/2 translate-y-[-50%]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            togglePasswordVisibility("confirmPassword")
                          }
                          className="right-0 absolute top-1/2 translate-y-[-50%]"
                        >
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
                  </div>
                  <div className="Footer !px-0 flex flex-col gap-[20px] mt-0">
                    {/* SIGN IN button start  */}
                    <button type="submit" className="w-full sign-in-btn btn">
                      SUBMIT
                    </button>
                    {/* SIGN IN button end  */}
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        {/*----------------- ForgetPassword end  -----------------*/}
      </div>
    </>
  );
}
