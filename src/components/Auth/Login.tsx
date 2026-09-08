import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { getUser } from "../../indexedDB";
import toast, { Toaster } from 'react-hot-toast';
import EmailIcon from "../../assets/images/email-icon.png";
import PasswordIcon from "../../assets/images/password-icon.png";
import EyeSlashIcon from "../../assets/images/eye-slash.png";
import EyeIcon from "../../assets/images/eye.png";
import LinkedinIcon from "../../assets/images/linkedin-icon.png";
import { useNavigate } from "react-router-dom";

export default function login({
  setIsLoggedIn,
  // setForgotPasswordOpen
}) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /*-------------- Login Validation  Schema ---------------*/
  const loginSchema = Yup.object().shape({
    email: Yup.string()
      .email("Invalid Email Address.")
      .required("Email Address is required."),
    password: Yup.string().required("Password is required."),
  });

    /*-------------- Login User  ---------------*/
    const handleSignIn = async (values, { setErrors }) => {
      const { email, password } = values;
      try {
        const user = await getUser(email);
          if (user && user.password === password) {
            localStorage.setItem("logInUserId", user.userId);
            setIsLoggedIn(true);
            navigate("/reviews", { replace: true });
            setErrorMessage("");
          } else {
            setErrorMessage("Invalid email or password.");
            // toast.error("Invalid email or password.");
          }
      } catch (error) {
        console.error(error);
        setErrorMessage("Error fetching user.");
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
      <div className="ScrollableContent !max-h-[calc(100vh-55px)]">
        <div className="gap-[30px] flex flex-col my-auto">
          {/* title Content start */}
          {/* <div className="flex flex-col gap-[20px]"> */}
          <h1 className=" text-[28px] text-BlackColor leading-[40px] mt-[8]">
            Hey, There 👋
            <br /> Sign In with{" "}
            <span className=" uppercase font-bold">REVIL.APP</span>
          </h1>
          {/* <div className="text-BlackColor-80 text-sm">Enter your email address and password to use the app</div> */}
          {/* </div> */}
          {/* title Content end  */}
          <Formik
            initialValues={{ email: "", password: "" }} // Ensure these are plain strings
            validationSchema={loginSchema}
            onSubmit={handleSignIn}
            validateOnBlur={false}
            validateOnChange={false}
          >
            {({ resetForm }) => (
              <Form className="flex flex-col gap-[30px]">
                {/* from input start  */}
                <div className=" flex flex-col gap-[25px]">
                  {/* Email Address input start  */}
                  <div className="relative">
                    <label htmlFor="email" className="InputLabal">
                      Email Address
                    </label>
                    <div className=" relative">
                      <Field
                        type="email"
                        id="email"
                        name="email"
                        className="!pl-[32px] FromInput"
                        placeholder="sample123@gmail.com"
                        autocomplete="off"
                      />
                      {/* <img
                        src={EmailIcon}
                        className="left-0 absolute top-1/2 translate-y-[-50%] h18w18"
                      /> */}
                    </div>
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="InputValidation"
                    />
                  </div>
                  {/* Email Address input end  */}
                  {/* password input start  */}
                  <div className="relative">
                    <label htmlFor="password" className="InputLabal">
                      Password
                    </label>
                    <div className=" relative">
                      <Field
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        className="!pr-[48px] FromInput"
                        placeholder="********"
                        autocomplete="off"
                      />
                      {/* <img
                        src={PasswordIcon}
                        className="left-0 absolute top-1/2 translate-y-[-50%]"
                      /> */}
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((prevState) => !prevState)
                        }
                        className="right-[15px] absolute top-1/2 translate-y-[-50%]"
                      >
                        {showPassword ? (
                          <img src={EyeIcon} className="h18w18" />
                        ) : (
                          <img src={EyeSlashIcon} className="h18w18" />
                        )}
                      </button>
                    </div>
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="InputValidation"
                    />
                  </div>
                  {/* password input end  */}
                </div>
                {/* from input end   */}
                {/* Forget Password button start  */}
                <div className="flex justify-end">
                  <a
                    className="text-right text-sm ml-auto cursor-pointer leading-[1]"
                    onClick={() => navigate("/forgot-password")}
                    // onClick={()=>{
                    //   setForgotPasswordOpen(true);
                    //   resetForm();
                    //   setErrorMessage("");
                    // }}
                  >
                    Forgot Password?
                  </a>
                </div>
                {errorMessage && (
                  <div className="InputValidation text-center">
                    {errorMessage}
                  </div>
                )}
                {/* Forget Password button end  */}
                <div className=" flex flex-col ">
                  {/* SIGN IN button start  */}
                  <button type="submit" className="w-full sign-in-btn btn">
                    SIGN IN
                  </button>
                  <div className="Footer flex-col gap-0 pt-0">
                    <button type="button" className="text-BlackColor-60 pt-[20px]">
                      <span>Don't have an account? </span>
                      <span
                        className="text-BlackColor font-medium"
                        onClick={() => navigate("/signup")}
                      >
                        Sign Up
                      </span>
                    </button>
                  </div>
                  {/* SIGN IN button end  */}
                  {/* Or Separator start  */}
                  {/* <div className="OrSeparator">OR</div> */}
                  {/* Or Separator end  */}
                  {/* linkedin buttn start  */}
                  {/* <button className="linkedin-btn btn">
                    <img src={LinkedinIcon} />
                    <span>Continue with Linkedin</span>
                  </button> */}
                  
                  {/* linkedin button end  */}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
}
